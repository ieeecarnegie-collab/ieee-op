import type { Event } from "@/lib/db/schema";
import type { MonthPeriod } from "@/lib/month-period";
import { isDateInMonth } from "@/lib/month-period";

const COMPLETED_STATUSES = new Set(["completed", "confirmed"]);

export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function eventMatchesTemplate(
  event: Event,
  templateName: string,
): boolean {
  const eventNorm = normalizeTitle(event.title);
  const templateNorm = normalizeTitle(templateName);
  if (eventNorm === templateNorm) return true;
  if (eventNorm.includes(templateNorm) || templateNorm.includes(eventNorm)) {
    return true;
  }
  const templateWords = templateNorm.split(" ").filter((w) => w.length > 3);
  const matches = templateWords.filter((w) => eventNorm.includes(w));
  return matches.length >= Math.min(2, templateWords.length);
}

export function isSignatureEventComplete(
  event: Event,
  period: MonthPeriod,
): boolean {
  if (!event.isSignature) return false;
  if (!COMPLETED_STATUSES.has(event.status)) return false;
  const eventDate = event.startAt.slice(0, 10);
  return isDateInMonth(eventDate, period);
}

export function getSignatureCompletion(
  templateName: string,
  events: Event[],
  period: MonthPeriod,
): {
  completed: boolean;
  scheduledThisMonth: boolean;
  matchedEvent: Event | null;
} {
  const monthEvents = events.filter((e) => {
    const date = e.startAt.slice(0, 10);
    return isDateInMonth(date, period) && e.isSignature;
  });

  const matched =
    monthEvents.find((e) => eventMatchesTemplate(e, templateName)) ?? null;

  return {
    completed: !!matched && COMPLETED_STATUSES.has(matched.status),
    scheduledThisMonth: !!matched,
    matchedEvent: matched,
  };
}

/** Signature events occurring in the given month (for dashboard list). */
export function getSignatureEventsInMonth(
  events: Event[],
  period: MonthPeriod,
): Event[] {
  return events
    .filter((e) => {
      if (!e.isSignature) return false;
      return isDateInMonth(e.startAt.slice(0, 10), period);
    })
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}
