import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Purchase } from "../types/purchase";
import { deleteDoc } from "firebase/firestore";

// 🔗 Collection reference
const purchasesRef = collection(db, "purchases");

// 🎯 Generate unique batch ID
export const generateBatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BATCH-${timestamp}-${random}`.toUpperCase();
};

// ➕ ADD PURCHASE
export const addPurchase = async (purchase: Purchase) => {
  try {
    await addDoc(purchasesRef, {
      ...purchase,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding purchase:", error);
    throw new Error("Failed to add purchase. Please try again.");
  }
};

// 📥 GET PURCHASES
export const getPurchases = async (): Promise<Purchase[]> => {
  try {
    const q = query(purchasesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        // Convert Firebase Timestamp to JavaScript Date
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw new Error("Failed to fetch purchases. Please try again.");
  }
};

// ✏️ UPDATE PURCHASE
export const updatePurchase = async (
  id: string,
  data: Partial<Purchase>
) => {
  try {
    const purchaseRef = doc(db, "purchases", id);

    await updateDoc(purchaseRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    throw new Error("Failed to update purchase. Please try again.");
  }
};

// 🗑️ DELETE PURCHASE
export const deletePurchase = async (id: string) => {
  try {
    const purchaseRef = doc(db, "purchases", id);
    await deleteDoc(purchaseRef);
  } catch (error) {
    console.error("Error deleting purchase:", error);
    throw new Error("Failed to delete purchase. Please try again.");
  }
};

// 🔍 SEARCH PURCHASES BY ITEM NAME
export const searchPurchasesByItemName = async (itemName: string): Promise<Purchase[]> => {
  try {
    const q = query(
      purchasesRef,
      where("itemName", ">=", itemName),
      where("itemName", "<=", itemName + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error searching purchases:", error);
    throw new Error("Failed to search purchases. Please try again.");
  }
};

// 🔍 SEARCH PURCHASES BY SUPPLIER
export const searchPurchasesBySupplier = async (supplier: string): Promise<Purchase[]> => {
  try {
    const q = query(
      purchasesRef,
      where("supplier", ">=", supplier),
      where("supplier", "<=", supplier + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error searching purchases:", error);
    throw new Error("Failed to search purchases. Please try again.");
  }
};

// 🔍 FILTER PURCHASES BY STATUS
export const filterPurchasesByStatus = async (status: string): Promise<Purchase[]> => {
  try {
    const q = query(
      purchasesRef,
      where("status", "==", status),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error filtering purchases:", error);
    throw new Error("Failed to filter purchases. Please try again.");
  }
};

// 🔍 FILTER PURCHASES BY DATE RANGE
export const filterPurchasesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Purchase[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      purchasesRef,
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error filtering purchases:", error);
    throw new Error("Failed to filter purchases. Please try again.");
  }
};

// 🔍 FILTER PURCHASES BY COST RANGE
export const filterPurchasesByCostRange = async (
  minCost: number,
  maxCost: number
): Promise<Purchase[]> => {
  try {
    const q = query(
      purchasesRef,
      where("totalCost", ">=", minCost),
      where("totalCost", "<=", maxCost),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });
  } catch (error) {
    console.error("Error filtering purchases:", error);
    throw new Error("Failed to filter purchases. Please try again.");
  }
};

// 📦 GET PURCHASES BY PRODUCT NAME (for FIFO tracking)
export const getPurchasesByProductName = async (itemName: string): Promise<Purchase[]> => {
  try {
    // Query all received purchases first, then filter by product name
    // This avoids the need for a composite Firestore index
    const q = query(
      purchasesRef,
      where("status", "==", "received")
    );
    const snapshot = await getDocs(q);

    // Map and filter results
    const results = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });

    // Filter for exact match (case-insensitive and trimmed)
    const filtered = results.filter(purchase =>
      purchase.itemName?.trim().toLowerCase() === itemName.trim().toLowerCase()
    );

    // Sort by date ascending (oldest first for FIFO)
    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching purchases by product name:", error);
    throw new Error("Failed to fetch purchases by product name. Please try again.");
  }
};

// 📦 GET BATCHES BY PRODUCT NAME (for inventory batch details)
export const getBatchesByProductName = async (itemName: string): Promise<Purchase[]> => {
  try {
    // Query all received purchases first, then filter by product name
    const q = query(
      purchasesRef,
      where("status", "==", "received")
    );
    const snapshot = await getDocs(q);

    // Map and filter results
    const results = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Purchase, "id">;
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
        depletedAt: data.depletedAt instanceof Timestamp
          ? data.depletedAt.toDate()
          : data.depletedAt,
      };
    });

    // Filter for exact match (case-insensitive and trimmed)
    const filtered = results.filter(purchase => 
      purchase.itemName?.trim().toLowerCase() === itemName.trim().toLowerCase()
    );

    // Filter out depleted batches older than 168 hours (1 week)
    const now = Date.now();
    const hoursInMs = 168 * 60 * 60 * 1000; // 168 hours in milliseconds
    const activeBatches = filtered.filter(purchase => {
      const itemsRemaining = purchase.itemsRemaining !== undefined ? purchase.itemsRemaining : purchase.items;
      
      // If batch is not depleted, include it
      if (itemsRemaining > 0) {
        return true;
      }
      
      // If batch is depleted, check if it's older than 168 hours
      if (purchase.depletedAt) {
        const depletedAtTime = purchase.depletedAt instanceof Date 
          ? purchase.depletedAt.getTime() 
          : new Date(purchase.depletedAt).getTime();
        
        // Only include if it's been less than 168 hours since depletion
        return now - depletedAtTime < hoursInMs;
      }
      
      // If depleted but no depletedAt timestamp, exclude it (assume old)
      return false;
    });

    // Sort by date descending (newest first)
    return activeBatches.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching batches by product name:", error);
    throw new Error("Failed to fetch batches by product name. Please try again.");
  }
};

// 🔄 UPDATE BATCH QUANTITY (for FIFO when sales occur)
export const updateBatchQuantity = async (purchaseId: string, quantitySold: number): Promise<void> => {
  try {
    const purchaseRef = doc(db, "purchases", purchaseId);

    // First, get the current purchase to check remaining items
    const purchaseDoc = await getDoc(purchaseRef);

    if (!purchaseDoc.exists()) {
      throw new Error("Purchase not found");
    }

    const currentData = purchaseDoc.data() as Omit<Purchase, "id">;
    const newItemsRemaining = Math.max(0, (currentData.itemsRemaining !== undefined ? currentData.itemsRemaining : currentData.items) - quantitySold);

    // Check if batch is becoming depleted and set depletedAt timestamp
    const updateData: any = {
      itemsRemaining: newItemsRemaining,
      updatedAt: Timestamp.now(),
    };

    // If batch becomes depleted (itemsRemaining goes from >0 to 0), set depletedAt
    const currentItemsRemaining = currentData.itemsRemaining !== undefined ? currentData.itemsRemaining : currentData.items;
    if (currentItemsRemaining > 0 && newItemsRemaining === 0) {
      updateData.depletedAt = Timestamp.now();
    }

    await updateDoc(purchaseRef, updateData);
  } catch (error) {
    console.error("Error updating batch quantity:", error);
    throw new Error("Failed to update batch quantity. Please try again.");
  }
};

// 🔄 RESTORE BATCH QUANTITY (when sale is cancelled or status changes from completed)
export const restoreBatchQuantity = async (purchaseId: string, quantityToRestore: number): Promise<void> => {
  try {
    const purchaseRef = doc(db, "purchases", purchaseId);

    // First, get the current purchase
    const purchaseDoc = await getDoc(purchaseRef);

    if (!purchaseDoc.exists()) {
      throw new Error("Purchase not found");
    }

    const currentData = purchaseDoc.data() as Omit<Purchase, "id">;
    const currentItemsRemaining = currentData.itemsRemaining !== undefined ? currentData.itemsRemaining : currentData.items;
    const totalItems = currentData.items;

    // Calculate new items remaining, but don't exceed the original total
    const newItemsRemaining = Math.min(totalItems, currentItemsRemaining + quantityToRestore);

    await updateDoc(purchaseRef, {
      itemsRemaining: newItemsRemaining,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error restoring batch quantity:", error);
    throw new Error("Failed to restore batch quantity. Please try again.");
  }
};

// 🔄 RESTORE BATCH QUANTITIES FOR A PRODUCT (reverse FIFO - restore to newest batches first)
export const restoreBatchQuantitiesForProduct = async (itemName: string, quantityToRestore: number): Promise<number> => {
  try {
    // Get all received purchases for this product, ordered by date (newest first for reverse FIFO)
    const purchases = await getPurchasesByProductName(itemName);
    
    // Reverse to get newest first for restoration
    const newestFirst = [...purchases].reverse();
    
    let remainingQuantity = quantityToRestore;
    let totalRestored = 0;
    
    for (const purchase of newestFirst) {
      if (remainingQuantity <= 0) break;
      
      const currentItemsRemaining = purchase.itemsRemaining !== undefined ? purchase.itemsRemaining : purchase.items;
      const totalItems = purchase.items;
      const availableSpace = totalItems - currentItemsRemaining;
      
      if (availableSpace > 0) {
        // Calculate how much to restore to this batch
        const restoreAmount = Math.min(remainingQuantity, availableSpace);
        
        // Update the batch quantity
        await restoreBatchQuantity(purchase.id!, restoreAmount);
        
        totalRestored += restoreAmount;
        remainingQuantity -= restoreAmount;
      }
    }
    
    if (remainingQuantity > 0) {
      console.warn(`Warning: Could not restore all ${remainingQuantity} items for ${itemName}. Batches may have been modified or deleted.`);
    }
    
    return totalRestored;
  } catch (error) {
    console.error("Error restoring batch quantities for product:", error);
    throw new Error("Failed to restore batch quantities. Please try again.");
  }
};

// 🗑️ DELETE DEPLETED BATCHES OLDER THAN 168 HOURS (1 week)
export const deleteOldDepletedBatches = async (): Promise<{ deleted: number; skipped: number }> => {
  try {
    const q = query(purchasesRef, where("status", "==", "received"));
    const snapshot = await getDocs(q);

    let deleted = 0;
    let skipped = 0;
    const now = Date.now();
    const hoursInMs = 168 * 60 * 60 * 1000; // 168 hours in milliseconds

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const itemsRemaining = data.itemsRemaining !== undefined ? data.itemsRemaining : data.items;
      const depletedAt = data.depletedAt;

      // Only process depleted batches (itemsRemaining === 0)
      if (itemsRemaining === 0 && depletedAt) {
        // Convert depletedAt to timestamp
        const depletedAtTime = depletedAt instanceof Timestamp 
          ? depletedAt.toDate().getTime() 
          : new Date(depletedAt).getTime();

        // Check if batch is older than 168 hours
        if (now - depletedAtTime > hoursInMs) {
          await deleteDoc(doc(db, "purchases", docSnap.id));
          deleted++;
          console.log(`Deleted depleted batch ${data.batchId} from ${data.itemName}`);
        } else {
          skipped++;
        }
      }
    }

    return { deleted, skipped };
  } catch (error) {
    console.error("Error deleting old depleted batches:", error);
    throw new Error("Failed to delete old depleted batches. Please try again.");
  }
};
