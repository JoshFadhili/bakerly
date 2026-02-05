export interface InventoryItem {
  id?: string
  name?: string
  category?: string
  stock?: number
  costPrice?: number
  salePrice?: number
  status?: "active" | "low_stock"
  updatedAt?: Date | any
  createdAt?: Date | any
}

export interface StockAdjustment {
  id?: string
  productId: string
  productName: string
  adjustmentType: "add" | "adjust" | "sale"
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  createdAt?: Date | any
}
