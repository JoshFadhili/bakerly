import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";

// Get current user's UID
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user found");
  }
  return auth.currentUser.uid;
};

// 🔐 Verify user password before allowing admin actions
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    // Any authenticated user can manage their own data
    // No longer restricted to specific email addresses
    
    // Reauthenticate with the provided password
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email!,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    return true;
  } catch (error) {
    console.error("Password verification failed:", error);
    throw new Error("Invalid password or unauthorized access");
  }
};

// 🗑️ Delete documents from a collection where ownerId matches current user
const deleteFromCollection = async (collectionName: string): Promise<number> => {
  try {
    const userId = getCurrentUserId();
    const collectionRef = collection(db, collectionName);
    
    // Only query documents that belong to the current user
    const q = query(collectionRef, where("ownerId", "==", userId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, collectionName, docSnap.id))
    );
    
    await Promise.all(deletePromises);
    return snapshot.size;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    throw new Error(`Failed to delete ${collectionName}`);
  }
};

// 🗑️ Delete all sales (user's own only)
export const deleteAllSales = async () => {
  return deleteFromCollection("sales");
};

// 🗑️ Delete all services offered (user's own only)
export const deleteAllServicesOffered = async () => {
  return deleteFromCollection("servicesOffered");
};

// 🗑️ Delete all products (user's own only)
export const deleteAllProducts = async () => {
  return deleteFromCollection("products");
};

// 🗑️ Delete all services (user's own only)
export const deleteAllServices = async () => {
  return deleteFromCollection("services");
};

// 🗑️ Delete all inventory records (user's own only)
export const deleteAllInventory = async () => {
  return deleteFromCollection("inventory");
};

// 🗑️ Delete all purchase orders (user's own only)
export const deleteAllPurchases = async () => {
  return deleteFromCollection("purchases");
};

// 🗑️ Delete all batches (user's own only)
export const deleteAllBatches = async () => {
  return deleteFromCollection("inventoryBatches");
};

// 🗑️ Delete all stock adjustments (user's own only)
export const deleteAllStockAdjustments = async () => {
  return deleteFromCollection("stockAdjustments");
};

// 🗑️ Delete all expenses (user's own only)
export const deleteAllExpenses = async () => {
  return deleteFromCollection("expenses");
};

// 🗑️ Delete all baking supplies (user's own only)
export const deleteAllBakingSupplies = async () => {
  return deleteFromCollection("bakingSupplies");
};

// 🗑️ Delete all baking supply purchases (user's own only)
export const deleteAllBakingSupplyPurchases = async () => {
  return deleteFromCollection("bakingSupplyPurchases");
};

// 🗑️ Delete all categories (user's own only)
export const deleteAllCategories = async () => {
  return deleteFromCollection("categories");
};

// 🗑️ Delete all recipes (user's own only)
export const deleteAllRecipes = async () => {
  return deleteFromCollection("recipes");
};

// 🗑️ Delete all recipe usage logs (user's own only)
export const deleteAllRecipeUsageLogs = async () => {
  return deleteFromCollection("recipeUsageLogs");
};

// 🗑️ Delete all settings (user's own only)
export const deleteAllSettings = async () => {
  return deleteFromCollection("settings");
};

// 🗑️ Delete all notifications (user's own only)
export const deleteAllNotifications = async () => {
  return deleteFromCollection("notifications");
};

// 🗑️ Hide depleted batches (user's own only)
export const deleteDepletedBatches = async (): Promise<number> => {
  try {
    const userId = getCurrentUserId();
    const batchesRef = collection(db, "purchases");
    
    // Only query batches that belong to the current user and have 0 remaining
    const q = query(
      batchesRef, 
      where("ownerId", "==", userId),
      where("itemsRemaining", "==", 0)
    );
    const snapshot = await getDocs(q);
    
    const hidePromises = snapshot.docs.map((docSnap) =>
      updateDoc(doc(db, "purchases", docSnap.id), { hidden: true })
    );
    
    await Promise.all(hidePromises);
    return snapshot.size;
  } catch (error) {
    console.error("Error hiding depleted batches:", error);
    throw new Error("Failed to hide depleted batches");
  }
};

// 🗑️ Delete all data from the system (user's own data only)
export const deleteAllFinishedProducts = async () => {
  return deleteFromCollection("purchases");
};

export const deleteAll = async (): Promise<{ [key: string]: number }> => {
  const results: { [key: string]: number } = {};
  
  try {
    // Delete all collections in parallel (user's own data only)
    const [salesCount, servicesOfferedCount, productsCount, servicesCount, inventoryCount, finishedProductsCount, batchesCount, stockAdjustmentsCount, expensesCount, bakingSuppliesCount, bakingSupplyPurchasesCount, categoriesCount, recipesCount, recipeUsageLogsCount, settingsCount, notificationsCount] = await Promise.all([
      deleteAllSales().catch(e => { console.error("Error deleting sales:", e); return 0; }),
      deleteAllServicesOffered().catch(e => { console.error("Error deleting services offered:", e); return 0; }),
      deleteAllProducts().catch(e => { console.error("Error deleting products:", e); return 0; }),
      deleteAllServices().catch(e => { console.error("Error deleting services:", e); return 0; }),
      deleteAllInventory().catch(e => { console.error("Error deleting inventory:", e); return 0; }),
      deleteAllFinishedProducts().catch(e => { console.error("Error deleting finished products:", e); return 0; }),
      deleteAllBatches().catch(e => { console.error("Error deleting batches:", e); return 0; }),
      deleteAllStockAdjustments().catch(e => { console.error("Error deleting stock adjustments:", e); return 0; }),
      deleteAllExpenses().catch(e => { console.error("Error deleting expenses:", e); return 0; }),
      deleteAllBakingSupplies().catch(e => { console.error("Error deleting baking supplies:", e); return 0; }),
      deleteAllBakingSupplyPurchases().catch(e => { console.error("Error deleting baking supply purchases:", e); return 0; }),
      deleteAllCategories().catch(e => { console.error("Error deleting categories:", e); return 0; }),
      deleteAllRecipes().catch(e => { console.error("Error deleting recipes:", e); return 0; }),
      deleteAllRecipeUsageLogs().catch(e => { console.error("Error deleting recipe usage logs:", e); return 0; }),
      deleteAllSettings().catch(e => { console.error("Error deleting settings:", e); return 0; }),
      deleteAllNotifications().catch(e => { console.error("Error deleting notifications:", e); return 0; }),
    ]);
    
    results.sales = salesCount;
    results.servicesOffered = servicesOfferedCount;
    results.products = productsCount;
    results.services = servicesCount;
    results.inventory = inventoryCount;
    results.finishedProducts = finishedProductsCount;
    results.batches = batchesCount;
    results.stockAdjustments = stockAdjustmentsCount;
    results.expenses = expensesCount;
    results.bakingSupplies = bakingSuppliesCount;
    results.bakingSupplyPurchases = bakingSupplyPurchasesCount;
    results.categories = categoriesCount;
    results.recipes = recipesCount;
    results.recipeUsageLogs = recipeUsageLogsCount;
    results.settings = settingsCount;
    results.notifications = notificationsCount;
    
    return results;
  } catch (error) {
    console.error("Error deleting all data:", error);
    throw new Error("Failed to delete all data");
  }
};
