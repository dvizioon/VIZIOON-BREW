import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type CodeLanguage = "java" | "python";

export type CaseRun = {
  index: number;
  passed: boolean;
  stdout: string;
  stderr: string;
  message: string;
};

const buckets = new Map<string, number[]>();
let activeRuns = 0;
const runWaiters: (() => void)[] = [];

export function isCodeLanguage(value: string | null | undefined): value is CodeLanguage {
  return value === "java" || value === "python";
}

export function sameOutput(actual: string, expected: string) {
  const clean = (value: string) =>
    value
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  return clean(actual) === clean(expected);
}

export function takeRunSlots(userId: string, cost: number) {
  const now = Date.now();
  const recent = (buckets.get(userId) ?? []).filter((stamp) => now - stamp < 60_000);
  if (recent.length + cost > 12) {
    buckets.set(userId, recent);
    return false;
  }
  for (let index = 0; index < cost; index += 1) recent.push(now);
  buckets.set(userId, recent);
  return true;
}

function clip(value: string) {
  const clean = value.replace(/\u0000/g, "");
  if (clean.length <= 800) return clean;
  return `${clean.slice(0, 800)}\n[saída cortada]`;
}

function commandExists(name: string) {
  try {
    execFileSync("which", [name], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const pythonPackageDir = path.join(process.cwd(), "src/modules/runtimes/python/3.12.0");

function pythonRuntime() {
  const executable = path.join(pythonPackageDir, "bin", "python3.12");
  const run = path.join(pythonPackageDir, "run");
  if (!existsSync(executable) || !existsSync(run)) return null;
  return { prefix: pythonPackageDir, run };
}

const javaPackageDir = path.join(process.cwd(), "src/modules/runtimes/java/15.0.2");

function javaRuntime() {
  const executable = path.join(javaPackageDir, "bin", "java");
  const run = path.join(javaPackageDir, "run");
  if (!existsSync(executable) || !existsSync(run)) return null;
  return { prefix: javaPackageDir, run };
}

function bindIfExists(args: string[], source: string, target: string) {
  if (existsSync(source)) args.push("--ro-bind", source, target);
}

function sandboxArgs(workDir: string, runtimeBinds: [string, string][]) {
  const args = ["--unshare-all", "--die-with-parent", "--new-session"];
  bindIfExists(args, "/usr", "/usr");
  bindIfExists(args, "/lib", "/lib");
  bindIfExists(args, "/lib64", "/lib64");
  bindIfExists(args, "/bin", "/bin");
  bindIfExists(args, "/etc", "/etc");
  for (const [source, target] of runtimeBinds) args.push("--ro-bind", source, target);
  args.push(
    "--proc",
    "/proc",
    "--dev",
    "/dev",
    "--tmpfs",
    "/tmp",
    "--tmpfs",
    "/home",
    "--tmpfs",
    "/var",
    "--tmpfs",
    "/run",
    "--bind",
    workDir,
    "/work",
    "--chdir",
    "/work",
  );
  return args;
}

async function acquireRun() {
  if (activeRuns >= 2) {
    await new Promise<void>((resolve) => runWaiters.push(resolve));
  }
  activeRuns += 1;
}

function releaseRun() {
  activeRuns -= 1;
  runWaiters.shift()?.();
}

function processCap() {
  try {
    const uid = process.getuid?.() ?? 1000;
    const listed = execFileSync("ps", ["-L", "-u", String(uid), "--no-headers"], { encoding: "utf8" });
    const running = listed.split("\n").filter(Boolean).length;
    return Math.min(16000, running + 64);
  } catch {
    return 1024;
  }
}

function runSandboxed(
  sandbox: string[],
  env: [string, string][],
  command: string[],
  stdin: string,
  timeoutSec: number,
) {
  const envArgs = env.flatMap(([key, value]) => ["--setenv", key, value]);
  const wrapped = [
    "-k",
    "1",
    String(timeoutSec + 1),
    "prlimit",
    "--as=6442450944",
    `--nproc=${processCap()}`,
    "--fsize=1048576",
    "--nofile=64",
    `--cpu=${timeoutSec}`,
    "--",
    "bwrap",
    ...sandbox,
    ...envArgs,
    "--",
    ...command,
  ];

  return new Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean; tooBig: boolean }>((resolve) => {
    const child = spawn("timeout", wrapped, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let tooBig = false;
    const take = (current: string, chunk: Buffer) => {
      const next = current + chunk.toString("utf8");
      if (next.length > 4000) {
        tooBig = true;
        child.kill("SIGKILL");
        return next.slice(0, 4000);
      }
      return next;
    };
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = take(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = take(stderr, chunk);
    });
    child.on("error", () => resolve({ code: null, stdout, stderr, timedOut: false, tooBig }));
    child.on("close", (code) => {
      resolve({ code, stdout, stderr, timedOut: code === 124 || code === 137, tooBig });
    });
    child.stdin.end(stdin);
  });
}

function failureMessage(result: { code: number | null; timedOut: boolean; tooBig: boolean; stderr: string }) {
  if (result.timedOut) return "O programa passou do tempo limite.";
  if (result.tooBig) return "A saída ficou grande demais.";
  if (result.code !== 0 || result.stderr.trim()) return "O programa terminou com erro.";
  return "A saída não confere com o esperado.";
}

async function executeOnce(language: CodeLanguage, source: string, stdin: string): Promise<CaseRun> {
  if (!commandExists("bwrap") || !commandExists("prlimit") || !commandExists("timeout")) {
    return {
      index: 0,
      passed: false,
      stdout: "",
      stderr: "",
      message: "O isolamento do código não está instalado nesta máquina.",
    };
  }

  const dir = await mkdtemp(path.join(os.tmpdir(), "vizioon-"));
  try {
    await acquireRun();
    if (language === "python") {
      const python = pythonRuntime();
      if (!python) {
        return { index: 0, passed: false, stdout: "", stderr: "", message: "O pacote Python 3.12.0 ainda não foi montado." };
      }
      await writeFile(path.join(dir, "main.py"), source, "utf8");
      const run = await runSandboxed(
        sandboxArgs(dir, [[python.prefix, "/opt/python"]]),
        [
          ["PATH", "/opt/python/bin:/usr/bin:/bin"],
          ["PYTHONHOME", "/opt/python"],
          ["LD_LIBRARY_PATH", "/opt/python/lib"],
          ["HOME", "/tmp"],
          ["LANG", "C.UTF-8"],
          ["PYTHONDONTWRITEBYTECODE", "1"],
        ],
        ["/opt/python/run", "main.py"],
        stdin,
        3,
      );
      const ok = run.code === 0 && !run.timedOut && !run.tooBig;
      return {
        index: 0,
        passed: false,
        stdout: clip(run.stdout),
        stderr: clip(run.stderr),
        message: ok ? "" : failureMessage(run),
      };
    }

    const java = javaRuntime();
    if (!java) {
      return {
        index: 0,
        passed: false,
        stdout: "",
        stderr: "",
        message: "O pacote Java 15.0.2 ainda não foi montado.",
      };
    }
    await writeFile(path.join(dir, "Main"), source, "utf8");
    const run = await runSandboxed(
      sandboxArgs(dir, [[java.prefix, "/opt/java"]]),
      [
        ["JAVA_HOME", "/opt/java"],
        ["PATH", "/opt/java/bin:/usr/bin:/bin"],
        ["HOME", "/tmp"],
        ["LANG", "C.UTF-8"],
      ],
      ["/opt/java/run", "/work/Main"],
      stdin,
      8,
    );
    const ok = run.code === 0 && !run.timedOut && !run.tooBig;
    return {
      index: 0,
      passed: false,
      stdout: clip(run.stdout),
      stderr: clip(run.stderr),
      message: ok ? "" : failureMessage(run),
    };
  } finally {
    releaseRun();
    await rm(dir, { recursive: true, force: true });
  }
}

export function validateSource(language: CodeLanguage, source: string) {
  if (!source.trim()) return "Escreva o código antes de executar.";
  if (source.length > 8000) return "O código passa de 8000 caracteres.";
  if (source.includes("\u0000")) return "O código tem um caractere inválido.";
  if (language === "java" && !/\bclass\s+Main\b/.test(source)) {
    return "Em Java a classe precisa se chamar Main.";
  }
  return null;
}

const blocked = new Set([
  "O isolamento do código não está instalado nesta máquina.",
  "O pacote Python 3.12.0 ainda não foi montado.",
  "O pacote Java 15.0.2 ainda não foi montado.",
]);

export async function captureOutputs(language: CodeLanguage, source: string, inputs: string[]) {
  const invalid = validateSource(language, source);
  if (invalid) return { error: invalid, outputs: [] as string[] };
  const outputs: string[] = [];
  for (const stdin of inputs) {
    const run = await executeOnce(language, source, stdin.slice(0, 2000));
    if (blocked.has(run.message) || run.message) {
      return { error: run.message || "O código de referência terminou com erro.", outputs };
    }
    outputs.push(run.stdout.replace(/\n$/, ""));
  }
  return { error: null as string | null, outputs };
}

export async function runCases(
  language: CodeLanguage,
  source: string,
  cases: { stdin: string; expectedStdout: string }[],
) {
  const invalid = validateSource(language, source);
  if (invalid) return { error: invalid, cases: [] as CaseRun[] };
  const results: CaseRun[] = [];
  for (const [index, item] of cases.entries()) {
    const run = await executeOnce(language, source, item.stdin.slice(0, 2000));
    if (blocked.has(run.message)) return { error: run.message, cases: results };
    const passed = run.message === "" && sameOutput(run.stdout, item.expectedStdout);
    results.push({
      ...run,
      index: index + 1,
      passed,
      message: passed ? "Passou." : run.message || "A saída não confere com o esperado.",
    });
  }
  return { error: null as string | null, cases: results };
}

export async function pistonStatus() {
  return {
    online: commandExists("bwrap") && commandExists("prlimit") && commandExists("timeout"),
    java: javaRuntime() !== null,
    python: pythonRuntime() !== null,
  };
}
