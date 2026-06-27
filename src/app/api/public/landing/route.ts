import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { committees } from "@/lib/db/schema";

export async function GET() {
  const all = await db
    .select({ slug: committees.slug, name: committees.name })
    .from(committees)
    .orderBy(committees.sortOrder);

  return NextResponse.json({
    mission:
      "We connect ECE students through events, mentorship, and industry partnerships. Membership is open to anyone at CMU.",
    committees: all.map((c) => c.name),
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ieee@andrew.cmu.edu",
  });
}
