import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSemesterSettings,
  setSemesterSettings,
  type SemesterSettings,
} from "@/lib/settings";
import { canManageUsers } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSemesterSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<SemesterSettings>;
  const current = await getSemesterSettings();
  const next: SemesterSettings = {
    semesterStart: body.semesterStart ?? current.semesterStart,
    semesterEnd: body.semesterEnd ?? current.semesterEnd,
    semesterLabel: body.semesterLabel ?? current.semesterLabel,
  };

  await setSemesterSettings(next);
  return NextResponse.json(next);
}
