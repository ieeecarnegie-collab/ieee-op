"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { ExecMember } from "@/lib/exec-types";
import { AttendeeChecklist } from "@/components/AttendeeChecklist";
import { PREZ_COMMITTEE_ID } from "@/lib/exec-attendance";

type Note = {
  id: string;
  meetingDate: string;
  summary: string | null;
  committeeId: string;
};

type Committee = { id: string; name: string };

export function MeetingsClient({
  notes,
  committees,
  execRoster,
  canCreate,
  defaultCommitteeId,
}: {
  notes: Note[];
  committees: Committee[];
  execRoster: ExecMember[];
  canCreate: boolean;
  defaultCommitteeId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    committeeId: defaultCommitteeId,
    meetingDate: format(new Date(), "yyyy-MM-dd"),
    summary: "",
    attendeeIds: [] as string[],
  });

  const isPrezMeeting = form.committeeId === PREZ_COMMITTEE_ID;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        attendeeIds: isPrezMeeting ? form.attendeeIds : [],
      }),
    });
    setShowForm(false);
    router.refresh();
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meeting Notes</h1>
          <p className="text-slate-600">Weekly exec and committee logs</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded bg-[#00629B] px-4 py-2 text-sm text-white"
          >
            + Add note
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded border bg-white p-4">
          <select
            className="w-full rounded border px-3 py-2"
            value={form.committeeId}
            onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
          >
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={form.meetingDate}
            onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
          />
          <textarea
            required
            rows={4}
            placeholder="Summary"
            className="w-full rounded border px-3 py-2"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          {isPrezMeeting && execRoster.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Exec attendance</p>
              <AttendeeChecklist
                roster={execRoster}
                selectedIds={form.attendeeIds}
                onChange={(attendeeIds) => setForm({ ...form, attendeeIds })}
              />
            </div>
          )}
          <button type="submit" className="rounded bg-[#00629B] px-4 py-2 text-white">
            Save
          </button>
        </form>
      )}

      <div className="space-y-3">
        {sorted.map((note) => {
          const committee = committees.find((c) => c.id === note.committeeId);
          return (
            <article key={note.id} className="rounded border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-slate-500">
                  {committee?.name} · {format(new Date(note.meetingDate), "MMM d, yyyy")}
                </p>
                <div className="flex gap-3 text-sm">
                  <Link href={`/meetings/${note.id}`} className="text-[#00629B] hover:underline">
                    View
                  </Link>
                  <a
                    href={`/api/meetings/${note.id}/pdf`}
                    className="text-[#00629B] hover:underline"
                  >
                    PDF
                  </a>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-slate-800">
                {note.summary}
              </p>
            </article>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-slate-500">No meeting notes yet.</p>
        )}
      </div>
    </>
  );
}
