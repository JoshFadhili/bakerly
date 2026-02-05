export interface Sale {
  id?: string;
  date: Date;
  itemName: string; // Product name selected from products database
  items: number; // Total number of items being sold
  totalAmount: number;
  payment: "Cash" | "M-Pesa" | "Card" | "Bank Transfer";
  status: "completed" | "pending" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
}
