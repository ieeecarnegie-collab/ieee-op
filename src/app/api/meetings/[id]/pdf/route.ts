import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  meetingNotes,
  actionItems,
  committees,
  users,
} from "@/lib/db/schema";
import { generateMeetingSummaryPdf } from "@/lib/pdf/meeting-summary";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [note] = await db
    .select()
    .from(meetingNotes)
    .where(eq(meetingNotes.id, id));

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.id, note.committeeId));

  const [author] = await db
    .select()
    .from(users)
    .where(eq(users.id, note.authorId));

  const items = await db
    .select()
    .from(actionItems)
    .where(eq(actionItems.meetingNoteId, id));

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      let ownerName: string | null = null;
      if (item.ownerId) {
        const [owner] = await db
          .select()
          .from(users)
          .where(eq(users.id, item.ownerId));
        ownerName = owner?.name ?? null;
      }
      return {
        description: item.description,
        ownerName,
        dueDate: item.dueDate,
        status: item.status,
      };
    }),
  );

  const pdfBytes = generateMeetingSummaryPdf({
    committeeName: committee?.name ?? "Committee",
    meetingDate: note.meetingDate,
    authorName: author?.name ?? "Unknown",
    summary: note.summary,
    actionItems: enrichedItems,
  });

  const filename = `meeting-${note.meetingDate}-${committee?.slug ?? "note"}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
