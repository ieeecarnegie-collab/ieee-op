"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { ExecMember } from "@/lib/exec-types";
import { AttendeeChecklist } from "@/components/AttendeeChecklist";

type ActionItem = {
  id: string;
  description: string;
  dueDate: string | null;
  status: string;
  ownerName: string | null;
};

type Props = {
  note: {
    id: string;
    meetingDate: string;
    summary: string | null;
    committeeId: string;
  };
  committeeName: string;
  authorName: string;
  actionItems: ActionItem[];
  attendees: ExecMember[];
  execRoster: ExecMember[];
  attendeeIds: string[];
  isPrezMeeting: boolean;
  canEdit: boolean;
};

export function MeetingDetailClient({
  note,
  committeeName,
  authorName,
  actionItems,
  attendees,
  execRoster,
  attendeeIds: initialAttendeeIds,
  isPrezMeeting,
  canEdit,
}: Props) {
  const router = useRouter();
  const [editingAttendance, setEditingAttendance] = useState(false);
  const [attendeeIds, setAttendeeIds] = useState(initialAttendeeIds);
  const [saving, setSaving] = useState(false);

  async function saveAttendance() {
    setSaving(true);
    await fetch(`/api/meetings/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendeeIds }),
    });
    setSaving(false);
    setEditingAttendance(false);
    router.refresh();
  }

  const presentAttendees = editingAttendance
    ? execRoster.filter((m) => attendeeIds.includes(m.id))
    : attendees;

  return (
    <>
      <Link href="/meetings" className="text-sm text-[#00629B] hover:underline">
        ← Back to meetings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {committeeName} · {format(new Date(note.meetingDate), "MMM d, yyyy")}
          </p>
          <h1 className="text-2xl font-bold">Meeting note</h1>
          <p className="mt-1 text-sm text-slate-500">Author: {authorName}</p>
        </div>
        <a
          href={`/api/meetings/${note.id}/pdf`}
          className="rounded border border-[#00629B] px-4 py-2 text-sm text-[#00629B] hover:bg-blue-50"
        >
          Export PDF
        </a>
      </div>

      <article className="mt-6 rounded border bg-white p-4">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-800">
          {note.summary || "(No summary)"}
        </p>
      </article>

      {isPrezMeeting && (
        <section className="mt-6 rounded border bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Exec attendance</h2>
            {canEdit && !editingAttendance && (
              <button
                type="button"
                onClick={() => setEditingAttendance(true)}
                className="text-sm text-[#00629B] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editingAttendance ? (
            <div className="mt-3 space-y-3">
              <AttendeeChecklist
                roster={execRoster}
                selectedIds={attendeeIds}
                onChange={setAttendeeIds}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAttendance}
                  className="rounded bg-[#00629B] px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAttendeeIds(initialAttendeeIds);
                    setEditingAttendance(false);
                  }}
                  className="rounded border px-3 py-1.5 text-sm text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : presentAttendees.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No attendance logged.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {presentAttendees.map((member) => (
                <li key={member.id}>
                  <span className="text-green-700">✓</span> {member.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Action items</h2>
        {actionItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {actionItems.map((item) => (
              <li key={item.id} className="rounded border bg-white p-3 text-sm">
                {item.description}
                {item.ownerName && (
                  <span className="text-slate-500"> — {item.ownerName}</span>
                )}
                {item.dueDate && (
                  <span className="text-slate-400"> · due {item.dueDate}</span>
                )}
                <span
                  className={
                    item.status === "done"
                      ? " ml-2 text-green-600"
                      : " ml-2 text-amber-600"
                  }
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
