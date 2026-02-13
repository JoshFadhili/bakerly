export interface Product {
  id?: string;
  name: string;
  category: string;
  salePrice: number;
  status: "active" | "low_stock";
  createdAt: Date;
  updatedAt?: Date;
}
