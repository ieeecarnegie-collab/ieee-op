"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { ExecAttendanceTracker } from "@/components/ExecAttendanceTracker";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import type { ExecAttendanceMatrix } from "@/lib/exec-attendance";
import type { ExpenseRecord } from "@/lib/expense-types";

type Goal = {
  id: string;
  title: string;
  targetMetric: string | null;
  deadline: string | null;
  status: string;
  notes: string | null;
};

type CommitteeData = {
  committee: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    trackingType: string;
  };
  events: {
    id: string;
    title: string;
    startAt: string;
    endAt: string | null;
    status: string;
    isSignature: boolean | null;
  }[];
  meetingNotes: { id: string; meetingDate: string; summary: string | null }[];
  actionItems: { id: string; description: string; dueDate: string | null }[];
  goals: Goal[];
  deliverables: {
    id: string;
    type: string;
    status: string;
    linkedEventId: string | null;
    dueDate: string | null;
    captionSummary: string | null;
  }[];
  canEdit: boolean;
  execAttendance?: ExecAttendanceMatrix | null;
  expenses?: ExpenseRecord[];
  expenseTotal?: number;
};

export function CommitteePageClient({ data }: { data: CommitteeData }) {
  const router = useRouter();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    targetMetric: "",
    deadline: "",
  });
  const [editingEvents, setEditingEvents] = useState(false);
  const [eventsSaving, setEventsSaving] = useState(false);
  const [eventDrafts, setEventDrafts] = useState<
    Record<string, { title: string; startDate: string }>
  >({});

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        committeeId: data.committee.id,
        title: goalForm.title,
        targetMetric: goalForm.targetMetric || null,
        deadline: goalForm.deadline || null,
        status: "in_progress",
      }),
    });
    setShowGoalForm(false);
    setGoalForm({ title: "", targetMetric: "", deadline: "" });
    router.refresh();
  }

  async function updateGoalStatus(id: string, status: string) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function updateDeliverable(id: string, status: string) {
    await fetch(`/api/deliverables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function startEditingEvents() {
    setEventDrafts(
      Object.fromEntries(
        data.events.map((ev) => [
          ev.id,
          { title: ev.title, startDate: ev.startAt.slice(0, 10) },
        ]),
      ),
    );
    setEditingEvents(true);
  }

  function shiftEventToDate(isoDateTime: string, startDate: string): string {
    const dt = new Date(isoDateTime);
    const [year, month, day] = startDate.split("-").map(Number);
    dt.setFullYear(year, month - 1, day);
    return dt.toISOString();
  }

  async function saveEvents() {
    setEventsSaving(true);

    for (const ev of data.events) {
      const draft = eventDrafts[ev.id];
      if (!draft) continue;

      const dateChanged = draft.startDate !== ev.startAt.slice(0, 10);
      const titleChanged = draft.title !== ev.title;
      if (!dateChanged && !titleChanged) continue;

      const payload: { title: string; startAt?: string; endAt?: string } = {
        title: draft.title.trim() || ev.title,
      };

      if (dateChanged) {
        payload.startAt = shiftEventToDate(ev.startAt, draft.startDate);
        if (ev.endAt) {
          payload.endAt = shiftEventToDate(ev.endAt, draft.startDate);
        }
      }

      await fetch(`/api/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEventsSaving(false);
    setEditingEvents(false);
    router.refresh();
  }

  function cancelEventsEdit() {
    setEditingEvents(false);
  }

  async function deleteEvent(eventId: string, title: string) {
    if (
      !window.confirm(
        `Delete "${title}"? This removes the event and its planning checklist.`,
      )
    ) {
      return;
    }

    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Could not delete event.");
      return;
    }

    router.refresh();
  }

  const { committee } = data;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {committee.trackingType}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{committee.name}</h1>
          {committee.description && (
            <p className="mt-1 text-slate-600">{committee.description}</p>
          )}
        </div>
        {data.canEdit && committee.trackingType === "events" && (
          <Link
            href={`/committees/${committee.slug}/events/new`}
            className="rounded bg-[#00629B] px-4 py-2 text-sm font-medium text-white hover:bg-[#004d7a]"
          >
            + Add event
          </Link>
        )}
      </div>

      <section className="mt-6 rounded border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Goals</h2>
          {data.canEdit && (
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="text-sm text-[#00629B]"
            >
              + Add goal
            </button>
          )}
        </div>
        {showGoalForm && (
          <form onSubmit={createGoal} className="mt-3 grid gap-2 sm:grid-cols-3">
            <input
              required
              placeholder="Goal title"
              className="rounded border px-2 py-1 sm:col-span-2"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            />
            <input
              placeholder="Target metric"
              className="rounded border px-2 py-1"
              value={goalForm.targetMetric}
              onChange={(e) =>
                setGoalForm({ ...goalForm, targetMetric: e.target.value })
              }
            />
            <input
              type="date"
              className="rounded border px-2 py-1"
              value={goalForm.deadline}
              onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
            />
            <button type="submit" className="rounded bg-[#00629B] text-white">
              Save
            </button>
          </form>
        )}
        {data.goals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No custom goals yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.goals.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2">
                <span>
                  {g.title}
                  {g.targetMetric && (
                    <span className="text-slate-400"> — {g.targetMetric}</span>
                  )}
                  {g.deadline && (
                    <span className="text-slate-400"> · due {g.deadline}</span>
                  )}
                </span>
                {data.canEdit ? (
                  <select
                    value={g.status}
                    onChange={(e) => updateGoalStatus(g.id, e.target.value)}
                    className="rounded border text-xs"
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <StatusBadge status={g.status} label={g.status.replace("_", " ")} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {committee.slug === "prez" && data.execAttendance && (
        <ExecAttendanceTracker
          matrix={data.execAttendance}
          canEdit={data.canEdit}
        />
      )}

      {committee.slug === "prez" && data.expenses && (
        <ExpenseTracker
          expenses={data.expenses}
          total={data.expenseTotal ?? 0}
        />
      )}

      {committee.trackingType === "events" && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Events</h2>
            {data.canEdit && data.events.length > 0 && !editingEvents && (
              <button
                type="button"
                onClick={startEditingEvents}
                className="rounded border border-[#00629B] px-3 py-1.5 text-sm font-medium text-[#00629B] hover:bg-blue-50"
              >
                Edit Events
              </button>
            )}
            {data.canEdit && editingEvents && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEvents}
                  disabled={eventsSaving}
                  className="rounded bg-[#00629B] px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {eventsSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEventsEdit}
                  disabled={eventsSaving}
                  className="rounded border px-3 py-1 text-sm text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {data.events.length === 0 ? (
            <p className="text-sm text-slate-600">No events yet.</p>
          ) : editingEvents ? (
            <div className="space-y-2">
              {data.events.map((ev) => {
                const draft = eventDrafts[ev.id];
                if (!draft) return null;
                return (
                  <div
                    key={ev.id}
                    className="flex flex-wrap items-center gap-3 rounded border bg-white p-3"
                  >
                    <input
                      className="min-w-[160px] flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                      value={draft.title}
                      onChange={(e) =>
                        setEventDrafts({
                          ...eventDrafts,
                          [ev.id]: { ...draft, title: e.target.value },
                        })
                      }
                    />
                    <input
                      type="date"
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                      value={draft.startDate}
                      onChange={(e) =>
                        setEventDrafts({
                          ...eventDrafts,
                          [ev.id]: { ...draft, startDate: e.target.value },
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => deleteEvent(ev.id, draft.title)}
                      className="shrink-0 rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {data.events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center justify-between rounded border bg-white p-3 hover:border-[#00629B]/40"
                >
                  <span className="text-slate-900">{ev.title}</span>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {format(new Date(ev.startAt), "MMM d")}
                    <StatusBadge status={ev.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {committee.slug === "pr" && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Poster backlog</h2>
          <div className="space-y-2">
            {data.deliverables
              .filter((d) => d.type === "poster")
              .map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded border bg-white p-3"
                >
                  <span className="text-sm text-slate-900">
                    {d.captionSummary
                      ? `Poster: ${d.captionSummary}`
                      : "Event poster"}{" "}
                    · due {d.dueDate}
                  </span>
                  {data.canEdit ? (
                    <select
                      value={d.status}
                      onChange={(e) => updateDeliverable(d.id, e.target.value)}
                      className="rounded border text-sm"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <StatusBadge status={d.status} label={d.status.replace("_", " ")} />
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {committee.slug === "internal-relations" && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Room booking queue</h2>
          {data.deliverables.filter((d) => d.type === "room_booking").length ===
          0 ? (
            <p className="text-sm text-slate-600">No room requests yet.</p>
          ) : (
            <div className="space-y-2">
              {data.deliverables
                .filter((d) => d.type === "room_booking")
                .map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded border bg-white p-3"
                  >
                    <div className="min-w-0 text-sm text-slate-900">
                      {d.captionSummary ?? "Room booking"}
                      {d.dueDate && (
                        <span className="text-slate-500"> · due {d.dueDate}</span>
                      )}
                      {d.linkedEventId && (
                        <Link
                          href={`/events/${d.linkedEventId}`}
                          className="mt-1 block text-[#00629B] hover:underline"
                        >
                          View event
                        </Link>
                      )}
                    </div>
                    {data.canEdit ? (
                      <select
                        value={d.status}
                        onChange={(e) =>
                          updateDeliverable(d.id, e.target.value)
                        }
                        className="shrink-0 rounded border text-sm"
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Booked</option>
                      </select>
                    ) : (
                      <StatusBadge
                        status={d.status}
                        label={d.status === "done" ? "booked" : d.status.replace("_", " ")}
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Meeting notes</h2>
        {data.meetingNotes.length === 0 ? (
          <p className="text-sm text-slate-500">None</p>
        ) : (
          <ul className="space-y-2">
            {data.meetingNotes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/meetings/${n.id}`}
                  className="block rounded border bg-white p-3 text-sm hover:border-[#00629B]/40"
                >
                  {format(new Date(n.meetingDate), "MMM d, yyyy")}
                  {n.summary && (
                    <span className="mt-1 block line-clamp-2 text-slate-600">
                      {n.summary}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Open action items</h2>
        {data.actionItems.length === 0 ? (
          <p className="text-sm text-slate-500">None</p>
        ) : (
          <ul className="space-y-2">
            {data.actionItems.map((a) => (
              <li key={a.id} className="rounded border bg-white p-3 text-sm">
                {a.description}
                {a.dueDate && (
                  <span className="text-slate-400"> — due {a.dueDate}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
