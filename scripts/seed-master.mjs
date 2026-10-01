import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const { hash } = bcrypt;

const email = process.env.SEED_MASTER_EMAIL?.trim();
const password = process.env.SEED_MASTER_PASSWORD ?? "";
const name = process.env.SEED_MASTER_NAME?.trim() || "Admin";

if (!email || !password) {
  console.log("Seed ignorado: SEED_MASTER_EMAIL ou SEED_MASTER_PASSWORD ausente.");
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Usuário inicial já existe.");
    process.exit(0);
  }
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hash(password, 10),
      role: "ADMIN",
      mustChangePassword: false,
    },
  });
  console.log("Usuário inicial criado.");
} finally {
  await prisma.$disconnect();
}
