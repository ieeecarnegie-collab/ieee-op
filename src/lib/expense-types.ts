export type ExpenseRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  committeeId: string;
  committeeName: string;
  committeeSlug: string;
  amount: number;
  notes: string | null;
  loggedById: string;
  loggedByName: string;
  createdAt: string | null;
};

export function formatExpenseAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function sumExpenses(expenses: ExpenseRecord[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}
