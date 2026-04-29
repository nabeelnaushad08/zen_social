import { Role } from "@prisma/client";
import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      // null for ADMIN users
      clientId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    clientId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: Role;
    firstName: string;
    lastName: string;
    clientId: string | null;
  }
}
