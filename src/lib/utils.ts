import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function progressPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function formatMinutes(total: number) {
  const safe = Math.max(0, total);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDay(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function lessonTypeLabel(type: string) {
  if (type === "VIDEO") return "Vídeo";
  if (type === "LEITURA") return "Leitura";
  if (type === "PRATICA") return "Prática";
  if (type === "CONSULTA") return "Consulta";
  return type;
}

export function roleLabel(role: string) {
  return role === "ADMIN" ? "Tech lead" : "Estagiário";
}

export function parseDay(value: string | undefined, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function readMetadata(raw: string) {
  try {
    const data = JSON.parse(raw) as { titulo?: string; nota?: number; arquivo?: string; escala?: number };
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function describeActivity(action: string, metadata: string) {
  const meta = readMetadata(metadata);
  const title = meta.titulo ? `: ${meta.titulo}` : "";
  if (action === "ACESSO") return "Entrou na plataforma";
  if (action === "DOSE_CONCLUIDA") return `Concluiu a dose${title}`;
  if (action === "TENTATIVA") {
    const score = typeof meta.nota === "number" ? ` (${Math.round(meta.nota)}%)` : "";
    return `Enviou exercício${title}${score}`;
  }
  if (action === "DOWNLOAD") return `Baixou material${meta.arquivo ? `: ${meta.arquivo}` : ""}`;
  if (action === "SENHA_ALTERADA") return "Alterou a senha";
  if (action === "PRATICA") return `Enviou prática${title}`;
  if (action === "PRATICA_NOTA") {
    const score = typeof meta.nota === "number" ? ` (${Math.round(meta.nota)}%)` : "";
    return `Recebeu nota da prática${title}${score}`;
  }
  if (action === "ATIVIDADE") return `Concluiu atividade${title}`;
  if (action === "DESAFIO") return `Enviou desafio${title}`;
  if (action === "DESAFIO_NOTA") {
    const score = typeof meta.nota === "number" ? ` (${Math.round(meta.nota)})` : "";
    return `Recebeu nota do desafio${title}${score}`;
  }
  return action;
}
