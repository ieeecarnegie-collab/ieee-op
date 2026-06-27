import { differenceInDays, format, subDays } from "date-fns";
import type { Event } from "@/lib/db/schema";

export type CadenceStatus = "on_track" | "at_risk" | "behind";

export function eventCadenceStatus(
  lastEventDate: Date | null,
  nextEventDate: Date | null,
): CadenceStatus {
  const now = new Date();
  if (nextEventDate && nextEventDate.getTime() - now.getTime() <= 30 * 86400000) {
    return "on_track";
  }
  if (lastEventDate) {
    const daysSince = differenceInDays(now, lastEventDate);
    if (daysSince <= 45) return "on_track";
    if (daysSince <= 60) return "at_risk";
  }
  return "behind";
}

export function roomBookingDueDate(startAt: string): string {
  return format(subDays(new Date(startAt), 14), "yyyy-MM-dd");
}

export function posterDueDate(startAt: string): string {
  return format(subDays(new Date(startAt), 7), "yyyy-MM-dd");
}

export function getCompletedEvents(events: Event[]): Event[] {
  return events.filter((e) => e.status === "completed" && !e.deletedAt);
}

export function getUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  return events
    .filter(
      (e) =>
        !e.deletedAt &&
        e.status !== "cancelled" &&
        e.status !== "completed" &&
        new Date(e.startAt) >= now,
    )
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}

export function getLastCompletedDate(events: Event[]): Date | null {
  const completed = getCompletedEvents(events)
    .map((e) => new Date(e.startAt))
    .sort((a, b) => b.getTime() - a.getTime());
  return completed[0] ?? null;
}
