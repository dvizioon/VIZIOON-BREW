import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const DEFAULT_MASTER = {
  email: "admin@admin.com",
  password: "admin123",
  name: "Admin",
};

function databaseUrl() {
  const current = process.env.DATABASE_URL?.trim();
  if (current && !current.startsWith("file:")) return current;

  const user = encodeURIComponent(process.env.DB_USER ?? "");
  const pass = encodeURIComponent(process.env.DB_PASS ?? "");
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME ?? "";
  if (!user || !name) {
    throw new Error("Defina DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS.");
  }
  return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

function seedConfig() {
  const email = (process.env.SEED_MASTER_EMAIL ?? DEFAULT_MASTER.email).trim().toLowerCase();
  const password = process.env.SEED_MASTER_PASSWORD ?? DEFAULT_MASTER.password;
  const name = (process.env.SEED_MASTER_NAME ?? DEFAULT_MASTER.name).trim() || DEFAULT_MASTER.name;
  if (password.length < 8) {
    throw new Error("SEED_MASTER_PASSWORD precisa ter pelo menos 8 caracteres.");
  }
  return { email, password, name };
}

async function seedMasterUser() {
  const { email, password, name } = seedConfig();
  process.env.DATABASE_URL = databaseUrl();
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`[seed] Usuário inicial já existe (${email}).`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hash(password, 10),
        role: "ADMIN",
        mustChangePassword: false,
      },
    });
    console.log(`[seed] Usuário inicial criado: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedMasterUser().catch((error) => {
  console.error("[seed] Falhou:", error);
  process.exit(1);
});
