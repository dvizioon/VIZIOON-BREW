"use client";

import { useState } from "react";
import { runActivityCode, submitActivity } from "@/actions/activities";
import { CodeField } from "@/components/code-editor";
import { ActionForm, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui";

type QuestionView = {
  id: string;
  prompt: string;
  language: string;
  starterCode: string;
  caseCount: number;
};

export function ActivityForm({
  activityId,
  questions,
  done,
}: {
  activityId: string;
  questions: QuestionView[];
  done: boolean;
}) {
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((question) => [question.id, question.starterCode])),
  );
  const [runs, setRuns] = useState<
    Record<string, { error?: string; passed?: number; total?: number; cases?: { index: number; passed: boolean; stdout: string; stderr: string; message: string }[] }>
  >({});
  const [runningId, setRunningId] = useState<string | null>(null);

  async function executar(questionId: string) {
    setRunningId(questionId);
    const result = await runActivityCode(questionId, codes[questionId] ?? "");
    setRuns((current) => ({ ...current, [questionId]: result }));
    setRunningId(null);
  }

  return (
    <ActionForm action={submitActivity} className="grid gap-5">
      <input type="hidden" name="activityId" value={activityId} />
      {done ? <p className="text-sm">Esta atividade já foi concluída. Você pode enviar de novo.</p> : null}
      {questions.map((question, index) => (
        <article key={question.id} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Questão {index + 1}</p>
          <p className="mt-1 whitespace-pre-wrap font-medium">{question.prompt}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {question.language === "python" ? "Python" : "Java 15, classe Main"}. {question.caseCount}{" "}
            {question.caseCount === 1 ? "teste oculto" : "testes ocultos"}.
          </p>
          <div className="mt-3">
            <CodeField
              name={`code_${question.id}`}
              language={question.language === "python" ? "python" : "java"}
              value={codes[question.id] ?? ""}
              onChange={(next) => setCodes((current) => ({ ...current, [question.id]: next }))}
            />
          </div>
          <div className="mt-3">
            <Button type="button" variant="outline" disabled={runningId === question.id} onClick={() => executar(question.id)}>
              {runningId === question.id ? "Executando..." : "Executar testes"}
            </Button>
          </div>
          {runs[question.id]?.error ? <p className="mt-2 text-sm text-destructive">{runs[question.id]?.error}</p> : null}
          {runs[question.id]?.cases ? (
            <ul className="mt-3 grid gap-2">
              <li className="text-sm">
                {runs[question.id]?.passed} de {runs[question.id]?.total} testes passaram.
              </li>
              {runs[question.id]?.cases?.map((item) => (
                <li key={item.index} className="rounded-xl bg-muted px-3 py-2 text-xs">
                  <p className={item.passed ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}>
                    Caso {item.index}: {item.message}
                  </p>
                  {item.stdout ? <pre className="mt-2 whitespace-pre-wrap">Saída: {item.stdout}</pre> : null}
                  {item.stderr ? <pre className="mt-2 whitespace-pre-wrap">Erro: {item.stderr}</pre> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
      <SubmitButton>Entregar atividade</SubmitButton>
    </ActionForm>
  );
}
