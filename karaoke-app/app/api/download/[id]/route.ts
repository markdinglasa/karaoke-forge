// app/api/download/[id]/route.ts
import { getJob } from "@/lib/job-store";
import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "done" || !job.outputPath) {
    return NextResponse.json({ error: "Video not ready yet" }, { status: 425 });
  }

  const outputPath = join("/tmp", "karaoke", id, "output.mp4");

  try {
    const stat = statSync(outputPath);
    const fileSize = stat.size;

    // Node.js readable stream → Web ReadableStream
    const nodeStream = createReadStream(outputPath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: string | Buffer) => {
          controller.enqueue(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk,
          );
        });
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileSize),
        "Content-Disposition": `attachment; filename="karaoke-${id.slice(0, 8)}.mp4"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Video file not found on disk" },
      { status: 404 },
    );
  }
}
