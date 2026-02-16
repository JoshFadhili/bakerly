export interface Sale {
  id?: string;
  date: Date;
  time: string; // Time of sale in HH:MM format
  itemName: string; // Product name selected from products database
  items: number; // Total number of items being sold
  totalAmount: number;
  payment: "Cash" | "M-Pesa" | "Card" | "Bank Transfer";
  status: "completed" | "pending" | "cancelled";
  customer?: string; // Optional customer name
  createdAt: Date;
  updatedAt?: Date;
  cogs?: number; // Cost of Goods Sold (optional, calculated)
  grossProfit?: number; // Gross Profit (optional, calculated)
}
