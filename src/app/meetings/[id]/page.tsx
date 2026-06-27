import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { InternalLayout } from "@/components/InternalLayout";
import { db } from "@/lib/db";
import {
  meetingNotes,
  actionItems,
  committees,
  users,
} from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";
import { parseAttendeeIds, PREZ_COMMITTEE_ID } from "@/lib/exec-attendance";
import { getExecRoster } from "@/lib/exec-roster";
import { MeetingDetailClient } from "./MeetingDetailClient";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [note] = await db
    .select()
    .from(meetingNotes)
    .where(eq(meetingNotes.id, id));

  if (!note) notFound();

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
      if (!item.ownerId) return { ...item, ownerName: null };
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.ownerId));
      return { ...item, ownerName: owner?.name ?? null };
    }),
  );

  const attendeeIds = parseAttendeeIds(note.attendeeIds);
  const execRoster =
    committee?.id === PREZ_COMMITTEE_ID ? await getExecRoster() : [];
  const attendees = execRoster.filter((m) => attendeeIds.includes(m.id));
  const userCanEdit = committee ? canEdit(session.user, committee.slug) : false;

  return (
    <InternalLayout>
      <MeetingDetailClient
        note={{
          id: note.id,
          meetingDate: note.meetingDate,
          summary: note.summary,
          committeeId: note.committeeId,
        }}
        committeeName={committee?.name ?? "Unknown"}
        authorName={author?.name ?? "Unknown"}
        actionItems={enrichedItems}
        attendees={attendees}
        execRoster={execRoster}
        attendeeIds={attendeeIds}
        isPrezMeeting={committee?.id === PREZ_COMMITTEE_ID}
        canEdit={userCanEdit}
      />
    </InternalLayout>
  );
}
