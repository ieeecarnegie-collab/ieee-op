import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  meetingNotes,
  actionItems,
  committees,
} from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await db.select().from(meetingNotes);
  return NextResponse.json(notes);
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

  const noteId = randomUUID();
  await db.insert(meetingNotes).values({
    id: noteId,
    committeeId: body.committeeId,
    authorId: session.user.id,
    meetingDate: body.meetingDate,
    summary: body.summary,
    attendeeIds: JSON.stringify(body.attendeeIds ?? []),
  });

  if (body.actionItems?.length) {
    for (const item of body.actionItems) {
      await db.insert(actionItems).values({
        id: randomUUID(),
        meetingNoteId: noteId,
        committeeId: body.committeeId,
        ownerId: item.ownerId,
        description: item.description,
        dueDate: item.dueDate,
        status: "open",
      });
    }
  }

  return NextResponse.json({ id: noteId }, { status: 201 });
}
