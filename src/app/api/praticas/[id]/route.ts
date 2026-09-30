import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mimeFromName, readUploadBytes } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const submission = await prisma.practiceSubmission.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
  if (!submission?.filePath) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });

  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!viewer || (viewer.role !== "ADMIN" && submission.userId !== session.user.id)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { bytes } = await readUploadBytes(submission.filePath);
  const name = submission.fileName || "pratica";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeFromName(name),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
