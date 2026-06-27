import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, committees } from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId");

  if (committeeId) {
    const rows = await db
      .select()
      .from(goals)
      .where(eq(goals.committeeId, committeeId));
    return NextResponse.json(rows);
  }

  const rows = await db.select().from(goals);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, body.committeeId));

  if (!committee || !canEdit(session.user, committee.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = randomUUID();
  await db.insert(goals).values({
    id,
    committeeId: body.committeeId,
    title: body.title,
    targetMetric: body.targetMetric ?? null,
    deadline: body.deadline ?? null,
    status: body.status ?? "not_started",
    notes: body.notes ?? null,
  });

  return NextResponse.json({ id }, { status: 201 });
}
