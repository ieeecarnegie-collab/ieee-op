import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  committees,
  committeeMemberships,
  users,
  events,
  deliverables,
  meetingNotes,
  actionItems,
  signatureEventTemplates,
} from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const [committee] = await db
    .select()
    .from(committees)
    .where(eq(committees.slug, slug));

  if (!committee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const roster = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      roleLabel: committeeMemberships.roleLabel,
    })
    .from(committeeMemberships)
    .innerJoin(users, eq(users.id, committeeMemberships.userId))
    .where(eq(committeeMemberships.committeeId, committee.id));

  const committeeEvents = await db
    .select()
    .from(events)
    .where(
      and(eq(events.committeeId, committee.id), isNull(events.deletedAt)),
    );

  const notes = await db
    .select()
    .from(meetingNotes)
    .where(eq(meetingNotes.committeeId, committee.id))
    .orderBy(meetingNotes.meetingDate);

  const items = await db
    .select()
    .from(actionItems)
    .where(
      and(
        eq(actionItems.committeeId, committee.id),
        eq(actionItems.status, "open"),
      ),
    );

  const signatures = await db
    .select()
    .from(signatureEventTemplates)
    .where(eq(signatureEventTemplates.committeeId, committee.id));

  let deliverableList: (typeof deliverables.$inferSelect)[] = [];
  if (committee.slug === "pr") {
    deliverableList = await db.select().from(deliverables);
  }

  return NextResponse.json({
    committee,
    roster,
    events: committeeEvents,
    meetingNotes: notes,
    actionItems: items,
    signatureTemplates: signatures,
    deliverables: deliverableList,
    canEdit: canEdit(session.user, slug),
  });
}
