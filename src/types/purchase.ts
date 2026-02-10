export interface Purchase {
  id?: string;
  date: Date;
  itemName: string; // Product name being purchased
  supplier: string; // Supplier name
  items: number; // Total number of items being purchased
  itemPrice: number; // Individual item price (can vary by supplier/time)
  totalCost: number; // Auto-calculated (items × itemPrice) but adjustable
  status: "received" | "pending" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
}
