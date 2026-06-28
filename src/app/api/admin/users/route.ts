import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  userPermissions,
  committeeMemberships,
  committees,
} from "@/lib/db/schema";
import { canManageUsers as canManage, rosterPermissionsFromCommittees } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManage(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roster = await db.select().from(users);
  const withPerms = await Promise.all(
    roster.map(async (user) => {
      const [permissions] = await db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));
      const memberships = await db
        .select({ slug: committees.slug })
        .from(committeeMemberships)
        .innerJoin(
          committees,
          eq(committees.id, committeeMemberships.committeeId),
        )
        .where(eq(committeeMemberships.userId, user.id));
      return {
        ...user,
        permissions,
        committees: memberships.map((m) => m.slug),
      };
    }),
  );

  return NextResponse.json(withPerms);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canManage(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const email = body.email?.trim()?.toLowerCase();
  const name = body.name?.trim();

  if (!email || !name) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { error: "That email is already on the roster" },
      { status: 409 },
    );
  }

  const userId = randomUUID();
  const committeesList: string[] = body.committees ?? [];
  const { canEditAll, canManageUsers } =
    rosterPermissionsFromCommittees(committeesList);

  await db.insert(users).values({
    id: userId,
    email,
    name,
    isExecMember: true,
    status: "active",
  });

  await db.insert(userPermissions).values({
    id: randomUUID(),
    userId,
    canViewAll: true,
    canEditAll,
    canManageUsers,
    committeeEditScopes: JSON.stringify(committeesList),
  });

  for (const slug of committeesList) {
    const [committee] = await db
      .select()
      .from(committees)
      .where(eq(committees.slug, slug));
    if (committee) {
      await db.insert(committeeMemberships).values({
        userId,
        committeeId: committee.id,
        roleLabel: "Member",
      });
    }
  }

  return NextResponse.json({ id: userId }, { status: 201 });
}
