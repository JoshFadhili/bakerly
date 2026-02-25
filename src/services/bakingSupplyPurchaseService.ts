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
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { BakingSupplyPurchase } from "../types/bakingSupplyPurchase";

// 🔗 Collection reference
const bakingSupplyPurchasesRef = collection(db, "bakingSupplyPurchases");

// 🎯 Generate unique batch ID
export const generateBakingSupplyBatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BS-BATCH-${timestamp}-${random}`.toUpperCase();
};

// ➕ ADD BAKING SUPPLY PURCHASE
export const addBakingSupplyPurchase = async (purchase: BakingSupplyPurchase) => {
  try {
    await addDoc(bakingSupplyPurchasesRef, {
      ...purchase,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding baking supply purchase:", error);
    throw new Error("Failed to add baking supply purchase. Please try again.");
  }
};

// 📥 GET BAKING SUPPLY PURCHASES
export const getBakingSupplyPurchases = async (): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(bakingSupplyPurchasesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error fetching baking supply purchases:", error);
    throw new Error("Failed to fetch baking supply purchases. Please try again.");
  }
};

// ✏️ UPDATE BAKING SUPPLY PURCHASE
export const updateBakingSupplyPurchase = async (
  id: string,
  data: Partial<BakingSupplyPurchase>
) => {
  try {
    const purchaseRef = doc(db, "bakingSupplyPurchases", id);

    await updateDoc(purchaseRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating baking supply purchase:", error);
    throw new Error("Failed to update baking supply purchase. Please try again.");
  }
};

// 🗑️ DELETE BAKING SUPPLY PURCHASE
export const deleteBakingSupplyPurchase = async (id: string) => {
  try {
    const purchaseRef = doc(db, "bakingSupplyPurchases", id);
    await deleteDoc(purchaseRef);
  } catch (error) {
    console.error("Error deleting baking supply purchase:", error);
    throw new Error("Failed to delete baking supply purchase. Please try again.");
  }
};

// 🔍 SEARCH BAKING SUPPLY PURCHASES BY SUPPLY NAME
export const searchBakingSupplyPurchasesByName = async (supplyName: string): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(
      bakingSupplyPurchasesRef,
      where("supplyName", ">=", supplyName),
      where("supplyName", "<=", supplyName + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error searching baking supply purchases:", error);
    throw new Error("Failed to search baking supply purchases. Please try again.");
  }
};

// 🔍 SEARCH BAKING SUPPLY PURCHASES BY SUPPLIER
export const searchBakingSupplyPurchasesBySupplier = async (supplier: string): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(
      bakingSupplyPurchasesRef,
      where("supplier", ">=", supplier),
      where("supplier", "<=", supplier + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error searching baking supply purchases:", error);
    throw new Error("Failed to search baking supply purchases. Please try again.");
  }
};

// 🔍 FILTER BAKING SUPPLY PURCHASES BY STATUS
export const filterBakingSupplyPurchasesByStatus = async (status: string): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(
      bakingSupplyPurchasesRef,
      where("status", "==", status),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error filtering baking supply purchases:", error);
    throw new Error("Failed to filter baking supply purchases. Please try again.");
  }
};

// 🔍 FILTER BAKING SUPPLY PURCHASES BY PURPOSE
export const filterBakingSupplyPurchasesByPurpose = async (purpose: string): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(
      bakingSupplyPurchasesRef,
      where("purpose", "==", purpose),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error filtering baking supply purchases by purpose:", error);
    throw new Error("Failed to filter baking supply purchases. Please try again.");
  }
};

// 🔍 FILTER BAKING SUPPLY PURCHASES BY DATE RANGE
export const filterBakingSupplyPurchasesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<BakingSupplyPurchase[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      bakingSupplyPurchasesRef,
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error filtering baking supply purchases:", error);
    throw new Error("Failed to filter baking supply purchases. Please try again.");
  }
};

// 🔍 FILTER BAKING SUPPLY PURCHASES BY COST RANGE
export const filterBakingSupplyPurchasesByCostRange = async (
  minCost: number,
  maxCost: number
): Promise<BakingSupplyPurchase[]> => {
  try {
    const q = query(
      bakingSupplyPurchasesRef,
      where("totalCost", ">=", minCost),
      where("totalCost", "<=", maxCost),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
    console.error("Error filtering baking supply purchases:", error);
    throw new Error("Failed to filter baking supply purchases. Please try again.");
  }
};

// 📦 GET BAKING SUPPLY PURCHASES BY SUPPLY NAME (for FIFO tracking)
export const getBakingSupplyPurchasesBySupplyName = async (supplyName: string): Promise<BakingSupplyPurchase[]> => {
  try {
    // Query all received purchases first, then filter by supply name
    // This avoids the need for a composite Firestore index
    const q = query(
      bakingSupplyPurchasesRef,
      where("status", "==", "received")
    );
    const snapshot = await getDocs(q);

    // Map and filter results
    const results = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
      purchase.supplyName?.trim().toLowerCase() === supplyName.trim().toLowerCase()
    );

    // Sort by date ascending (oldest first for FIFO)
    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching baking supply purchases by supply name:", error);
    throw new Error("Failed to fetch baking supply purchases by supply name. Please try again.");
  }
};

// 📦 GET BATCHES BY SUPPLY NAME (for inventory batch details)
export const getBatchesBySupplyName = async (supplyName: string): Promise<BakingSupplyPurchase[]> => {
  try {
    // Query all received purchases first, then filter by supply name
    const q = query(
      bakingSupplyPurchasesRef,
      where("status", "==", "received")
    );
    const snapshot = await getDocs(q);

    // Map and filter results
    const results = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupplyPurchase, "id">;
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
      purchase.supplyName?.trim().toLowerCase() === supplyName.trim().toLowerCase()
    );

    // Filter out hidden batches (marked as hidden by admin)
    const visibleBatches = filtered.filter(purchase => !purchase.hidden);

    // Filter out depleted batches older than 168 hours (1 week)
    const now = Date.now();
    const hoursInMs = 168 * 60 * 60 * 1000; // 168 hours in milliseconds
    const activeBatches = visibleBatches.filter(purchase => {
      const quantityRemaining = purchase.quantityRemaining !== undefined ? purchase.quantityRemaining : purchase.quantity;
      
      // If batch is not depleted, include it
      if (quantityRemaining > 0) {
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
    console.error("Error fetching batches by supply name:", error);
    throw new Error("Failed to fetch batches by supply name. Please try again.");
  }
};

// 🔄 UPDATE BATCH QUANTITY (for FIFO when sales/usage occurs)
export const updateBakingSupplyBatchQuantity = async (purchaseId: string, quantityUsed: number): Promise<void> => {
  try {
    const purchaseRef = doc(db, "bakingSupplyPurchases", purchaseId);

    // First, get the current purchase to check remaining quantity
    const purchaseDoc = await getDoc(purchaseRef);

    if (!purchaseDoc.exists()) {
      throw new Error("Baking supply purchase not found");
    }

    const currentData = purchaseDoc.data() as Omit<BakingSupplyPurchase, "id">;
    const newQuantityRemaining = Math.max(0, (currentData.quantityRemaining !== undefined ? currentData.quantityRemaining : currentData.quantity) - quantityUsed);

    // Check if batch is becoming depleted and set depletedAt timestamp
    const updateData: any = {
      quantityRemaining: newQuantityRemaining,
      updatedAt: Timestamp.now(),
    };

    // If batch becomes depleted (quantityRemaining goes from >0 to 0), set depletedAt
    const currentQuantityRemaining = currentData.quantityRemaining !== undefined ? currentData.quantityRemaining : currentData.quantity;
    if (currentQuantityRemaining > 0 && newQuantityRemaining === 0) {
      updateData.depletedAt = Timestamp.now();
    }

    await updateDoc(purchaseRef, updateData);
  } catch (error) {
    console.error("Error updating baking supply batch quantity:", error);
    throw new Error("Failed to update baking supply batch quantity. Please try again.");
  }
};

// 🔄 RESTORE BATCH QUANTITY (when sale is cancelled or status changes from completed)
export const restoreBakingSupplyBatchQuantity = async (purchaseId: string, quantityToRestore: number): Promise<void> => {
  try {
    const purchaseRef = doc(db, "bakingSupplyPurchases", purchaseId);

    // First, get the current purchase
    const purchaseDoc = await getDoc(purchaseRef);

    if (!purchaseDoc.exists()) {
      throw new Error("Baking supply purchase not found");
    }

    const currentData = purchaseDoc.data() as Omit<BakingSupplyPurchase, "id">;
    const currentQuantityRemaining = currentData.quantityRemaining !== undefined ? currentData.quantityRemaining : currentData.quantity;
    const totalQuantity = currentData.quantity;

    // Calculate new quantity remaining, but don't exceed the original total
    const newQuantityRemaining = Math.min(totalQuantity, currentQuantityRemaining + quantityToRestore);

    await updateDoc(purchaseRef, {
      quantityRemaining: newQuantityRemaining,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error restoring baking supply batch quantity:", error);
    throw new Error("Failed to restore baking supply batch quantity. Please try again.");
  }
};

// 🔄 RESTORE BATCH QUANTITIES FOR A SUPPLY (reverse FIFO - restore to newest batches first)
export const restoreBakingSupplyBatchQuantitiesForSupply = async (supplyName: string, quantityToRestore: number): Promise<number> => {
  try {
    // Get all received purchases for this supply, ordered by date (newest first for reverse FIFO)
    const purchases = await getBakingSupplyPurchasesBySupplyName(supplyName);
    
    // Reverse to get newest first for restoration
    const newestFirst = [...purchases].reverse();
    
    let remainingQuantity = quantityToRestore;
    let totalRestored = 0;
    
    for (const purchase of newestFirst) {
      if (remainingQuantity <= 0) break;
      
      const currentQuantityRemaining = purchase.quantityRemaining !== undefined ? purchase.quantityRemaining : purchase.quantity;
      const totalQuantity = purchase.quantity;
      const availableSpace = totalQuantity - currentQuantityRemaining;
      
      if (availableSpace > 0) {
        // Calculate how much to restore to this batch
        const restoreAmount = Math.min(remainingQuantity, availableSpace);
        
        await updateBakingSupplyPurchase(purchase.id!, {
          quantityRemaining: currentQuantityRemaining + restoreAmount
        });
        
        remainingQuantity -= restoreAmount;
        totalRestored += restoreAmount;
      }
    }
    
    return totalRestored;
  } catch (error) {
    console.error("Error restoring baking supply batch quantities:", error);
    throw new Error("Failed to restore baking supply batch quantities. Please try again.");
  }
};

// 📊 GET BAKING SUPPLY INVENTORY FROM BATCHES
// Calculates inventory for each baking supply from purchase batches
export interface BakingSupplyInventoryItem {
  id?: string;
  supplyName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  quantityRemaining: number;
  unitPrice: number; // Average unit price across batches
  stockValue: number; // Calculated from batches
  status: "in_stock" | "low_stock" | "out_of_stock";
  batches: BakingSupplyPurchase[];
}

export const getBakingSupplyInventoryFromBatches = async (lowStockThreshold: number = 5): Promise<BakingSupplyInventoryItem[]> => {
  try {
    // Get all received baking supply purchases
    const allPurchases = await getBakingSupplyPurchases();
    const receivedPurchases = allPurchases.filter(p => p.status === "received");

    // Group by supply name
    const supplyMap = new Map<string, BakingSupplyPurchase[]>();
    
    for (const purchase of receivedPurchases) {
      const existing = supplyMap.get(purchase.supplyName) || [];
      existing.push(purchase);
      supplyMap.set(purchase.supplyName, existing);
    }

    // Calculate inventory for each supply
    const inventoryItems: BakingSupplyInventoryItem[] = [];
    
    for (const [supplyName, purchases] of supplyMap) {
      // Calculate total quantity remaining
      const totalQuantityRemaining = purchases.reduce((sum, p) => {
        return sum + (p.quantityRemaining !== undefined ? p.quantityRemaining : p.quantity);
      }, 0);

      // Calculate total quantity (original)
      const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);

      // Calculate weighted average unit price
      const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
      const avgUnitPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      // Calculate stock value from remaining quantities
      const stockValue = purchases.reduce((sum, p) => {
        const remaining = p.quantityRemaining !== undefined ? p.quantityRemaining : p.quantity;
        return sum + (remaining * p.unitPrice);
      }, 0);

      // Determine status
      let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
      if (totalQuantityRemaining === 0) {
        status = "out_of_stock";
      } else if (totalQuantityRemaining < lowStockThreshold) {
        status = "low_stock";
      }

      // Get category and unit from first purchase
      const firstPurchase = purchases[0];

      inventoryItems.push({
        supplyName,
        category: firstPurchase.category || "Uncategorized",
        unit: firstPurchase.unit || "units",
        totalQuantity,
        quantityRemaining: totalQuantityRemaining,
        unitPrice: avgUnitPrice,
        stockValue,
        status,
        batches: purchases,
      });
    }

    // Sort by name
    return inventoryItems.sort((a, b) => a.supplyName.localeCompare(b.supplyName));
  } catch (error) {
    console.error("Error calculating baking supply inventory from batches:", error);
    throw new Error("Failed to calculate baking supply inventory. Please try again.");
  }
};

// 📊 CALCULATE STOCK VALUE FOR A SPECIFIC SUPPLY
export const calculateBakingSupplyStockValueFromBatches = async (supplyName: string): Promise<number> => {
  try {
    const batches = await getBatchesBySupplyName(supplyName);
    
    return batches.reduce((sum, batch) => {
      const remaining = batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity;
      return sum + (remaining * batch.unitPrice);
    }, 0);
  } catch (error) {
    console.error("Error calculating baking supply stock value:", error);
    return 0;
  }
};
