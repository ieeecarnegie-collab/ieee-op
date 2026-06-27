"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";

type EventRow = {
  id: string;
  title: string;
  startAt: string;
  status: string;
  isSignature: boolean | null;
  committeeId: string;
};

type Committee = { id: string; slug: string; name: string };

export function CalendarClient({
  events,
  committees,
  canCreate,
}: {
  events: EventRow[];
  committees: Committee[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    committeeId: committees[0]?.id ?? "",
    startAt: "",
    location: "",
    isSignature: false,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    router.refresh();
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Calendar</h1>
          <p className="text-slate-600">All org events</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded bg-[#00629B] px-4 py-2 text-sm text-white"
          >
            + Add Event
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid gap-3 rounded border bg-white p-4 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Event title"
            className="rounded border px-3 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="rounded border px-3 py-2"
            value={form.committeeId}
            onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
          >
            {committees
              .filter((c) => c.slug !== "pr")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <input
            required
            type="datetime-local"
            className="rounded border px-3 py-2"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
          <input
            placeholder="Location"
            className="rounded border px-3 py-2"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isSignature}
              onChange={(e) =>
                setForm({ ...form, isSignature: e.target.checked })
              }
            />
            Signature event
          </label>
          <button type="submit" className="rounded bg-[#00629B] py-2 text-white">
            Create event
          </button>
        </form>
      )}

      <div className="space-y-3">
        {sorted.map((event) => {
          const committee = committees.find((c) => c.id === event.committeeId);
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center justify-between rounded border bg-white p-4 hover:border-[#00629B]/40"
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-slate-600">
                  {committee?.name} · {format(new Date(event.startAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div className="flex gap-2">
                {event.isSignature && (
                  <span className="rounded border border-[#00629B] px-2 py-0.5 text-xs text-[#00629B]">
                    signature
                  </span>
                )}
                <StatusBadge status={event.status} />
              </div>
            </Link>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-slate-500">No events scheduled yet.</p>
        )}
      </div>
    </>
  );
}
