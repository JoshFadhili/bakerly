// Recipe Ingredient - represents a baking supply used in a recipe
export interface RecipeIngredient {
  bakingSupplyId: string;        // Reference to the baking supply
  bakingSupplyName: string;      // Cached name for display
  quantity: number;              // Quantity required per unit of product
  unit: string;                  // Unit of measurement (e.g., kg, g, ml, cups)
  unitCost: number;              // Cost per unit at time of recipe creation
  totalCost: number;             // quantity * unitCost
}

// Recipe - represents the ingredients needed to make a product
export interface Recipe {
  id?: string;
  productId: string;             // Reference to the product
  productName: string;           // Cached product name for display
  ingredients: RecipeIngredient[]; // List of baking supplies needed
  totalProductionCost: number;   // Sum of all ingredient costs
  yieldQuantity: number;         // How many units this recipe produces (default: 1)
  yieldUnit: string;             // Unit of the yield (e.g., "pieces", "cakes", "dozens")
  notes?: string;                // Additional notes or instructions
  createdAt: Date;
  updatedAt?: Date;
}

// Recipe Usage Log - tracks when baking supplies are deducted
export interface RecipeUsageLog {
  id?: string;
  recipeId: string;
  productId: string;
  productName: string;
  finishedProductBatchId: string;  // Reference to the finished product batch
  quantityProduced: number;        // How many units were produced
  ingredientsUsed: {
    bakingSupplyId: string;
    bakingSupplyName: string;
    quantityUsed: number;
    unit: string;
    costAtTime: number;
  }[];
  totalCostDeducted: number;
  createdAt: Date;
  createdBy?: string;              // User who created the finished product
}
