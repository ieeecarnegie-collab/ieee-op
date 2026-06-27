import { signOut } from "@/lib/auth";

export async function GET() {
  return signOut({ redirectTo: "/" });
}

export async function POST() {
  return signOut({ redirectTo: "/" });
}
