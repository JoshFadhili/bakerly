export interface BakingSupplyPurchase {
  id?: string;
  batchId: string; // Unique batch identifier for FIFO tracking
  date: Date;
  time: string; // Time of purchase in HH:MM format
  supplyName: string; // Baking supply name being purchased
  category: string; // Category of baking supply
  supplier: string; // Supplier name
  quantity: number; // Total quantity being purchased
  quantityRemaining: number; // Quantity remaining in this batch after sales/usage
  unit: string; // Measurement type (e.g., kg, Litres, grams, ml)
  unitPrice: number; // Price per unit
  totalCost: number; // Auto-calculated (quantity × unitPrice) but adjustable
  purpose: "resale" | "production" | "both"; // How the supply will be used
  status: "received" | "pending" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
  depletedAt?: Date; // Timestamp when batch became depleted (quantityRemaining = 0)
  hidden?: boolean; // If true, batch is hidden from batch details view but preserved in database
}
