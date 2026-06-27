import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventPlanningTemplates } from "@/lib/db/schema";
import { canManageUsers } from "@/lib/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [existing] = await db
    .select()
    .from(eventPlanningTemplates)
    .where(eq(eventPlanningTemplates.id, id));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  await db
    .update(eventPlanningTemplates)
    .set({
      offsetDays: body.offsetDays ?? existing.offsetDays,
      title: body.title ?? existing.title,
      sortOrder: body.sortOrder ?? existing.sortOrder,
      isOptional: body.isOptional ?? existing.isOptional,
      isRecommended: body.isRecommended ?? existing.isRecommended,
      condition: body.condition ?? existing.condition,
      linksToDeliverable:
        body.linksToDeliverable ?? existing.linksToDeliverable,
    })
    .where(eq(eventPlanningTemplates.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db
    .delete(eventPlanningTemplates)
    .where(eq(eventPlanningTemplates.id, id));

  return NextResponse.json({ ok: true });
}
