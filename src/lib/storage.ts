import { createReadStream } from "fs";
import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";

function storageRoot() {
  const configured = process.env.LOCAL_STORAGE_PATH?.trim() || "./storage";
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

export const UPLOAD_ROOT = storageRoot();

const ALLOWED = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".zip",
  ".txt",
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".mp4",
  ".webm",
  ".java",
]);

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".java": "text/plain; charset=utf-8",
};

export function safeJoin(relativePath: string) {
  const parts = relativePath.split(/[/\\]/).filter((part) => part && part !== "." && part !== "..");
  const resolved = path.resolve(UPLOAD_ROOT, ...parts);
  const root = path.resolve(UPLOAD_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return resolved;
}

export function mimeFromName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return MIME[extension] ?? "application/octet-stream";
}

export async function saveUpload(file: File, folder: string, allowed: string[]) {
  if (!file || file.size <= 0) throw new Error("Selecione um arquivo.");
  if (file.size > 50 * 1024 * 1024) throw new Error("O arquivo passa de 50 MB.");

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(extension) || !allowed.includes(extension)) {
    throw new Error("Tipo de arquivo não permitido.");
  }

  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_").slice(-80);
  const relative = `${folder}/${id}-${safeName}`;
  const absolute = safeJoin(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()));

  return {
    relative,
    fileName: file.name,
    mimeType: file.type || mimeFromName(file.name),
    sizeBytes: file.size,
  };
}

export async function removeUpload(relativePath: string | null | undefined) {
  if (!relativePath) return;
  await rm(safeJoin(relativePath), { force: true });
}

export async function readUpload(relativePath: string) {
  const absolute = safeJoin(relativePath);
  const info = await stat(absolute);
  return { absolute, info };
}

export function streamUpload(absolute: string, start?: number, end?: number) {
  return Readable.toWeb(createReadStream(absolute, { start, end })) as ReadableStream;
}

export async function readUploadBytes(relativePath: string) {
  const { absolute, info } = await readUpload(relativePath);
  return { absolute, info, bytes: await readFile(absolute) };
}
