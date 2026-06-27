import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllExpenses, sumExpenses } from "@/lib/expenses";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await getAllExpenses();
  return NextResponse.json({
    expenses,
    total: sumExpenses(expenses),
  });
}
