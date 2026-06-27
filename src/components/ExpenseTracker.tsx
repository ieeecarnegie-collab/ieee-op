"use client";

import Link from "next/link";
import { format } from "date-fns";
import { formatExpenseAmount, type ExpenseRecord } from "@/lib/expense-types";

type Props = {
  expenses: ExpenseRecord[];
  total: number;
};

export function ExpenseTracker({ expenses, total }: Props) {
  return (
    <section className="mt-6 rounded border border-slate-200 bg-white p-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Event expense tracker</h2>
          <p className="mt-1 text-sm text-slate-600">
            Expenses logged by committee members from event pages.
          </p>
        </div>
        <p className="text-lg font-semibold text-slate-900">
          Total: {formatExpenseAmount(total)}
        </p>
      </div>

      {expenses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No expenses logged yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Committee</th>
                <th className="px-2 py-2 font-medium">Event</th>
                <th className="px-2 py-2 font-medium">Logged by</th>
                <th className="px-2 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-600">
                    {expense.createdAt
                      ? format(new Date(expense.createdAt), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-2 py-2 capitalize">{expense.committeeName}</td>
                  <td className="px-2 py-2">
                    <Link
                      href={`/events/${expense.eventId}`}
                      className="text-[#00629B] hover:underline"
                    >
                      {expense.eventTitle}
                    </Link>
                    {expense.notes && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {expense.notes}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {expense.loggedByName}
                  </td>
                  <td className="px-2 py-2 text-right font-medium">
                    {formatExpenseAmount(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
