export interface Product {
  id?: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  status: "active" | "low_stock"
  createdAt: Date
}
