import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Run auth on app routes only — never on static assets or auth API.
     * Without this, signed-out users on "/" get CSS/JS redirected to /login
     * and the landing page renders unstyled.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
