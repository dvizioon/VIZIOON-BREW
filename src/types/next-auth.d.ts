import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "ESTAGIARIO";
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "ESTAGIARIO";
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "ESTAGIARIO";
    mustChangePassword: boolean;
  }
}

export {};
