import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { CommitteePageClient } from "./CommitteePageClient";
import { db } from "@/lib/db";
import {
  committees,
  events,
  meetingNotes,
  actionItems,
  deliverables,
  goals,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { canEdit } from "@/lib/permissions";
import { getExecRoster } from "@/lib/exec-roster";
import {
  buildExecAttendanceMatrix,
  PREZ_COMMITTEE_ID,
} from "@/lib/exec-attendance";
import { getAllExpenses, sumExpenses } from "@/lib/expenses";

export default async function CommitteePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.slug, slug));

  if (!committee) notFound();

  const committeeEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.committeeId, committee.id), isNull(events.deletedAt)));

  const notes = await db
    .select()
    .from(meetingNotes)
    .where(eq(meetingNotes.committeeId, committee.id));

  const items = await db
    .select()
    .from(actionItems)
    .where(
      and(
        eq(actionItems.committeeId, committee.id),
        eq(actionItems.status, "open"),
      ),
    );

  const committeeGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.committeeId, committee.id));

  let deliverableList: (typeof deliverables.$inferSelect)[] = [];
  if (committee.slug === "pr" || committee.slug === "internal-relations") {
    deliverableList = await db.select().from(deliverables);
  }

  let execAttendance = null;
  let expenseList: Awaited<ReturnType<typeof getAllExpenses>> = [];
  let expenseTotal = 0;
  if (committee.slug === "prez") {
    const roster = await getExecRoster();
    const prezNotes = await db
      .select({
        id: meetingNotes.id,
        meetingDate: meetingNotes.meetingDate,
        attendeeIds: meetingNotes.attendeeIds,
      })
      .from(meetingNotes)
      .where(eq(meetingNotes.committeeId, PREZ_COMMITTEE_ID));
    execAttendance = buildExecAttendanceMatrix(roster, prezNotes);
    expenseList = await getAllExpenses();
    expenseTotal = sumExpenses(expenseList);
  }

  return (
    <InternalLayout>
      <CommitteePageClient
        data={{
          committee,
          events: committeeEvents,
          meetingNotes: notes,
          actionItems: items,
          goals: committeeGoals,
          deliverables: deliverableList,
          canEdit: canEdit(session.user, slug),
          execAttendance,
          expenses: expenseList,
          expenseTotal,
        }}
      />
    </InternalLayout>
  );
}
