import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  committeeMemberships,
  committees,
} from "@/lib/db/schema";
import type { ExecMember } from "@/lib/exec-types";

export type { ExecMember } from "@/lib/exec-types";

/** All active exec board members, sorted by name. */
export async function getExecRoster(): Promise<ExecMember[]> {
  const roster = await db
    .select()
    .from(users)
    .where(and(eq(users.isExecMember, true), eq(users.status, "active")))
    .orderBy(asc(users.name));

  return Promise.all(
    roster.map(async (user) => {
      const memberships = await db
        .select({ slug: committees.slug, name: committees.name })
        .from(committeeMemberships)
        .innerJoin(
          committees,
          eq(committees.id, committeeMemberships.committeeId),
        )
        .where(eq(committeeMemberships.userId, user.id));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        committees: memberships.map((m) => m.slug),
      };
    }),
  );
}
