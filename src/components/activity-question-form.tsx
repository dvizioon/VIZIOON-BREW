"use client";

import { useState } from "react";
import { createActivityCode } from "@/actions/activities";
import { CodeField } from "@/components/code-editor";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Select, Textarea } from "@/components/ui";

const starterJava = `public class Main {\n    public static void main(String[] args) {\n    }\n}\n`;

export function ActivityQuestionForm({ activityId }: { activityId: string }) {
  const [language, setLanguage] = useState<"java" | "python">("java");
  const [code, setCode] = useState(starterJava);
  return (
    <ActionForm action={createActivityCode} className="mt-4 grid gap-3" resetOnSuccess>
      <input type="hidden" name="activityId" value={activityId} />
      <Field label="Enunciado">
        <Textarea name="prompt" placeholder="Faça uma calculadora que leia dois números e a operação." required />
      </Field>
      <Field label="Explicação">
        <Textarea name="explanation" />
      </Field>
      <Field label="Linguagem">
        <Select
          name="language"
          value={language}
          onChange={(event) => {
            const next = event.target.value === "python" ? "python" : "java";
            setLanguage(next);
            setCode(next === "python" ? "print('olá')\n" : starterJava);
          }}
        >
          <option value="java">Java 15, classe Main</option>
          <option value="python">Python</option>
        </Select>
      </Field>
      <Field label="Código inicial">
        <CodeField name="starterCode" language={language} value={code} onChange={setCode} />
      </Field>
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="grid gap-3 md:grid-cols-2">
          <Field label={`Entrada do teste ${index}`}>
            <Textarea name={`stdin${index}`} className="min-h-20 font-mono" />
          </Field>
          <Field label={`Saída esperada ${index}`}>
            <Textarea name={`expected${index}`} className="min-h-20 font-mono" />
          </Field>
        </div>
      ))}
      <SubmitButton>Criar questão</SubmitButton>
    </ActionForm>
  );
}
