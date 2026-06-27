import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventPlanningTemplates } from "@/lib/db/schema";
import { canManageUsers } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await db
    .select()
    .from(eventPlanningTemplates)
    .orderBy(eventPlanningTemplates.offsetDays, eventPlanningTemplates.sortOrder);

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = randomUUID();

  await db.insert(eventPlanningTemplates).values({
    id,
    offsetDays: body.offsetDays,
    title: body.title,
    sortOrder: body.sortOrder ?? 0,
    isOptional: body.isOptional ?? false,
    isRecommended: body.isRecommended ?? false,
    condition: body.condition ?? "always",
    linksToDeliverable: body.linksToDeliverable ?? false,
  });

  return NextResponse.json({ id }, { status: 201 });
}
