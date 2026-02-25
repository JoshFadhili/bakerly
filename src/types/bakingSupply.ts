export interface BakingSupply {
  id?: string;
  name: string;
  category: string;
  salePrice: number;
  quantity: number;
  unit: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  createdAt: Date;
  updatedAt?: Date;
}
