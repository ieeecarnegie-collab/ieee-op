"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { checklistProgress, isOverdue, milestoneLabel, itemApplies } from "@/lib/checklist";
import { formatExpenseAmount, type ExpenseRecord } from "@/lib/expense-types";
import type { Event, EventChecklistItem } from "@/lib/db/schema";
import type { ChecklistCondition } from "@/lib/seed-data";

export function EventDetailClient({
  event,
  committeeSlug,
  committeeName,
  checklist,
  poster,
  roomBooking,
  canEdit,
  posterJustRequested,
  roomBookingJustRequested,
  expenses,
}: {
  event: Event;
  committeeSlug: string;
  committeeName: string;
  checklist: EventChecklistItem[];
  poster: { id: string; status: string } | null;
  roomBooking: { id: string; status: string } | null;
  canEdit: boolean;
  posterJustRequested?: boolean;
  roomBookingJustRequested?: boolean;
  expenses: ExpenseRecord[];
}) {
  const router = useRouter();
  const [expenseForm, setExpenseForm] = useState({ amount: "", notes: "" });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState(false);
  const [planningSaving, setPlanningSaving] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [planningView, setPlanningView] = useState({
    needsFoodSponsored: !!event.needsFoodSponsored,
    needsFoodInternal: !!event.needsFoodInternal,
    needsSupplies: !!event.needsSupplies,
    hasExternalGuests: !!event.hasExternalGuests,
  });
  const [planningDraft, setPlanningDraft] = useState(planningView);

  useEffect(() => {
    if (!editingPlanning) {
      const next = {
        needsFoodSponsored: !!event.needsFoodSponsored,
        needsFoodInternal: !!event.needsFoodInternal,
        needsSupplies: !!event.needsSupplies,
        hasExternalGuests: !!event.hasExternalGuests,
      };
      setPlanningView(next);
      setPlanningDraft(next);
    }
  }, [
    event.needsFoodSponsored,
    event.needsFoodInternal,
    event.needsSupplies,
    event.hasExternalGuests,
    editingPlanning,
  ]);

  async function updateItem(itemId: string, status: string) {
    await fetch(`/api/events/${event.id}/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function updateEvent(fields: Partial<Event>) {
    await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    router.refresh();
  }

  async function logExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError(null);
    setExpenseSubmitting(true);

    const res = await fetch(`/api/events/${event.id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(expenseForm.amount),
        notes: expenseForm.notes || undefined,
      }),
    });

    setExpenseSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setExpenseError(data.error ?? "Could not log expense.");
      return;
    }

    setExpenseForm({ amount: "", notes: "" });
    router.refresh();
  }

  function startEditingPlanning() {
    setPlanningDraft(planningView);
    setPlanningError(null);
    setEditingPlanning(true);
  }

  async function savePlanning() {
    setPlanningSaving(true);
    setPlanningError(null);

    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planningDraft),
    });

    setPlanningSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPlanningError(data.error ?? "Could not save planning options.");
      return;
    }

    setPlanningView(planningDraft);
    setEditingPlanning(false);
    router.refresh();
  }

  function cancelPlanningEdit() {
    setPlanningDraft(planningView);
    setPlanningError(null);
    setEditingPlanning(false);
  }

  const planningOptions = [
    { key: "needsFoodSponsored" as const, label: "Food - Sponsored" },
    { key: "needsFoodInternal" as const, label: "Food - Internal" },
    { key: "needsSupplies" as const, label: "Needs supplies" },
    { key: "hasExternalGuests" as const, label: "External guests" },
  ];

  const activePlanningOptions = planningOptions.filter(
    (option) => planningView[option.key],
  );

  const planningEvent = {
    ...event,
    needsFoodSponsored: planningView.needsFoodSponsored,
    needsFoodInternal: planningView.needsFoodInternal,
    needsSupplies: planningView.needsSupplies,
    hasExternalGuests: planningView.hasExternalGuests,
    needsFood:
      planningView.needsFoodSponsored || planningView.needsFoodInternal,
  };

  const progress = checklistProgress(checklist, planningEvent);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const grouped = [14, 7, 3, 0].map((offset) => ({
    offset,
    label: milestoneLabel(offset),
    items: checklist
      .filter(
        (i) =>
          i.offsetDays === offset &&
          itemApplies(i.condition as ChecklistCondition, planningEvent),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return (
    <div>
      <Link
        href={`/committees/${committeeSlug}`}
        className="text-sm text-[#00629B] hover:underline"
      >
        ← {committeeName}
      </Link>

      {posterJustRequested && poster && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Poster request sent to PR — due{" "}
          {format(
            new Date(new Date(event.startAt).getTime() - 14 * 86400000),
            "MMM d, yyyy",
          )}
          .{" "}
          <Link href="/committees/pr" className="font-medium underline">
            View PR backlog
          </Link>
        </div>
      )}

      {roomBookingJustRequested && roomBooking && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Room booking request sent to Internal Relations — due{" "}
          {format(
            new Date(new Date(event.startAt).getTime() - 14 * 86400000),
            "MMM d, yyyy",
          )}
          .{" "}
          <Link
            href="/committees/internal-relations"
            className="font-medium underline"
          >
            View room booking queue
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-slate-600">
            {format(new Date(event.startAt), "MMM d, yyyy h:mm a")}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
        <div className="flex gap-2">
          {event.isSignature && (
            <span className="rounded border border-[#00629B] px-2 py-1 text-xs text-[#00629B]">
              signature
            </span>
          )}
          <StatusBadge status={event.status} />
        </div>
      </div>

      {event.usePlanningChecklist && (
        <>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-sm">
              <span>Planning progress</span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-[#00629B]"
                style={{
                  width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 rounded border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">Planning options</p>
                {editingPlanning ? (
                  <div className="mt-2 flex flex-wrap gap-4">
                    {planningOptions.map((option) => (
                      <label key={option.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={planningDraft[option.key]}
                          onChange={(e) =>
                            setPlanningDraft({
                              ...planningDraft,
                              [option.key]: e.target.checked,
                            })
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-slate-600">
                    {activePlanningOptions.length > 0
                      ? activePlanningOptions.map((o) => o.label).join(" · ")
                      : "None selected"}
                  </p>
                )}
              </div>
              {canEdit && !editingPlanning && (
                <button
                  type="button"
                  onClick={startEditingPlanning}
                  className="text-sm text-[#00629B] hover:underline"
                >
                  Edit
                </button>
              )}
              {canEdit && editingPlanning && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={savePlanning}
                      disabled={planningSaving}
                      className="rounded bg-[#00629B] px-3 py-1 text-sm text-white disabled:opacity-50"
                    >
                      {planningSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelPlanningEdit}
                      disabled={planningSaving}
                      className="rounded border px-3 py-1 text-sm text-slate-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {planningError && (
                    <p className="text-xs text-red-600">{planningError}</p>
                  )}
                </div>
              )}
            </div>

            {canEdit && (
              <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <input
                  placeholder="Sign-up form URL"
                  className="min-w-[200px] flex-1 rounded border px-2 py-1"
                  defaultValue={event.signupFormUrl ?? ""}
                  onBlur={(e) => updateEvent({ signupFormUrl: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="RSVP count"
                  className="w-24 rounded border px-2 py-1"
                  defaultValue={event.rsvpCount ?? ""}
                  onBlur={(e) =>
                    updateEvent({ rsvpCount: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}
          </div>

          {poster && (
            <p className="mt-4 text-sm text-slate-600">
              PR poster:{" "}
              <StatusBadge
                status={poster.status.replace("_", " ")}
                label={poster.status.replace("_", " ")}
              />
            </p>
          )}

          <section
            id="expenses"
            className="mt-6 rounded border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Expenses</h2>
              {expenses.length > 0 && (
                <p className="text-sm font-medium text-slate-700">
                  Event total: {formatExpenseAmount(expenseTotal)}
                </p>
              )}
            </div>

            {canEdit && (
              <form onSubmit={logExpense} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                  <div>
                    <label
                      htmlFor="expense-amount"
                      className="mb-1 block text-sm text-slate-700"
                    >
                      Amount ($)
                    </label>
                    <input
                      id="expense-amount"
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="expense-notes"
                      className="mb-1 block text-sm text-slate-700"
                    >
                      Notes
                    </label>
                    <input
                      id="expense-notes"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="e.g. food, supplies"
                      value={expenseForm.notes}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                {expenseError && (
                  <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                    {expenseError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="rounded bg-[#00629B] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {expenseSubmitting ? "Saving…" : "Log expense"}
                </button>
              </form>
            )}

            {expenses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No expenses logged yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
                  >
                    <span>
                      {formatExpenseAmount(expense.amount)}
                      {expense.notes && (
                        <span className="text-slate-500"> — {expense.notes}</span>
                      )}
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {expense.loggedByName}
                        {expense.createdAt &&
                          ` · ${format(new Date(expense.createdAt), "MMM d, yyyy")}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-6 space-y-4">
            {grouped.map((group) => (
              <details
                key={group.offset}
                open={group.offset >= 7}
                className="rounded border bg-white"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium">
                  {group.label}
                  {group.items.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({group.items.filter((i) => i.status === "done").length}/
                      {group.items.length})
                    </span>
                  )}
                </summary>
                <ul className="border-t px-4 py-2">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-2 border-b py-2 last:border-0 ${isOverdue(item.dueDate, item.status) ? "text-red-700" : ""}`}
                    >
                      <span className="text-sm">
                        {item.status === "done" ? "✓ " : ""}
                        {item.title}
                        {item.title === "Log Expenses" && item.status !== "done" && (
                          <a
                            href="#expenses"
                            className="ml-2 text-xs text-[#00629B] hover:underline"
                          >
                            Log →
                          </a>
                        )}
                        {item.isRecommended && (
                          <span className="ml-1 text-xs text-slate-400">
                            (recommended)
                          </span>
                        )}
                        {isOverdue(item.dueDate, item.status) && (
                          <span className="ml-2 text-xs font-medium">OVERDUE</span>
                        )}
                      </span>
                      {canEdit && item.status !== "done" && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => updateItem(item.id, "done")}
                            className="rounded border px-2 py-0.5 text-xs hover:bg-emerald-50"
                          >
                            Done
                          </button>
                          {item.isOptional && (
                            <button
                              onClick={() => updateItem(item.id, "not_applicable")}
                              className="rounded border px-2 py-0.5 text-xs hover:bg-slate-50"
                            >
                              N/A
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}

      {!event.usePlanningChecklist && (
        <p className="mt-6 text-slate-500">
          Planning checklist not used for recurring operational meetings.
        </p>
      )}
    </div>
  );
}
