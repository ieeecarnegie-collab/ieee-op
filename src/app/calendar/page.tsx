import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { CalendarClient } from "./CalendarClient";
import { db } from "@/lib/db";
import { events, committees } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allEvents = await db.select().from(events).where(isNull(events.deletedAt));
  const allCommittees = await db.select().from(committees).orderBy(committees.sortOrder);

  const canCreate = session.user.canEditAll || session.user.committeeEditScopes.length > 0;

  return (
    <InternalLayout>
      <CalendarClient
        events={allEvents}
        committees={allCommittees}
        canCreate={canCreate}
      />
    </InternalLayout>
  );
}
