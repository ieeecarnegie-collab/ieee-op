import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventChecklistItems } from "@/lib/db/schema";
import { getEventById } from "@/lib/events";
import { canEdit } from "@/lib/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const data = await getEventById(id);
  if (!data?.committee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canEdit(session.user, data.committee.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  await db
    .update(eventChecklistItems)
    .set({
      status: body.status,
      completedAt: body.status === "done" ? now : null,
      completedBy: body.status === "done" ? session.user.id : null,
    })
    .where(eq(eventChecklistItems.id, itemId));

  const [updated] = await db
    .select()
    .from(eventChecklistItems)
    .where(eq(eventChecklistItems.id, itemId));

  return NextResponse.json(updated);
}
