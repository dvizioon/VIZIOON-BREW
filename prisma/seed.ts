import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function day(offset: number, end = false) {
  const date = new Date();
  date.setHours(end ? 23 : 12, end ? 59 : 0, end ? 59 : 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function crc32(buffer: Buffer) {
  let value = ~0;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
    }
  }
  return ~value >>> 0;
}

function makeZip(name: string, data: Buffer) {
  const checksum = crc32(data);
  const nameBuffer = Buffer.from(name);
  const local = Buffer.alloc(30 + nameBuffer.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuffer.length, 26);
  nameBuffer.copy(local, 30);

  const central = Buffer.alloc(46 + nameBuffer.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuffer.length, 28);
  central.writeUInt32LE(0, 42);
  nameBuffer.copy(central, 46);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length + data.length, 16);
  return Buffer.concat([local, data, central, end]);
}

function makePdf(title: string) {
  const safe = title.replace(/[()\\]/g, "");
  const content = `BT /F1 18 Tf 72 700 Td (${safe}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n")];
  const offsets: number[] = [];
  let position = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(position);
    const piece = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`);
    chunks.push(piece);
    position += piece.length;
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  const trailer = Buffer.from(
    `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`,
  );
  return Buffer.concat([...chunks, trailer]);
}

const curriculum = [
  {
    title: "Introdução à linguagem",
    description: "Primeiros conceitos para ler e executar um programa Java.",
    lessons: [
      {
        title: "O que é Java",
        type: "VIDEO",
        duration: 15,
        videoUrl: "https://www.youtube.com/watch?v=A74TOX803D0",
        description: `## Objetivo
Entender onde um programa Java roda.

### Ideias centrais
- O código fonte fica em arquivos \`.java\`.
- O compilador \`javac\` gera bytecode.
- A JVM executa esse bytecode.

### Para observar
Localize o método \`main\` em um arquivo de exemplo.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Para onde o compilador javac traduz o código fonte?",
            explanation: "O javac gera bytecode em arquivos .class. A JVM executa esse bytecode.",
            options: [
              { text: "Bytecode executado pela JVM", correct: true },
              { text: "Código de máquina exclusivo de Windows", correct: false },
              { text: "HTML interpretado pelo navegador", correct: false },
              { text: "Um script de shell", correct: false },
            ],
          },
          {
            type: "MULTIPLA",
            prompt: "Qual é a assinatura correta do método principal?",
            explanation: "A JVM procura public static void main(String[] args) para iniciar o programa.",
            options: [
              { text: "public static void main(String[] args)", correct: true },
              { text: "public void main()", correct: false },
              { text: "static int start(String args)", correct: false },
              { text: "public static String main(String[] args)", correct: false },
            ],
          },
        ],
      },
      {
        title: "Variáveis e tipos",
        type: "LEITURA",
        duration: 20,
        description: `## Objetivo
Escolher o tipo certo para cada dado.

### Primitivos mais usados
- \`int\` para inteiros.
- \`double\` para números com parte decimal.
- \`boolean\` para verdadeiro ou falso.
- \`char\` para um caractere.

### Referência
\`String\` guarda texto e é uma classe, não um primitivo.

\`final\` impede uma nova atribuição da variável.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Qual tipo primitivo representa um inteiro de 32 bits?",
            explanation: "int guarda inteiros de 32 bits. Integer é a classe invólucro, não o primitivo.",
            options: [
              { text: "int", correct: true },
              { text: "integer", correct: false },
              { text: "number", correct: false },
              { text: "int32", correct: false },
            ],
          },
          {
            type: "MULTIPLA",
            prompt: "Qual palavra-chave impede que uma variável seja reatribuída?",
            explanation: "final impede nova atribuição. const não faz parte do Java e let pertence ao JavaScript.",
            options: [
              { text: "final", correct: true },
              { text: "const", correct: false },
              { text: "freeze", correct: false },
              { text: "let", correct: false },
            ],
          },
        ],
      },
      {
        title: "Operadores e expressões",
        type: "PRATICA",
        duration: 30,
        description: `## Objetivo
Prever o resultado de expressões numéricas.

### Atenção
A divisão entre inteiros descarta a parte decimal.

\`5 / 2\` vale \`2\`. Para obter \`2.5\`, um dos operandos precisa ser \`double\`.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Qual o resultado da expressão 5 / 2 com operandos inteiros em Java?",
            explanation: "A divisão inteira descarta a parte decimal, então 5 / 2 vale 2.",
            options: [
              { text: "2", correct: true },
              { text: "2.5", correct: false },
              { text: "3", correct: false },
              { text: "2.0", correct: false },
            ],
          },
          {
            type: "PRATICA",
            prompt: "Crie a classe Calculadora com o método somar(int a, int b), que devolve a soma dos dois números.",
            explanation: "Publique a classe no repositório e registre a prática quando o código estiver enviado.",
            repoUrl: "https://github.com/example/vizioon-calculadora",
          },
        ],
      },
    ],
  },
  {
    title: "Controle de fluxo",
    description: "Decisões e repetições para resolver problemas pequenos.",
    lessons: [
      {
        title: "Condicionais",
        type: "VIDEO",
        duration: 18,
        videoUrl: "https://vimeo.com/76979871",
        description: `## Objetivo
Escolher entre \`if\` e \`switch\`.

### Quando usar
- \`if\` compara condições abertas.
- \`switch\` escolhe um bloco a partir de um valor constante.
- \`&&\` exige as duas condições verdadeiras.
- \`||\` basta uma condição verdadeira.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Qual estrutura escolhe um bloco com base em valores constantes?",
            explanation: "switch compara um valor com casos constantes. while e for repetem um bloco.",
            options: [
              { text: "switch", correct: true },
              { text: "while", correct: false },
              { text: "for", correct: false },
              { text: "import", correct: false },
            ],
          },
        ],
      },
      {
        title: "Laços",
        type: "LEITURA",
        duration: 25,
        description: `## Objetivo
Repetir um bloco pelo número certo de vezes.

### Três formas
- \`while\` testa a condição antes.
- \`do-while\` executa o bloco e só então testa.
- \`for\` concentra início, teste e incremento.

\`break\` encerra o laço atual.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Qual laço executa o bloco pelo menos uma vez antes de testar a condição?",
            explanation: "do-while testa a condição depois do bloco, então o corpo roda ao menos uma vez.",
            options: [
              { text: "do-while", correct: true },
              { text: "while", correct: false },
              { text: "for", correct: false },
              { text: "if", correct: false },
            ],
          },
        ],
      },
      {
        title: "Exercícios de lógica",
        type: "PRATICA",
        duration: 40,
        description: `## Objetivo
Combinar variáveis, decisões e laços em um programa curto.

Leia o enunciado do arquivo compactado e implemente a solução no repositório indicado.`,
        questions: [
          {
            type: "MULTIPLA",
            prompt: "Qual comando interrompe apenas o laço atual?",
            explanation: "break encerra o laço em execução. return sai do método inteiro.",
            options: [
              { text: "break", correct: true },
              { text: "stop", correct: false },
              { text: "exit", correct: false },
              { text: "halt", correct: false },
            ],
          },
          {
            type: "PRATICA",
            prompt: "Escreva um programa que leia cinco inteiros e imprima o maior deles.",
            explanation: "Guarde o maior valor visto até agora e compare cada número novo com ele.",
            repoUrl: "https://github.com/example/vizioon-maior-numero",
          },
        ],
      },
    ],
  },
];

async function main() {
  await prisma.attemptAnswer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.studyPlanAssignment.deleteMany();
  await prisma.studyPlanItem.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.activityAnswer.deleteMany();
  await prisma.activityDelivery.deleteMany();
  await prisma.activityCase.deleteMany();
  await prisma.activityQuestion.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.labSubmission.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.practiceSubmission.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.material.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.track.deleteMany();
  await prisma.user.deleteMany();

  const uploads = process.env.LOCAL_STORAGE_PATH
    ? path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH)
    : path.resolve(process.cwd(), "storage");
  await rm(path.join(uploads, "materiais"), { recursive: true, force: true });
  await rm(path.join(uploads, "videos"), { recursive: true, force: true });
  await mkdir(path.join(uploads, "materiais"), { recursive: true });

  const adminPassword = await hash("Admin@123", 10);
  const internPassword = await hash("Estagio@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Ana Ribeiro",
      email: "ana.ribeiro@vizioon.dev",
      passwordHash: adminPassword,
      role: "ADMIN",
      mustChangePassword: false,
      lastAccessAt: new Date(),
    },
  });
  const lucas = await prisma.user.create({
    data: {
      name: "Lucas Ferreira",
      email: "lucas.ferreira@vizioon.dev",
      passwordHash: internPassword,
      role: "ESTAGIARIO",
      lastAccessAt: new Date(),
    },
  });
  const marina = await prisma.user.create({
    data: {
      name: "Marina Costa",
      email: "marina.costa@vizioon.dev",
      passwordHash: internPassword,
      role: "ESTAGIARIO",
      lastAccessAt: day(-2),
    },
  });
  const pedro = await prisma.user.create({
    data: {
      name: "Pedro Almeida",
      email: "pedro.almeida@vizioon.dev",
      passwordHash: internPassword,
      role: "ESTAGIARIO",
      lastAccessAt: day(-14),
    },
  });

  await prisma.track.create({
    data: {
      title: "Java Fundamentos",
      description: "Base da linguagem para quem está começando no time: tipos, decisões, laços e exercícios curtos.",
      published: true,
      createdById: admin.id,
      modules: {
        create: curriculum.map((module, moduleIndex) => ({
          title: module.title,
          description: module.description,
          order: moduleIndex + 1,
          lessons: {
            create: module.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              description: lesson.description,
              order: lessonIndex + 1,
              durationMinutes: lesson.duration,
              type: lesson.type,
              videoUrl: "videoUrl" in lesson ? lesson.videoUrl : null,
              questions: {
                create: lesson.questions.map((question, questionIndex) => ({
                  type: question.type,
                  prompt: question.prompt,
                  explanation: question.explanation,
                  order: questionIndex + 1,
                  repoUrl: "repoUrl" in question ? question.repoUrl : null,
                  options: question.options
                    ? {
                        create: question.options.map((option, optionIndex) => ({
                          text: option.text,
                          isCorrect: option.correct,
                          order: optionIndex,
                        })),
                      }
                    : undefined,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  const files = [
    {
      lesson: "O que é Java",
      title: "Panorama do Java",
      fileName: "panorama-java.pdf",
      mimeType: "application/pdf",
      bytes: makePdf("Panorama do Java - Vizioon Brew"),
    },
    {
      lesson: "Variáveis e tipos",
      title: "Tabela de tipos primitivos",
      fileName: "tipos-primitivos.txt",
      mimeType: "text/plain; charset=utf-8",
      bytes: Buffer.from(
        "int: inteiro de 32 bits\ndouble: número com parte decimal\nboolean: true ou false\nchar: um caractere\nString: texto, tipo por referência\n",
        "utf8",
      ),
    },
    {
      lesson: "Exercícios de lógica",
      title: "Enunciados práticos",
      fileName: "enunciados.zip",
      mimeType: "application/zip",
      bytes: makeZip(
        "enunciado.txt",
        Buffer.from("Leia cinco inteiros e imprima o maior. Envie a classe Principal no repositório da dose.\n", "utf8"),
      ),
    },
  ];

  for (const file of files) {
    const relative = `materiais/${file.fileName}`;
    await writeFile(path.join(uploads, relative), file.bytes);
    const lesson = await prisma.lesson.findFirst({ where: { title: file.lesson } });
    if (!lesson) throw new Error(file.lesson);
    await prisma.material.create({
      data: {
        lessonId: lesson.id,
        title: file.title,
        fileName: file.fileName,
        filePath: relative,
        mimeType: file.mimeType,
        sizeBytes: file.bytes.length,
      },
    });
  }

  async function attemptFor(userId: string, when: Date, lessonTitle: string, results: boolean[]) {
    const lesson = await prisma.lesson.findFirst({
      where: { title: lessonTitle },
      include: {
        questions: {
          where: { type: "MULTIPLA" },
          orderBy: { order: "asc" },
          include: { options: true },
        },
      },
    });
    if (!lesson || lesson.questions.length !== results.length) {
      throw new Error(`Tentativa inválida em ${lessonTitle}`);
    }
    const answers = lesson.questions.map((question, index) => {
      const correct = results[index];
      const option = question.options.find((item) => item.isCorrect === correct);
      if (!option) throw new Error(question.prompt);
      return { questionId: question.id, optionId: option.id, isCorrect: correct };
    });
    const score = Math.round((results.filter(Boolean).length / results.length) * 100);
    await prisma.attempt.create({
      data: {
        userId,
        lessonId: lesson.id,
        score,
        createdAt: when,
        answers: { create: answers },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId,
        action: "TENTATIVA",
        metadata: JSON.stringify({ titulo: lesson.title, nota: score }),
        createdAt: when,
      },
    });
  }

  async function complete(userId: string, lessonTitle: string, when: Date) {
    const lesson = await prisma.lesson.findFirst({ where: { title: lessonTitle } });
    if (!lesson) throw new Error(lessonTitle);
    await prisma.lessonProgress.create({
      data: {
        userId,
        lessonId: lesson.id,
        completed: true,
        completedAt: when,
        studyMinutes: lesson.durationMinutes,
      },
    });
    await prisma.activityLog.create({
      data: {
        userId,
        action: "DOSE_CONCLUIDA",
        metadata: JSON.stringify({ titulo: lesson.title }),
        createdAt: when,
      },
    });
  }

  await attemptFor(pedro.id, day(-14), "O que é Java", [true, false]);
  await complete(pedro.id, "O que é Java", day(-14));
  await prisma.activityLog.create({
    data: { userId: pedro.id, action: "ACESSO", metadata: "{}", createdAt: day(-14) },
  });

  await attemptFor(lucas.id, day(-6), "O que é Java", [true, true]);
  await complete(lucas.id, "O que é Java", day(-6));
  await attemptFor(marina.id, day(-6), "O que é Java", [true, true]);
  await complete(marina.id, "O que é Java", day(-6));

  await attemptFor(lucas.id, day(-4), "Variáveis e tipos", [true, true]);
  await complete(lucas.id, "Variáveis e tipos", day(-4));
  await attemptFor(marina.id, day(-4), "Variáveis e tipos", [true, false]);
  await complete(marina.id, "Variáveis e tipos", day(-4));

  await attemptFor(lucas.id, day(-2), "Operadores e expressões", [true]);
  await complete(lucas.id, "Operadores e expressões", day(-2));
  await attemptFor(marina.id, day(-2), "Operadores e expressões", [false]);
  await complete(marina.id, "Operadores e expressões", day(-2));
  await prisma.activityLog.create({
    data: { userId: marina.id, action: "ACESSO", metadata: "{}", createdAt: day(-2) },
  });

  await attemptFor(lucas.id, day(-1), "Condicionais", [false]);
  await attemptFor(lucas.id, day(0), "Condicionais", [true]);
  await complete(lucas.id, "Condicionais", day(-1));
  await attemptFor(lucas.id, day(0), "Laços", [false]);
  await complete(lucas.id, "Laços", day(0));
  await prisma.activityLog.create({
    data: { userId: lucas.id, action: "ACESSO", metadata: "{}", createdAt: new Date() },
  });

  const orderedLessons = [
    "O que é Java",
    "Variáveis e tipos",
    "Operadores e expressões",
    "Condicionais",
    "Laços",
    "Exercícios de lógica",
  ];
  const dueOffsets = [-6, -4, -2, 1, 3, 5];
  const lessonRows = await prisma.lesson.findMany({ where: { title: { in: orderedLessons } } });

  await prisma.studyPlan.create({
    data: {
      title: "Receita da semana",
      weekLabel: `Semana de ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date())}`,
      goal: "Completar as seis doses de Java Fundamentos e registrar os exercícios práticos.",
      forAll: true,
      createdById: admin.id,
      items: {
        create: orderedLessons.map((title, index) => {
          const lesson = lessonRows.find((item) => item.title === title);
          if (!lesson) throw new Error(title);
          return { lessonId: lesson.id, dueDate: day(dueOffsets[index], true), order: index + 1 };
        }),
      },
    },
  });

  console.log("Seed concluído.");
  console.log("Tech lead: ana.ribeiro@vizioon.dev / Admin@123");
  console.log("Estagiários: lucas.ferreira@vizioon.dev, marina.costa@vizioon.dev, pedro.almeida@vizioon.dev / Estagio@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
