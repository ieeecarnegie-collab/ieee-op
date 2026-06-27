import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEMO_USERS } from "@/lib/seed-data";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const devMode = process.env.AUTH_DEV_MODE === "true";
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#00629B]">Exec Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access is limited to IEEE CMU exec board members.
        </p>

        {hasGoogle && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="w-full rounded bg-[#00629B] py-2 text-white hover:bg-[#004d7a]"
            >
              Sign in with Google
            </button>
          </form>
        )}

        {devMode && (
          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Dev login (demo users)
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <form
                  key={u.email}
                  action={async () => {
                    "use server";
                    await signIn("credentials", {
                      email: u.email,
                      redirectTo: "/dashboard",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded border border-slate-200 py-2 text-left px-3 text-sm hover:bg-slate-50"
                  >
                    {u.name}{" "}
                    <span className="text-slate-400">({u.email})</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {!hasGoogle && !devMode && (
          <p className="mt-6 text-sm text-amber-700">
            Configure GOOGLE_CLIENT_ID/SECRET or set AUTH_DEV_MODE=true for local
            development.
          </p>
        )}

        <Link href="/" className="mt-6 block text-center text-sm text-slate-500">
          ← Back to public site
        </Link>
      </div>
    </div>
  );
}
