import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { AdminClient } from "./AdminClient";
import { db } from "@/lib/db";
import {
  users,
  userPermissions,
  committeeMemberships,
  committees,
  eventPlanningTemplates,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSemesterSettings } from "@/lib/settings";
import { ensureCurrentSemester } from "@/lib/semester";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.canManageUsers) redirect("/dashboard");

  await ensureCurrentSemester();

  const roster = await db.select().from(users);
  const enriched = await Promise.all(
    roster.map(async (user) => {
      const [permissions] = await db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));
      const memberships = await db
        .select({ slug: committees.slug, name: committees.name })
        .from(committeeMemberships)
        .innerJoin(committees, eq(committees.id, committeeMemberships.committeeId))
        .where(eq(committeeMemberships.userId, user.id));
      return { user, permissions, memberships };
    }),
  );

  const settings = await getSemesterSettings();
  const templates = await db
    .select()
    .from(eventPlanningTemplates)
    .orderBy(eventPlanningTemplates.offsetDays, eventPlanningTemplates.sortOrder);
  const allCommittees = await db
    .select({ slug: committees.slug, name: committees.name })
    .from(committees)
    .orderBy(committees.sortOrder);

  return (
    <InternalLayout>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-slate-600">
        Roster, semester settings, planning template, and email digests.
      </p>

      <div className="mt-6">
        <AdminClient
          roster={enriched}
          committees={allCommittees}
          initialSettings={settings}
          initialTemplates={templates}
        />
      </div>
    </InternalLayout>
  );
}
