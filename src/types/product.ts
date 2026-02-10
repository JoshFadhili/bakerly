export interface Product {
  id?: string;
  name: string;
  category: string;
  salePrice: number;
  stock: number;
  averageCost: number; // Average cost calculated from purchases
  status: "active" | "low_stock";
  createdAt: Date;
  updatedAt?: Date;
}
