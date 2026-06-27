"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

type SearchResults = {
  events: {
    id: string;
    title: string;
    startAt: string;
    committeeName: string;
    description: string | null;
  }[];
  meetingNotes: {
    id: string;
    meetingDate: string;
    summary: string | null;
    committeeName: string;
  }[];
};

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  const total =
    (results?.events.length ?? 0) + (results?.meetingNotes.length ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Search</h1>
      <p className="mt-1 text-slate-600">Events and meeting notes</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          placeholder="Search events and meeting notes…"
          className="flex-1 rounded border px-4 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="rounded bg-[#00629B] px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {results && (
        <p className="mt-4 text-sm text-slate-500">
          {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {results && results.events.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Events</h2>
          <ul className="mt-2 space-y-2">
            {results.events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/events/${ev.id}`}
                  className="block rounded border bg-white p-3 hover:border-[#00629B]/40"
                >
                  <span className="font-medium">{ev.title}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {ev.committeeName} · {format(new Date(ev.startAt), "MMM d, yyyy")}
                  </span>
                  {ev.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {ev.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.meetingNotes.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Meeting notes</h2>
          <ul className="mt-2 space-y-2">
            {results.meetingNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/meetings/${note.id}`}
                  className="block rounded border bg-white p-3 hover:border-[#00629B]/40"
                >
                  <span className="text-sm text-slate-500">
                    {note.committeeName} ·{" "}
                    {format(new Date(note.meetingDate), "MMM d, yyyy")}
                  </span>
                  <p className="mt-1 line-clamp-3 text-sm">{note.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && total === 0 && (
        <p className="mt-6 text-slate-500">No matches found.</p>
      )}
    </div>
  );
}
