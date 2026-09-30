"use client";

import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { completeFromList, ifNotIn, snippetCompletion, type Completion } from "@codemirror/autocomplete";
import { java, javaLanguage } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { tooltips } from "@codemirror/view";
import { useTheme } from "next-themes";
import { Field, Input, Select } from "@/components/ui";

const javaKeywords = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue",
  "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if",
  "implements", "import", "instanceof", "int", "interface", "long", "new", "package", "private",
  "protected", "public", "return", "short", "static", "super", "switch", "this", "throw", "throws",
  "try", "var", "void", "while", "true", "false", "null",
].map((label): Completion => ({ label, type: "keyword" }));

const javaTypes = ["String", "System", "Scanner", "Integer", "Double", "Math", "ArrayList", "List", "HashMap", "Map", "Arrays", "Exception", "Optional"].map(
  (label): Completion => ({ label, type: "type" }),
);

const javaSnippets = [
  snippetCompletion("public static void main(String[] args) {\n    ${}\n}", {
    label: "main",
    detail: "método main",
    type: "keyword",
  }),
  snippetCompletion("System.out.println(${});", {
    label: "sout",
    detail: "imprimir linha",
    type: "function",
  }),
  snippetCompletion("Scanner ${entrada} = new Scanner(System.in);", {
    label: "scanner",
    detail: "ler o teclado",
    type: "function",
  }),
  snippetCompletion("for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n    ${}\n}", {
    label: "fori",
    detail: "for com índice",
    type: "keyword",
  }),
  snippetCompletion("if (${}) {\n    ${}\n}", {
    label: "iff",
    detail: "if",
    type: "keyword",
  }),
  snippetCompletion("public class ${Nome} {\n    ${}\n}", {
    label: "classp",
    detail: "classe pública",
    type: "keyword",
  }),
];

const javaAutocomplete = javaLanguage.data.of({
  autocomplete: ifNotIn(
    ["LineComment", "BlockComment", "StringLiteral", "TextBlock", "CharacterLiteral"],
    completeFromList([...javaKeywords, ...javaTypes, ...javaSnippets]),
  ),
});

function editorExtensions(language: "java" | "python") {
  const languageSupport = language === "python" ? [python()] : [java(), javaAutocomplete];
  return [...languageSupport, tooltips({ parent: document.body })];
}

const starterJava = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
    }
}
`;

export function CodeField({
  name,
  value,
  defaultValue = "",
  onChange,
  language,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  language: "java" | "python";
}) {
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;

  useEffect(() => setReady(true), []);

  function change(next: string) {
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-card">
      {name ? <input type="hidden" name={name} value={text} /> : null}
      {ready ? (
        <CodeMirror
          value={text}
          height="280px"
          theme={resolvedTheme === "dark" ? oneDark : "light"}
          extensions={editorExtensions(language)}
          basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true, closeBrackets: true, bracketMatching: true }}
          onChange={change}
        />
      ) : (
        <div className="min-h-56" />
      )}
    </div>
  );
}

export function CodeStarter() {
  const [language, setLanguage] = useState<"java" | "python">("java");
  const [code, setCode] = useState(starterJava);

  return (
    <>
      <Field label="Linguagem">
        <Select name="language" value={language} onChange={(event) => setLanguage(event.target.value === "python" ? "python" : "java")}>
          <option value="java">Java 15</option>
          <option value="python">Python</option>
        </Select>
      </Field>
      <Field label="Tentativas de execução" hint="Vazio não limita. Só conta o botão de executar desta questão.">
        <Input name="maxAttempts" type="number" min={1} max={20} />
      </Field>
      <CodeField name="starterCode" value={code} onChange={setCode} language={language} />
    </>
  );
}
