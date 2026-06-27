import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import {
  isAllowedEmailDomain,
  toSessionUser,
  type SessionUser,
} from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

const useDevAuth = process.env.AUTH_DEV_MODE === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
    ...(useDevAuth
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string;
              if (!email) return null;
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));
              if (!user || user.status !== "active") return null;
              return { id: user.id, email: user.email, name: user.name };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (account?.provider === "credentials") return true;
      if (!isAllowedEmailDomain(user.email)) return false;

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email));

      return !!(
        existing &&
        existing.status === "active" &&
        existing.isExecMember
      );
    },
    async session({ session, token }) {
      if (!token.sub) return session;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, token.sub));
      if (!user) return session;

      const [permissions] = await db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      session.user = toSessionUser(user, permissions ?? null) as unknown as typeof session.user;
      return session;
    },
  },
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}
