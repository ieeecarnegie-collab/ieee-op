import { Nav } from "@/components/Nav";

export function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900">{children}</main>
    </div>
  );
}
