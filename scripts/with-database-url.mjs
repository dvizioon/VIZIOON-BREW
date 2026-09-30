import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const current = process.env.DATABASE_URL?.trim();
if (!current || current.startsWith("file:")) {
  const user = encodeURIComponent(process.env.DB_USER ?? "");
  const pass = encodeURIComponent(process.env.DB_PASS ?? "");
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME ?? "";
  if (!user || !name) {
    console.error("Defina DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS.");
    process.exit(1);
  }
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

const [command, ...args] = process.argv.slice(2);
if (!command) process.exit(0);

const child = spawn(command, args, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
