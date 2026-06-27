import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, committees } from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [goal] = await db.select().from(goals).where(eq(goals.id, id));
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, goal.committeeId));

  if (!committee || !canEdit(session.user, committee.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  await db
    .update(goals)
    .set({
      title: body.title ?? goal.title,
      targetMetric: body.targetMetric ?? goal.targetMetric,
      deadline: body.deadline ?? goal.deadline,
      status: body.status ?? goal.status,
      notes: body.notes ?? goal.notes,
    })
    .where(eq(goals.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [goal] = await db.select().from(goals).where(eq(goals.id, id));
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, goal.committeeId));

  if (!committee || !canEdit(session.user, committee.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(goals).where(eq(goals.id, id));
  return NextResponse.json({ ok: true });
}
