import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Recipe, RecipeIngredient, RecipeUsageLog } from "../types/recipe";
import { BakingSupply } from "../types/bakingSupply";
import {
  getBakingSupplyPurchasesBySupplyName,
  updateBakingSupplyBatchQuantity,
} from "./bakingSupplyPurchaseService";
import { BakingSupplyPurchase } from "../types/bakingSupplyPurchase";

// Collection references
const recipesRef = collection(db, "recipes");
const recipeUsageLogsRef = collection(db, "recipeUsageLogs");
const bakingSuppliesRef = collection(db, "bakingSupplies");

// Add a new recipe
export const addRecipe = async (recipe: Omit<Recipe, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(recipesRef, {
      ...recipe,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding recipe:", error);
    throw new Error("Failed to add recipe. Please try again.");
  }
};

// Get all recipes
export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const snapshot = await getDocs(recipesRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
      } as Recipe;
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes. Please try again.");
  }
};

// Get a single recipe by ID
export const getRecipe = async (id: string): Promise<Recipe | null> => {
  try {
    const docSnap = await getDoc(doc(db, "recipes", id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as Recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw new Error("Failed to fetch recipe. Please try again.");
  }
};

// Get recipe by product ID
export const getRecipeByProductId = async (productId: string): Promise<Recipe | null> => {
  try {
    const q = query(recipesRef, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as Recipe;
  } catch (error) {
    console.error("Error fetching recipe by product:", error);
    throw new Error("Failed to fetch recipe. Please try again.");
  }
};

// Update a recipe
export const updateRecipe = async (id: string, data: Partial<Recipe>): Promise<void> => {
  try {
    const recipeRef = doc(db, "recipes", id);
    await updateDoc(recipeRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw new Error("Failed to update recipe. Please try again.");
  }
};

// Delete a recipe
export const deleteRecipe = async (id: string): Promise<void> => {
  try {
    const recipeRef = doc(db, "recipes", id);
    await deleteDoc(recipeRef);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw new Error("Failed to delete recipe. Please try again.");
  }
};

// Deduct baking supplies when creating a finished product using FIFO batch system
export const deductBakingSuppliesForProduction = async (
  recipe: Recipe,
  quantityProduced: number,
  finishedProductBatchId: string,
  userId?: string
): Promise<{ success: boolean; deductedIngredients: RecipeIngredient[]; totalCost: number; errors?: string[] }> => {
  try {
    const errors: string[] = [];
    let deductedIngredients: RecipeIngredient[] = [];
    let totalCost = 0;

    // Calculate the multiplier based on yield quantity
    const multiplier = quantityProduced / recipe.yieldQuantity;

    // First, check ALL ingredients for availability before making any deductions
    const ingredientStockChecks: { ingredient: RecipeIngredient; batches: BakingSupplyPurchase[]; totalAvailable: number; quantityToDeduct: number }[] = [];

    console.log("[deductBakingSuppliesForProduction] Starting deduction for recipe:", recipe.productName, "with", recipe.ingredients.length, "ingredients");
    console.log("[deductBakingSuppliesForProduction] quantityProduced:", quantityProduced, "yieldQuantity:", recipe.yieldQuantity, "multiplier:", quantityProduced / recipe.yieldQuantity);

    for (const ingredient of recipe.ingredients) {
      const quantityToDeduct = ingredient.quantity * multiplier;

      // Validate ingredient has a baking supply name
      if (!ingredient.bakingSupplyName || ingredient.bakingSupplyName.trim() === "") {
        console.error("[deductBakingSuppliesForProduction] Ingredient missing bakingSupplyName:", ingredient);
        errors.push(`Ingredient is missing a baking supply name. Please check the recipe.`);
        continue;
      }

      console.log("[deductBakingSuppliesForProduction] Checking ingredient:", ingredient.bakingSupplyName, "quantityToDeduct:", quantityToDeduct);

      // Get all batches for this supply (sorted by date ascending for FIFO)
      const batches = await getBakingSupplyPurchasesBySupplyName(ingredient.bakingSupplyName);
      console.log("[deductBakingSuppliesForProduction] Found batches for", ingredient.bakingSupplyName, ":", batches.length);

      // Calculate total available quantity
      const totalAvailable = batches.reduce((sum, batch) => {
        return sum + (batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity);
      }, 0);
      console.log("[deductBakingSuppliesForProduction] Total available for", ingredient.bakingSupplyName, ":", totalAvailable);

      if (totalAvailable < quantityToDeduct) {
        errors.push(
          `Insufficient stock for "${ingredient.bakingSupplyName}". Required: ${quantityToDeduct.toFixed(2)} ${ingredient.unit}, Available: ${totalAvailable.toFixed(2)} ${ingredient.unit}`
        );
      } else {
        ingredientStockChecks.push({ ingredient, batches, totalAvailable, quantityToDeduct });
      }
    }

    // If there are any errors, don't proceed with deductions
    if (errors.length > 0) {
      console.log("[deductBakingSuppliesForProduction] Stock check failed with errors:", errors);
      return { success: false, deductedIngredients: [], totalCost: 0, errors };
    }

    console.log("[deductBakingSuppliesForProduction] Stock check passed, proceeding with transaction...");

    // Use a Firestore transaction to ensure atomicity of all batch updates
    await runTransaction(db, async (transaction) => {
      const transactionDeductedIngredients: RecipeIngredient[] = [];
      let transactionTotalCost = 0;

      // Process each ingredient within the transaction
      for (const { ingredient, batches, quantityToDeduct } of ingredientStockChecks) {
        // Re-check availability within transaction to ensure consistency
        let remainingToDeduct = quantityToDeduct;
        let ingredientCost = 0;

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          // Get the batch document within the transaction
          const batchRef = doc(db, "bakingSupplyPurchases", batch.id!);
          const batchDoc = await transaction.get(batchRef);

          if (!batchDoc.exists()) {
            throw new Error(`Batch ${batch.batchId} not found`);
          }

          const batchData = batchDoc.data();
          const batchRemaining = batchData.quantityRemaining !== undefined ? batchData.quantityRemaining : batchData.quantity;

          if (batchRemaining > 0) {
            const deductFromThisBatch = Math.min(remainingToDeduct, batchRemaining);
            const newQuantityRemaining = Math.max(0, batchRemaining - deductFromThisBatch);

            // Update the batch within the transaction
            const updateData: any = {
              quantityRemaining: newQuantityRemaining,
              updatedAt: Timestamp.now(),
            };

            // If batch becomes depleted, set depletedAt
            if (batchRemaining > 0 && newQuantityRemaining === 0) {
              updateData.depletedAt = Timestamp.now();
            }

            transaction.update(batchRef, updateData);

            // Track the cost using the batch's actual unit price
            ingredientCost += deductFromThisBatch * batchData.unitPrice;

            remainingToDeduct -= deductFromThisBatch;
          }
        }

        // Verify all quantity was deducted
        if (remainingToDeduct > 0) {
          throw new Error(`Insufficient stock for ${ingredient.bakingSupplyName} during transaction`);
        }

        // Track the deducted ingredient with actual cost from batches
        transactionDeductedIngredients.push({
          ...ingredient,
          quantity: quantityToDeduct,
          totalCost: ingredientCost,
          unitCost: quantityToDeduct > 0 ? ingredientCost / quantityToDeduct : 0, // Update unit cost to actual average from batches
        });

        transactionTotalCost += ingredientCost;
      }

      // Create a usage log within the transaction
      const usageLogData: any = {
        recipeId: recipe.id!,
        productId: recipe.productId,
        productName: recipe.productName,
        finishedProductBatchId,
        quantityProduced,
        ingredientsUsed: transactionDeductedIngredients.map(ing => ({
          bakingSupplyId: ing.bakingSupplyId,
          bakingSupplyName: ing.bakingSupplyName,
          quantityUsed: ing.quantity,
          unit: ing.unit,
          costAtTime: ing.unitCost,
        })),
        totalCostDeducted: transactionTotalCost,
        createdAt: Timestamp.now(),
      };

      // Only include createdBy if it's defined
      if (userId) {
        usageLogData.createdBy = userId;
      }

      const usageLogRef = doc(collection(db, "recipeUsageLogs"));
      transaction.set(usageLogRef, usageLogData);

      // Set the values to return
      deductedIngredients = transactionDeductedIngredients;
      totalCost = transactionTotalCost;
      console.log("[deductBakingSuppliesForProduction] Transaction completed successfully. Deducted:", transactionDeductedIngredients.length, "ingredients, total cost:", transactionTotalCost);
    });

    return { success: true, deductedIngredients, totalCost };
  } catch (error) {
    console.error("[deductBakingSuppliesForProduction] Error:", error);
    // If it's a known error with specific messages, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to deduct baking supplies. Please try again.");
  }
};

// Get usage logs for a recipe
export const getRecipeUsageLogs = async (recipeId: string): Promise<RecipeUsageLog[]> => {
  try {
    const q = query(recipeUsageLogsRef, where("recipeId", "==", recipeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      } as RecipeUsageLog;
    });
  } catch (error) {
    console.error("Error fetching recipe usage logs:", error);
    throw new Error("Failed to fetch usage logs. Please try again.");
  }
};

// Get all usage logs
export const getAllUsageLogs = async (): Promise<RecipeUsageLog[]> => {
  try {
    const snapshot = await getDocs(recipeUsageLogsRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      } as RecipeUsageLog;
    });
  } catch (error) {
    console.error("Error fetching usage logs:", error);
    throw new Error("Failed to fetch usage logs. Please try again.");
  }
};

