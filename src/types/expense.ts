export type ExpenseType = "operational" | "service";

export interface Expense {
  id?: string;
  date: Date;
  time: string;
  description: string;
  category: string;
  amount: number;
  expenseType: ExpenseType;
  createdAt: Date;
  updatedAt?: Date;
}
