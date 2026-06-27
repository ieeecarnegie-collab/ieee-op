import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, committees } from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";
import { getExpensesForEvent, logEventExpense } from "@/lib/expenses";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const expenses = await getExpensesForEvent(id);
  return NextResponse.json(expenses);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId));

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, event.committeeId));

  if (!committee || !canEdit(session.user, committee.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Enter a valid amount greater than zero." },
      { status: 400 },
    );
  }

  const expenseId = await logEventExpense({
    eventId,
    committeeId: event.committeeId,
    amount: Math.round(amount * 100) / 100,
    notes: body.notes,
    loggedBy: session.user.id,
  });

  return NextResponse.json({ id: expenseId }, { status: 201 });
}
