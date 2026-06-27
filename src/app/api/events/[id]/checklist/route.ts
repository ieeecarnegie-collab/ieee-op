import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { milestoneLabel, itemApplies } from "@/lib/checklist";
import type { ChecklistCondition } from "@/lib/seed-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getEventById(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const applicable = data.checklist.filter((item) =>
    itemApplies(item.condition as ChecklistCondition, data.event),
  );

  const grouped = [14, 7, 3, 0].map((offset) => ({
    offsetDays: offset,
    label: milestoneLabel(offset),
    items: applicable
      .filter((i) => i.offsetDays === offset)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return NextResponse.json({ grouped, all: data.checklist });
}
