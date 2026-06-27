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
import { canManageUsers as canManage } from "@/lib/permissions";

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
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: body.email,
    name: body.name,
    isExecMember: true,
    status: "active",
  });

  await db.insert(userPermissions).values({
    id: randomUUID(),
    userId,
    canViewAll: true,
    canEditAll: body.canEditAll ?? false,
    canManageUsers: body.canManageUsers ?? false,
    committeeEditScopes: JSON.stringify(body.committees ?? []),
  });

  for (const slug of body.committees ?? []) {
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
