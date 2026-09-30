import type { Metadata } from "next";
import { createPlan, deletePlan } from "@/actions/content";
import { ActionForm, SubmitButton } from "@/components/form";
import { Badge, Card, Checkbox, DatePicker, Field, Input, Textarea, Toggle } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Receitas" };

export default async function PlansPage() {
  await requireAdmin();
  const [plans, lessons, interns] = await Promise.all([
    prisma.studyPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { orderBy: { dueDate: "asc" }, include: { lesson: true } },
        assignments: { include: { user: true } },
      },
    }),
    prisma.lesson.findMany({
      orderBy: [{ module: { track: { title: "asc" } } }, { module: { order: "asc" } }, { order: "asc" }],
      include: { module: { include: { track: true } } },
    }),
    prisma.user.findMany({ where: { role: "ESTAGIARIO" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-medium">Nova receita</h2>
        <ActionForm action={createPlan} resetOnSuccess className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Título">
              <Input name="title" defaultValue="Receita da semana" required />
            </Field>
            <Field label="Semana">
              <Input name="weekLabel" placeholder="Semana de 28 de setembro" required />
            </Field>
          </div>
          <Field label="Meta">
            <Textarea name="goal" required />
          </Field>
          <Toggle name="forAll" label="Atribuir a todos os estagiários" />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Estagiários</legend>
            {interns.map((intern) => (
              <Checkbox key={intern.id} name="userId" value={intern.id} label={intern.name} />
            ))}
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Doses e prazos</legend>
            {lessons.map((lesson) => (
              <div key={lesson.id} className="grid items-center gap-2 rounded-xl border border-border p-3 text-sm md:grid-cols-[auto_1fr_180px]">
                <Checkbox name="lessonId" value={lesson.id} aria-label={lesson.title} />
                <span>
                  {lesson.title}
                  <span className="block text-xs text-muted-foreground">
                    {lesson.module.track.title} / {lesson.module.title}
                  </span>
                </span>
                <DatePicker name={`due_${lesson.id}`} ariaLabel={`Prazo de ${lesson.title}`} />
              </div>
            ))}
          </fieldset>
          <SubmitButton>Criar receita</SubmitButton>
        </ActionForm>
      </Card>
      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">{plan.title}</h2>
                <p className="text-sm text-muted-foreground">{plan.weekLabel}</p>
              </div>
              {plan.forAll ? <Badge tone="good">Todos</Badge> : <Badge>{plan.assignments.length} pessoas</Badge>}
            </div>
            <p className="mt-3 text-sm">{plan.goal}</p>
            {!plan.forAll ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {plan.assignments.map((item) => item.user.name).join(", ")}
              </p>
            ) : null}
            <ul className="mt-3 grid gap-1 text-sm">
              {plan.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.lesson.title}</span>
                  <span className="text-muted-foreground">{formatDay(item.dueDate)}</span>
                </li>
              ))}
            </ul>
            <ActionForm action={deletePlan} className="mt-4">
              <input type="hidden" name="id" value={plan.id} />
              <SubmitButton variant="destructive" confirm="Excluir esta receita?">
                Excluir receita
              </SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </div>
    </div>
  );
}
