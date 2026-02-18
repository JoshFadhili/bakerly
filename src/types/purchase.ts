export interface Purchase {
  id?: string;
  batchId: string; // Unique batch identifier for FIFO tracking
  date: Date;
  time: string; // Time of purchase in HH:MM format
  itemName: string; // Product name being purchased
  supplier: string; // Supplier name
  items: number; // Total number of items being purchased
  itemsRemaining: number; // Items remaining in this batch after sales
  itemPrice: number; // Individual item price (can vary by supplier/time)
  totalCost: number; // Auto-calculated (items × itemPrice) but adjustable
  status: "received" | "pending" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
  depletedAt?: Date; // Timestamp when batch became depleted (itemsRemaining = 0)
  hidden?: boolean; // If true, batch is hidden from batch details view but preserved in database
}
