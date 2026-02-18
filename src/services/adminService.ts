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
