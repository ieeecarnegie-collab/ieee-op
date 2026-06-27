"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import type { ExecAttendanceMatrix } from "@/lib/exec-attendance";
import { AttendeeChecklist } from "@/components/AttendeeChecklist";

type Props = {
  matrix: ExecAttendanceMatrix;
  canEdit: boolean;
};

function cellSymbol(status: "present" | "absent" | "unlogged") {
  switch (status) {
    case "present":
      return "✓";
    case "absent":
      return "·";
    default:
      return "—";
  }
}

function cellClass(status: "present" | "absent" | "unlogged") {
  switch (status) {
    case "present":
      return "text-green-700 font-semibold";
    case "absent":
      return "text-slate-300";
    default:
      return "text-slate-200";
  }
}

export function ExecAttendanceTracker({ matrix, canEdit }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    meetingDate: format(new Date(), "yyyy-MM-dd"),
    attendeeIds: [] as string[],
    summary: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/prez/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save attendance.");
      return;
    }

    setShowForm(false);
    setForm({
      meetingDate: format(new Date(), "yyyy-MM-dd"),
      attendeeIds: [],
      summary: "",
    });
    router.refresh();
  }

  function loadWeekForEdit(weekStart: string) {
    const week = matrix.weeks.find((w) => w.weekStart === weekStart);
    if (!week?.logged || !week.meetingDate) return;

    const rowAttendees = matrix.rows
      .filter((row) => {
        const weekIndex = matrix.weeks.findIndex((w) => w.weekStart === weekStart);
        return row.cells[weekIndex] === "present";
      })
      .map((row) => row.member.id);

    setForm({
      meetingDate: week.meetingDate.slice(0, 10),
      attendeeIds: rowAttendees,
      summary: "",
    });
    setShowForm(true);
  }

  return (
    <section className="mt-6 rounded border border-slate-200 bg-white p-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Weekly exec meeting attendance</h2>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded bg-[#00629B] px-3 py-1.5 text-sm font-medium text-white"
          >
            {showForm ? "Cancel" : "Log attendance"}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded border border-slate-100 bg-slate-50 p-4"
        >
          <label className="block text-sm">
            Meeting date
            <input
              required
              type="date"
              className="mt-1 rounded border border-slate-300 px-3 py-2"
              value={form.meetingDate}
              onChange={(e) =>
                setForm({ ...form, meetingDate: e.target.value })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Who was present?</p>
            <AttendeeChecklist
              roster={matrix.rows.map((r) => r.member)}
              selectedIds={form.attendeeIds}
              onChange={(attendeeIds) => setForm({ ...form, attendeeIds })}
            />
          </div>

          <label className="block text-sm">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Optional meeting summary"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </label>

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-[#00629B] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save attendance"}
          </button>
        </form>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="sticky left-0 bg-white py-2 pr-4 font-medium text-slate-700">
                Exec
              </th>
              {matrix.weeks.map((week) => (
                <th
                  key={week.weekStart}
                  className="px-2 py-2 text-center font-normal text-slate-500"
                  title={
                    week.logged
                      ? `${week.presentCount}/${week.totalCount} present · ${week.meetingDate?.slice(0, 10) ?? week.weekStart}`
                      : `Week of ${week.label}`
                  }
                >
                  {canEdit && week.logged ? (
                    <button
                      type="button"
                      onClick={() => loadWeekForEdit(week.weekStart)}
                      className="hover:text-[#00629B] hover:underline"
                    >
                      {week.label}
                    </button>
                  ) : (
                    week.label
                  )}
                  {week.logged && (
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {week.presentCount}/{week.totalCount}
                    </span>
                  )}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium text-slate-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.member.id} className="border-b border-slate-100">
                <td className="sticky left-0 bg-white py-2 pr-4">
                  <span className="font-medium">{row.member.name}</span>
                </td>
                {row.cells.map((status, i) => (
                  <td
                    key={`${row.member.id}-${matrix.weeks[i].weekStart}`}
                    className={`px-2 py-2 text-center ${cellClass(status)}`}
                  >
                    {cellSymbol(status)}
                  </td>
                ))}
                <td className="px-2 py-2 text-center text-slate-600">
                  {row.loggedWeeks > 0
                    ? `${row.presentCount}/${row.loggedWeeks}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matrix.weeks.some((w) => w.meetingId) && (
        <p className="mt-3 text-xs text-slate-500">
          Click a logged week header to edit attendance. View full notes on{" "}
          <Link href="/meetings" className="text-[#00629B] hover:underline">
            Meetings
          </Link>
          .
        </p>
      )}
    </section>
  );
}
