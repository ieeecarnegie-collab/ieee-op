import Link from "next/link";

export default function LandingPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ieee@andrew.cmu.edu";
  const committees = [
    "Prez",
    "Internal Relations",
    "Social",
    "Research",
    "Pre-professional",
    "Corporate",
    "Public Relations",
    "Doghouse",
    "Outreach",
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-xl font-semibold text-[#00629B]">IEEE @ CMU</span>
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-[#00629B]"
          >
            Exec Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-900">
          IEEE Student Chapter at Carnegie Mellon
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Electrical &amp; Computer Engineering · Open to all CMU students
        </p>
        <a
          href={`mailto:${contact}`}
          className="mt-8 inline-block rounded bg-[#00629B] px-6 py-3 text-white hover:bg-[#004d7a]"
        >
          Join IEEE CMU
        </a>

        <section className="mt-16 text-left">
          <h2 className="text-xl font-semibold text-slate-900">About</h2>
          <p className="mt-2 text-slate-600">
            We connect ECE students through events, mentorship, and industry
            partnerships. Membership is open to anyone at CMU.
          </p>
        </section>

        <section className="mt-10 text-left">
          <h2 className="text-xl font-semibold text-slate-900">Committees</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {committees.map((c) => (
              <span
                key={c}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <p>
          Contact:{" "}
          <a href={`mailto:${contact}`} className="text-[#00629B]">
            {contact}
          </a>
          {" · "}
          <a href="https://www.ieee.org" className="text-[#00629B]">
            ieee.org
          </a>
        </p>
        <p className="mt-2">
          IEEE @ CMU is a student organization at Carnegie Mellon University.
        </p>
      </footer>
    </div>
  );
}
