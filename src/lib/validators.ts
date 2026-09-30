import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Informe um e-mail válido.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-Za-z]/, "A senha precisa ter uma letra.")
  .regex(/[0-9]/, "A senha precisa ter um número.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

export const internSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  email: emailSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  email: emailSchema,
});

export const internUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Informe o nome."),
  email: emailSchema,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não confere com a nova senha.",
    path: ["confirmPassword"],
  });

export const trackSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do blend."),
  description: z.string().trim().min(2, "Informe a descrição."),
  published: z.boolean(),
});

export const moduleSchema = z.object({
  trackId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título do módulo."),
  description: z.string().trim().default(""),
  order: z.coerce.number().int().min(1, "A ordem começa em 1."),
});

export const lessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título da dose."),
  description: z.string().trim().default(""),
  order: z.coerce.number().int().min(1, "A ordem começa em 1."),
  durationMinutes: z.coerce.number().int().min(1, "Informe a duração.").max(600),
  type: z.enum(["VIDEO", "LEITURA", "PRATICA", "CONSULTA"], { message: "Escolha o tipo da dose." }),
  consultaAtiva: z.boolean(),
  videoUrl: z.string().trim().optional().default(""),
  embedUrl: z.string().trim().optional().default(""),
  embedMode: z.enum(["local", "modal"]).default("local"),
});

export const questionSchema = z.object({
  lessonId: z.string().min(1),
  prompt: z.string().trim().min(5, "Escreva o enunciado."),
  explanation: z.string().trim().default(""),
  correctIndex: z.coerce.number().int().min(0),
});

export const practicalSchema = z.object({
  lessonId: z.string().min(1),
  prompt: z.string().trim().min(5, "Escreva o enunciado."),
  explanation: z.string().trim().default(""),
  repoUrl: z.string().trim().url("Informe um link de repositório válido."),
});

export const challengeSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do desafio."),
  prompt: z.string().trim().min(5, "Escreva as especificações."),
  published: z.boolean(),
});

export const activitySchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título da atividade."),
  description: z.string().trim().default(""),
});

export const activityCodeSchema = z.object({
  activityId: z.string().min(1),
  prompt: z.string().trim().min(5, "Escreva o enunciado."),
  explanation: z.string().trim().default(""),
  language: z.enum(["java", "python"], { message: "Escolha Java ou Python." }),
  starterCode: z.string().max(8000, "O código inicial passa de 8000 caracteres.").default(""),
});

export const planSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da receita."),
  weekLabel: z.string().trim().min(2, "Informe a semana."),
  goal: z.string().trim().min(2, "Informe a meta."),
  forAll: z.boolean(),
});

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Verifique os dados do formulário.";
}
