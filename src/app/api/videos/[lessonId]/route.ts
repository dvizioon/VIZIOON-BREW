import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mimeFromName, safeJoin, streamUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { lessonId } = await context.params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson?.videoPath) return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });

  const absolute = safeJoin(lesson.videoPath);
  const info = await stat(absolute);
  const type = mimeFromName(lesson.videoPath);
  const range = request.headers.get("range");

  if (range) {
    const [startText, endText] = range.replace(/bytes=/, "").split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : Math.min(start + 1_000_000, info.size - 1);
    if (!Number.isFinite(start) || start < 0 || start >= info.size || end < start) {
      return new NextResponse(null, { status: 416 });
    }
    return new NextResponse(streamUpload(absolute, start, end), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
        "Cache-Control": "private, no-store",
      },
    });
  }

  return new NextResponse(streamUpload(absolute), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}
