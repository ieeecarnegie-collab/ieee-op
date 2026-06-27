import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const useDevAuth = process.env.AUTH_DEV_MODE === "true";

export const authConfig = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(useDevAuth
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            authorize: () => null,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" as const },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const isPublic =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signout" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/public");

      if (isPublic) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
  },
} satisfies NextAuthConfig;