// Calculate production cost for a recipe
export const calculateProductionCost = (ingredients: RecipeIngredient[]): number => {
  return ingredients.reduce((total, ingredient) => {
    return total + (ingredient.quantity * ingredient.unitCost);
  }, 0);
};

// Check if there's enough stock for production
export const checkStockForProduction = async (
  recipe: Recipe,
  quantityToProduce: number
): Promise<{ canProduce: boolean; insufficientSupplies: { name: string; required: number; available: number; unit: string }[] }> => {
  try {
    const insufficientSupplies: { name: string; required: number; available: number; unit: string }[] = [];
    const multiplier = quantityToProduce / recipe.yieldQuantity;

    // Use batch-based inventory system instead of bakingSupplies collection
    for (const ingredient of recipe.ingredients) {
      const requiredQuantity = ingredient.quantity * multiplier;

      // Get all batches for this supply and calculate total remaining quantity
      const batches = await getBakingSupplyPurchasesBySupplyName(ingredient.bakingSupplyName);
      const availableQuantity = batches.reduce((sum, batch) => {
        return sum + (batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity);
      }, 0);

      if (availableQuantity < requiredQuantity) {
        insufficientSupplies.push({
          name: ingredient.bakingSupplyName,
          required: requiredQuantity,
          available: availableQuantity,
          unit: ingredient.unit,
        });
      }
    }

    return {
      canProduce: insufficientSupplies.length === 0,
      insufficientSupplies,
    };
  } catch (error) {
    console.error("Error checking stock for production:", error);
    throw new Error("Failed to check stock availability. Please try again.");
  }
};