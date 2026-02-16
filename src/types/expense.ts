export interface Expense {
  id?: string;
  date: Date;
  time: string;
  description: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt?: Date;
}
