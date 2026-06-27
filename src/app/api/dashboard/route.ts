import { NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  committees,
  events,
  deliverables,
  actionItems,
  eventChecklistItems,
} from "@/lib/db/schema";
import {
  eventCadenceStatus,
  getLastCompletedDate,
  getUpcomingEvents,
} from "@/lib/kpi";
import { isOverdue } from "@/lib/checklist";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allCommittees = await db
    .select()
    .from(committees)
    .orderBy(committees.sortOrder);

  const allEvents = await db
    .select()
    .from(events)
    .where(isNull(events.deletedAt));

  const openActions = await db
    .select()
    .from(actionItems)
    .where(eq(actionItems.status, "open"));

  const posters = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.type, "poster"));

  const roomBookings = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.type, "room_booking"));

  const checklistItems = await db.select().from(eventChecklistItems);

  const committeeCards = allCommittees.map((committee) => {
    const committeeEvents = allEvents.filter(
      (e) => e.committeeId === committee.id,
    );
    const lastCompleted = getLastCompletedDate(committeeEvents);
    const upcoming = getUpcomingEvents(committeeEvents);
    const nextEvent = upcoming[0] ?? null;

    let status: string = "on_track";
    if (committee.trackingType === "events") {
      status = eventCadenceStatus(lastCompleted, nextEvent ? new Date(nextEvent.startAt) : null);
    } else if (committee.trackingType === "deliverables") {
      const pending = posters.filter((p) => p.status !== "done").length;
      status = pending > 0 ? "at_risk" : "on_track";
    } else if (committee.trackingType === "rooms") {
      const pending = roomBookings.filter((r) => r.status !== "done").length;
      status = pending > 0 ? "at_risk" : "on_track";
    }

    const openCount = openActions.filter(
      (a) => a.committeeId === committee.id,
    ).length;

    return {
      ...committee,
      status,
      daysSinceLastEvent: lastCompleted
        ? Math.floor(
            (Date.now() - lastCompleted.getTime()) / 86400000,
          )
        : null,
      nextEvent: nextEvent
        ? { id: nextEvent.id, title: nextEvent.title, startAt: nextEvent.startAt }
        : null,
      openActionItems: openCount,
    };
  });

  const eventsWithOverdueChecklist = allEvents
    .filter((e) => e.usePlanningChecklist && new Date(e.startAt) > new Date())
    .filter((e) => {
      const items = checklistItems.filter((c) => c.eventId === e.id);
      return items.some((item) => isOverdue(item.dueDate, item.status));
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      committeeId: e.committeeId,
    }));

  const posterBacklog = posters.filter((p) => p.status !== "done");

  return NextResponse.json({
    committeeCards,
    widgets: {
      overdueActionItems: openActions.length,
      committeesAtRisk: committeeCards.filter((c) => c.status === "at_risk" || c.status === "behind").length,
      posterBacklog: posterBacklog.length,
      eventsWithOverdueChecklist,
    },
  });
}
