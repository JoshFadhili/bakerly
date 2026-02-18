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

// 🔐 Verify user password before allowing admin actions
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    if (!auth.currentUser?.email) {
      throw new Error("No authenticated user found");
    }

    // Check if the authenticated user is the admin (smwaindirangu76@gmail.com)
    if (auth.currentUser.email !== "smwaindirangu76@gmail.com") {
      throw new Error("You are not authorized to perform admin actions");
    }

    // Reauthenticate with the provided password
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    return true;
  } catch (error) {
    console.error("Password verification failed:", error);
    throw new Error("Invalid password or unauthorized access");
  }
};

// 🗑️ Delete all documents from a collection
const deleteAllFromCollection = async (collectionName: string): Promise<number> => {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
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

// 🗑️ Delete all sales
export const deleteAllSales = async () => {
  return deleteAllFromCollection("sales");
};

// 🗑️ Delete all services offered
export const deleteAllServicesOffered = async () => {
  return deleteAllFromCollection("servicesOffered");
};

// 🗑️ Delete all products
export const deleteAllProducts = async () => {
  return deleteAllFromCollection("products");
};

// 🗑️ Delete all services
export const deleteAllServices = async () => {
  return deleteAllFromCollection("services");
};

// 🗑️ Delete all inventory records
export const deleteAllInventory = async () => {
  return deleteAllFromCollection("inventory");
};

// 🗑️ Delete all purchase orders
export const deleteAllPurchases = async () => {
  return deleteAllFromCollection("purchases");
};

// 🗑️ Delete all batches
export const deleteAllBatches = async () => {
  return deleteAllFromCollection("inventoryBatches");
};

// 🗑️ Delete all stock adjustments
export const deleteAllStockAdjustments = async () => {
  return deleteAllFromCollection("stockAdjustments");
};

// 🗑️ Delete all expenses
export const deleteAllExpenses = async () => {
  return deleteAllFromCollection("expenses");
};

// 🗑️ Hide depleted batches (batches with 0 remaining items) from batch details view
// This preserves purchase records while hiding them from the batch details tab
export const deleteDepletedBatches = async (): Promise<number> => {
  try {
    const batchesRef = collection(db, "purchases");
    const q = query(batchesRef, where("itemsRemaining", "==", 0));
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

// 🗑️ Delete all data from the system
// This function deletes all records from all collections
export const deleteAll = async (): Promise<{ [key: string]: number }> => {
  const results: { [key: string]: number } = {};
  
  try {
    // Delete all collections in parallel
    const [salesCount, servicesOfferedCount, productsCount, servicesCount, inventoryCount, purchasesCount, batchesCount, stockAdjustmentsCount, expensesCount] = await Promise.all([
      deleteAllSales().catch(e => { console.error("Error deleting sales:", e); return 0; }),
      deleteAllServicesOffered().catch(e => { console.error("Error deleting services offered:", e); return 0; }),
      deleteAllProducts().catch(e => { console.error("Error deleting products:", e); return 0; }),
      deleteAllServices().catch(e => { console.error("Error deleting services:", e); return 0; }),
      deleteAllInventory().catch(e => { console.error("Error deleting inventory:", e); return 0; }),
      deleteAllPurchases().catch(e => { console.error("Error deleting purchases:", e); return 0; }),
      deleteAllBatches().catch(e => { console.error("Error deleting batches:", e); return 0; }),
      deleteAllStockAdjustments().catch(e => { console.error("Error deleting stock adjustments:", e); return 0; }),
      deleteAllExpenses().catch(e => { console.error("Error deleting expenses:", e); return 0; }),
    ]);
    
    results.sales = salesCount;
    results.servicesOffered = servicesOfferedCount;
    results.products = productsCount;
    results.services = servicesCount;
    results.inventory = inventoryCount;
    results.purchases = purchasesCount;
    results.batches = batchesCount;
    results.stockAdjustments = stockAdjustmentsCount;
    results.expenses = expensesCount;
    
    return results;
  } catch (error) {
    console.error("Error deleting all data:", error);
    throw new Error("Failed to delete all data");
  }
};
