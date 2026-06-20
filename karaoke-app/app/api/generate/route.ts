// app/api/generate/route.ts
import { ASSOptions, generateASS, LyricLine } from "@/lib/generate-ASS";
import { createJob, updateJob } from "@/lib/job-store";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { NextRequest, NextResponse } from "next/server";
import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface GenerateRequest {
  jobId: string;
  lyrics: LyricLine[];
  settings: {
    resolution: string;
    fontName: string;
    fontSize: number;
    highlightColor: string;
    introDurationSec: number;
    outlineEnabled: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { jobId, lyrics, settings } = body;

    if (!jobId || !lyrics?.length) {
      return NextResponse.json(
        { error: "Missing jobId or lyrics" },
        { status: 400 },
      );
    }

    const jobDir = join("/tmp", "karaoke", jobId);

    // Verify job directory and assets exist
    try {
      await access(join(jobDir, "audio.mp3"));
      await access(join(jobDir, "thumbnail.png"));
      await access(join(jobDir, "background.png"));
    } catch {
      return NextResponse.json(
        { error: "Job assets not found. Please upload files first." },
        { status: 404 },
      );
    }

    // Create/reset job status
    createJob(jobId);
    updateJob(jobId, {
      status: "processing",
      progress: 5,
      message: "Generating subtitles...",
    });

    // Generate ASS subtitle file
    const assOptions: ASSOptions = {
      highlightColor: settings.highlightColor || "#a855f7",
      fontName: settings.fontName || "Arial",
      fontSize: settings.fontSize || 52,
      resolution: settings.resolution || "1920x1080",
      outlineEnabled: settings.outlineEnabled !== false,
    };

    const assContent = generateASS(lyrics, assOptions);
    const assPath = join(jobDir, "lyrics.ass");
    await writeFile(assPath, assContent, "utf-8");

    updateJob(jobId, { progress: 15, message: "Building video..." });

    // Paths
    const thumbPath = join(jobDir, "thumbnail.png");
    const bgPath = join(jobDir, "background.png");
    const audioPath = join(jobDir, "audio.mp3");
    const outputPath = join(jobDir, "output.mp4");

    const [w, h] = (settings.resolution || "1920x1080").split("x").map(Number);
    const introDur = Math.max(1, settings.introDurationSec || 4);

    // Build FFmpeg pipeline asynchronously
    // We return immediately and process in background
    const generateVideo = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Complex filter:
        // 1. Loop thumbnail image for introDur seconds
        // 2. Loop background image for lyricsDuration seconds
        // 3. Concat both video parts
        // 4. Burn ASS subtitles onto the background segment
        // 5. Map audio

        ffmpeg()
          // Input 0: thumbnail looped
          .input(thumbPath)
          .inputOptions(["-loop 1", "-framerate 30", `-t ${introDur}`])
          // Input 1: background looped (infinite, let -shortest cut it)
          .input(bgPath)
          .inputOptions(["-loop 1", "-framerate 30"])
          // Input 2: audio
          .input(audioPath)
          .complexFilter([
            // Set format before scaling to prevent memory/PTS errors
            {
              filter: "format",
              options: "rgb24",
              inputs: "0:v",
              outputs: "v_thumb_fmt",
            },
            {
              filter: "format",
              options: "rgb24",
              inputs: "1:v",
              outputs: "v_bg_raw_fmt",
            },
            // Scale thumbnail to target resolution, preserving aspect ratio
            {
              filter: "scale",
              options: `${w}:${h}:force_original_aspect_ratio=decrease`,
              inputs: "v_thumb_fmt",
              outputs: "v_thumb_scale",
            },
            {
              filter: "pad",
              options: `${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
              inputs: "v_thumb_scale",
              outputs: "v_thumb",
            },
            // Scale background to target resolution, preserving aspect ratio
            {
              filter: "scale",
              options: `${w}:${h}:force_original_aspect_ratio=decrease`,
              inputs: "v_bg_raw_fmt",
              outputs: "v_bg_scale",
            },
            {
              filter: "pad",
              options: `${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
              inputs: "v_bg_scale",
              outputs: "v_bg_padded",
            },
            // Burn subtitles onto background
            {
              filter: "subtitles",
              options: { filename: assPath },
              inputs: "v_bg_padded",
              outputs: "v_bg",
            },
            // Concatenate thumbnail + background
            {
              filter: "concat",
              options: { n: 2, v: 1, a: 0 },
              inputs: ["v_thumb", "v_bg"],
              outputs: "v_out",
            },
          ])
          .outputOptions([
            "-map [v_out]",
            "-map 2:a",
            "-c:v libx264",
            "-preset fast",
            "-crf 22",
            "-pix_fmt yuv420p",
            "-c:a aac",
            "-b:a 192k",
            "-shortest",
            "-movflags +faststart",
          ])
          .output(outputPath)
          .on("progress", (prog) => {
            const pct = Math.min(90, 15 + (prog.percent || 0) * 0.75);
            updateJob(jobId, {
              progress: Math.round(pct),
              message: `Rendering... ${Math.round(prog.percent || 0)}%`,
            });
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    };

    // Fire-and-forget — the client polls /api/status/:id
    generateVideo()
      .then(() => {
        updateJob(jobId, {
          status: "done",
          progress: 100,
          message: "Video ready!",
          outputPath,
        });
      })
      .catch((err: Error) => {
        console.error("[generate]", err.message);
        updateJob(jobId, {
          status: "error",
          message: err.message,
        });
      });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
