import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mimeFromName, readUploadBytes } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });

  const { bytes } = await readUploadBytes(material.filePath);
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "DOWNLOAD",
      metadata: JSON.stringify({ arquivo: material.title, titulo: material.title }),
    },
  });

  const encoded = encodeURIComponent(material.fileName);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": material.mimeType || mimeFromName(material.fileName),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
    },
  });
}
