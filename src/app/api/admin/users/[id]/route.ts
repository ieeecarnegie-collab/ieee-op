import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  userPermissions,
  committeeMemberships,
  committees,
} from "@/lib/db/schema";
import { canManageUsers as canManage, rosterPermissionsFromCommittees } from "@/lib/permissions";

async function syncCommitteeMemberships(userId: string, slugs: string[]) {
  await db
    .delete(committeeMemberships)
    .where(eq(committeeMemberships.userId, userId));

  for (const slug of slugs) {
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
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManage(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  if (email !== user.email) {
    const [duplicate] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)));
    if (duplicate) {
      return NextResponse.json(
        { error: "That email is already on the roster" },
        { status: 409 },
      );
    }
  }

  const committeesList: string[] = body.committees ?? [];
  const { canEditAll, canManageUsers } =
    rosterPermissionsFromCommittees(committeesList);

  await db
    .update(users)
    .set({
      name,
      email,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  const [permissions] = await db
    .select()
    .from(userPermissions)
    .where(eq(userPermissions.userId, id));

  if (permissions) {
    await db
      .update(userPermissions)
      .set({
        canEditAll,
        canManageUsers,
        committeeEditScopes: JSON.stringify(committeesList),
      })
      .where(eq(userPermissions.userId, id));
  } else {
    await db.insert(userPermissions).values({
      id: randomUUID(),
      userId: id,
      canViewAll: true,
      canEditAll,
      canManageUsers,
      committeeEditScopes: JSON.stringify(committeesList),
    });
  }

  await syncCommitteeMemberships(id, committeesList);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !canManage(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account" },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({
      status: "inactive",
      isExecMember: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}
