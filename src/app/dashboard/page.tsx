import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { CommitteeCard } from "@/components/CommitteeCard";
import { db } from "@/lib/db";
import {
  committees,
  events,
  deliverables,
  actionItems,
  eventChecklistItems,
  signatureEventTemplates,
} from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import {
  eventCadenceStatus,
  getLastCompletedDate,
  getUpcomingEvents,
} from "@/lib/kpi";
import { isOverdue } from "@/lib/checklist";
import { getCurrentMonthPeriod, formatMonthRange } from "@/lib/month-period";
import { getSignatureCompletion } from "@/lib/signature";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const month = getCurrentMonthPeriod();

  const allCommittees = await db.select().from(committees).orderBy(committees.sortOrder);
  const allEvents = await db.select().from(events).where(isNull(events.deletedAt));
  const openActions = await db.select().from(actionItems).where(eq(actionItems.status, "open"));
  const posters = await db.select().from(deliverables).where(eq(deliverables.type, "poster"));
  const roomBookings = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.type, "room_booking"));
  const checklistItems = await db.select().from(eventChecklistItems);
  const allSignatureTemplates = await db.select().from(signatureEventTemplates);

  const committeeMap = Object.fromEntries(allCommittees.map((c) => [c.id, c]));

  const signatureChecklist = allSignatureTemplates.map((template) => {
    const committee = committeeMap[template.committeeId];
    const committeeEvents = allEvents.filter(
      (e) => e.committeeId === template.committeeId,
    );
    const { completed, matchedEvent, scheduledThisMonth } = getSignatureCompletion(
      template.name,
      committeeEvents,
      month,
    );
    return {
      id: template.id,
      committeeSlug: committee?.slug ?? "",
      committeeName: committee?.name ?? "",
      name: template.name,
      completed,
      scheduledThisMonth,
      matchedEventTitle: matchedEvent?.title ?? null,
      eventDate: matchedEvent?.startAt?.slice(0, 10) ?? null,
    };
  });

  const signatureThisMonth = signatureChecklist.filter(
    (s) => s.scheduledThisMonth || s.completed,
  );

  const cards = allCommittees.map((committee) => {
    const committeeEvents = allEvents.filter((e) => e.committeeId === committee.id);
    const lastCompleted = getLastCompletedDate(committeeEvents);
    const upcoming = getUpcomingEvents(committeeEvents);
    const nextEvent = upcoming[0] ?? null;

    let status = "on_track";
    if (committee.trackingType === "events") {
      status = eventCadenceStatus(
        lastCompleted,
        nextEvent ? new Date(nextEvent.startAt) : null,
      );
    } else if (committee.trackingType === "deliverables") {
      status = posters.some((p) => p.status !== "done") ? "at_risk" : "on_track";
    } else if (committee.trackingType === "rooms") {
      status = roomBookings.some((r) => r.status !== "done")
        ? "at_risk"
        : "on_track";
    }

    return {
      ...committee,
      status,
      daysSinceLastEvent: lastCompleted
        ? Math.floor((Date.now() - lastCompleted.getTime()) / 86400000)
        : null,
      nextEvent,
      openActionItems: openActions.filter((a) => a.committeeId === committee.id).length,
      backlogCount:
        committee.trackingType === "deliverables"
          ? posters.filter((p) => p.status !== "done").length
          : committee.trackingType === "rooms"
            ? roomBookings.filter((r) => r.status !== "done").length
            : undefined,
    };
  });

  const overduePlanning = allEvents
    .filter((e) => e.usePlanningChecklist && new Date(e.startAt) > new Date())
    .filter((e) =>
      checklistItems
        .filter((c) => c.eventId === e.id)
        .some((item) => isOverdue(item.dueDate, item.status)),
    );

  const completedCount = signatureThisMonth.filter((s) => s.completed).length;

  return (
    <InternalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          Weekly exec meeting — {format(new Date(), "MMM d, yyyy")} · {month.monthLabel}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded bg-red-50 px-3 py-1 text-red-700">
          {openActions.length} overdue/open action items
        </span>
        <span className="rounded bg-amber-50 px-3 py-1 text-amber-700">
          {cards.filter((c) => c.status !== "on_track").length} committees need attention
        </span>
        <span className="rounded bg-blue-50 px-3 py-1 text-blue-700">
          {posters.filter((p) => p.status !== "done").length} posters pending
        </span>
        {signatureThisMonth.length > 0 && (
          <span className="rounded bg-green-50 px-3 py-1 text-green-700">
            {completedCount}/{signatureThisMonth.length} signature events done this month
          </span>
        )}
      </div>

      {overduePlanning.length > 0 && (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Event planning due</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {overduePlanning.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`} className="text-[#00629B] hover:underline">
                  {e.title} — {format(new Date(e.startAt), "MMM d")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-slate-900">
        <h2 className="font-semibold text-slate-900">Signature events this month</h2>
        <p className="mt-1 text-sm text-slate-600">{formatMonthRange(month)}</p>
        {signatureThisMonth.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No signature events scheduled this month.
          </p>
        ) : (
          <ul className="mt-3 grid gap-1 text-sm text-slate-800 sm:grid-cols-2 lg:grid-cols-3">
            {signatureThisMonth.map((s) => (
              <li key={s.id}>
                <span className={s.completed ? "text-green-700" : "text-amber-600"}>
                  {s.completed ? "✓" : "○"}
                </span>{" "}
                <span className="font-medium text-slate-700">{s.committeeName}:</span>{" "}
                <span className="text-slate-900">{s.name}</span>
                {s.eventDate && (
                  <span className="text-slate-600"> · {s.eventDate}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <CommitteeCard
            key={c.id}
            slug={c.slug}
            name={c.name}
            trackingType={c.trackingType}
            status={c.status}
            daysSinceLastEvent={c.daysSinceLastEvent}
            nextEvent={c.nextEvent}
            openActionItems={c.openActionItems}
            backlogCount={c.backlogCount}
          />
        ))}
      </div>
    </InternalLayout>
  );
}
