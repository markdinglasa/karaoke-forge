import { BASE_URL } from "@/lib/config";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const audioPath = join("/tmp", "karaoke", jobId, "audio.mp3");

    // Read audio file
    let audioBuffer: Buffer;
    try {
      audioBuffer = await readFile(audioPath);
    } catch {
      return NextResponse.json(
        { error: "Audio file not found for this job" },
        { status: 404 },
      );
    }

    // Build form data for Python microservice
    const formData = new FormData();
    formData.append(
      "audio",
      new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }),
      "audio.mp3",
    );

    // Call Python microservice's transcribe endpoint
    const response = await fetch(`${BASE_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Microservice returned ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return NextResponse.json({ lyrics: data.lyrics });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Auto-transcribe failed";
    console.error("[auto-transcribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
