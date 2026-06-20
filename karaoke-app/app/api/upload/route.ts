// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export const runtime = "nodejs";

async function parseMultipartManual(req: NextRequest) {
  const formData = await req.formData();
  return formData;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await parseMultipartManual(req);

    const thumbnail = formData.get("thumbnail") as File | null;
    const background = formData.get("background") as File | null;
    const audio = formData.get("audio") as File | null;

    if (!thumbnail || !background || !audio) {
      return NextResponse.json(
        { error: "Missing required files: thumbnail, background, audio" },
        { status: 400 }
      );
    }

    // Validate types
    const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!imageTypes.has(thumbnail.type)) {
      return NextResponse.json({ error: "Thumbnail must be an image (JPG, PNG, WebP)" }, { status: 400 });
    }
    if (!imageTypes.has(background.type)) {
      return NextResponse.json({ error: "Background must be an image (JPG, PNG, WebP)" }, { status: 400 });
    }
    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Audio must be an audio file (MP3, WAV)" }, { status: 400 });
    }

    // Size limits
    const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
    const MAX_AUDIO = 60 * 1024 * 1024; // 60MB
    if (thumbnail.size > MAX_IMAGE) return NextResponse.json({ error: "Thumbnail too large (max 10MB)" }, { status: 400 });
    if (background.size > MAX_IMAGE) return NextResponse.json({ error: "Background too large (max 10MB)" }, { status: 400 });
    if (audio.size > MAX_AUDIO) return NextResponse.json({ error: "Audio too large (max 60MB)" }, { status: 400 });

    // Create job directory
    const jobId = uuidv4();
    const jobDir = join("/tmp", "karaoke", jobId);
    await mkdir(jobDir, { recursive: true });

    // Save audio
    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const audioPath = join(jobDir, "audio.mp3");
    await writeFile(audioPath, audioBuffer);

    // Process & save thumbnail (resize to 1920x1080)
    const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer());
    const thumbPath = join(jobDir, "thumbnail.png");
    await sharp(thumbBuffer)
      .resize(1920, 1080, { fit: "cover", position: "center" })
      .png()
      .toFile(thumbPath);

    // Process & save background
    const bgBuffer = Buffer.from(await background.arrayBuffer());
    const bgPath = join(jobDir, "background.png");
    await sharp(bgBuffer)
      .resize(1920, 1080, { fit: "cover", position: "center" })
      .png()
      .toFile(bgPath);

    return NextResponse.json({
      jobId,
      status: "ready",
      paths: {
        thumbnail: thumbPath,
        background: bgPath,
        audio: audioPath,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
