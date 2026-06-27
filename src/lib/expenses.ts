import { randomUUID } from "crypto";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  eventExpenses,
  events,
  committees,
  users,
  eventChecklistItems,
} from "@/lib/db/schema";
import type { ExpenseRecord } from "@/lib/expense-types";

export type { ExpenseRecord } from "@/lib/expense-types";
export { formatExpenseAmount, sumExpenses } from "@/lib/expense-types";

export async function getExpensesForEvent(
  eventId: string,
): Promise<ExpenseRecord[]> {
  const rows = await db
    .select({
      id: eventExpenses.id,
      eventId: eventExpenses.eventId,
      eventTitle: events.title,
      committeeId: eventExpenses.committeeId,
      committeeName: committees.name,
      committeeSlug: committees.slug,
      amount: eventExpenses.amount,
      notes: eventExpenses.notes,
      loggedById: eventExpenses.loggedBy,
      loggedByName: users.name,
      createdAt: eventExpenses.createdAt,
    })
    .from(eventExpenses)
    .innerJoin(events, eq(events.id, eventExpenses.eventId))
    .innerJoin(committees, eq(committees.id, eventExpenses.committeeId))
    .innerJoin(users, eq(users.id, eventExpenses.loggedBy))
    .where(eq(eventExpenses.eventId, eventId))
    .orderBy(desc(eventExpenses.createdAt));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  const rows = await db
    .select({
      id: eventExpenses.id,
      eventId: eventExpenses.eventId,
      eventTitle: events.title,
      committeeId: eventExpenses.committeeId,
      committeeName: committees.name,
      committeeSlug: committees.slug,
      amount: eventExpenses.amount,
      notes: eventExpenses.notes,
      loggedById: eventExpenses.loggedBy,
      loggedByName: users.name,
      createdAt: eventExpenses.createdAt,
    })
    .from(eventExpenses)
    .innerJoin(events, eq(events.id, eventExpenses.eventId))
    .innerJoin(committees, eq(committees.id, eventExpenses.committeeId))
    .innerJoin(users, eq(users.id, eventExpenses.loggedBy))
    .where(isNull(events.deletedAt))
    .orderBy(desc(eventExpenses.createdAt));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function logEventExpense(input: {
  eventId: string;
  committeeId: string;
  amount: number;
  notes?: string;
  loggedBy: string;
}): Promise<string> {
  const expenseId = randomUUID();
  await db.insert(eventExpenses).values({
    id: expenseId,
    eventId: input.eventId,
    committeeId: input.committeeId,
    amount: input.amount,
    notes: input.notes?.trim() || null,
    loggedBy: input.loggedBy,
  });

  const now = new Date().toISOString();
  const checklistItems = await db
    .select()
    .from(eventChecklistItems)
    .where(
      and(
        eq(eventChecklistItems.eventId, input.eventId),
        eq(eventChecklistItems.title, "Log Expenses"),
      ),
    );

  for (const item of checklistItems) {
    if (item.status === "pending") {
      await db
        .update(eventChecklistItems)
        .set({
          status: "done",
          completedAt: now,
          completedBy: input.loggedBy,
        })
        .where(eq(eventChecklistItems.id, item.id));
    }
  }

  return expenseId;
}
