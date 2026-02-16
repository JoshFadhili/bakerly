import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Sale } from "../types/sale";
import { deleteDoc } from "firebase/firestore";
import { getPurchasesByProductName, updateBatchQuantity, addPurchase, restoreBatchQuantitiesForProduct } from "./purchaseService";
import { updateInventoryFromSale, adjustStock } from "./inventoryService";

// 🔗 Collection reference
const salesRef = collection(db, "sales");

// 💰 CALCULATE COGS USING FIFO
const calculateCOGS = async (itemName: string, quantity: number): Promise<number> => {
  try {
    const purchases = await getPurchasesByProductName(itemName);
    let remainingQuantity = quantity;
    let totalCOGS = 0;

    for (const purchase of purchases) {
      if (remainingQuantity <= 0) break;

      const availableInBatch = purchase.itemsRemaining !== undefined ? purchase.itemsRemaining : purchase.items;

      if (availableInBatch > 0) {
        const deduction = Math.min(remainingQuantity, availableInBatch);
        totalCOGS += deduction * purchase.itemPrice;
        remainingQuantity -= deduction;
      }
    }

    return totalCOGS;
  } catch (error) {
    console.error("Error calculating COGS:", error);
    return 0;
  }
};

// ➕ ADD SALE
export const addSale = async (sale: Sale) => {
  try {
    // Calculate COGS using FIFO
    const cogs = await calculateCOGS(sale.itemName, sale.items);
    const grossProfit = sale.totalAmount - cogs;

    // Add the sale record with COGS and Gross Profit
    await addDoc(salesRef, {
      ...sale,
      cogs,
      grossProfit,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // If sale is completed, apply FIFO inventory deduction
    // Note: We don't throw an error if FIFO deduction fails after sale is added
    // The sale is already recorded, we just log the error for manual review
    if (sale.status === "completed") {
      try {
        await applyFIFOInventoryDeduction(sale.itemName, sale.items);
      } catch (fifoError) {
        // Log the error but don't fail the sale - the sale is already recorded
        console.error("FIFO inventory deduction failed after sale was recorded:", fifoError);
      }
    }
  } catch (error) {
    console.error("Error adding sale:", error);
    throw new Error("Failed to add sale. Please try again.");
  }
};

// 🔄 APPLY FIFO INVENTORY DEDUCTION
export const applyFIFOInventoryDeduction = async (itemName: string, quantity: number): Promise<void> => {
  try {
    // Get all received purchases for this product, ordered by date (oldest first)
    const purchases = await getPurchasesByProductName(itemName);
    
    let remainingQuantity = quantity;
    let totalDeducted = 0;
    
    for (const purchase of purchases) {
      if (remainingQuantity <= 0) break;
      
      // Check how many items are remaining in this batch
      const availableInBatch = purchase.itemsRemaining !== undefined ? purchase.itemsRemaining : purchase.items;
      
      if (availableInBatch > 0) {
        // Calculate how much to deduct from this batch
        const deduction = Math.min(remainingQuantity, availableInBatch);
        
        // Update the batch quantity
        await updateBatchQuantity(purchase.id!, deduction);
        
        totalDeducted += deduction;
        remainingQuantity -= deduction;
      }
    }
    
    // Update the inventory collection's stock field
    if (totalDeducted > 0) {
      await updateInventoryFromSale(itemName, totalDeducted);
    }
    
    if (remainingQuantity > 0) {
      throw new Error(`Insufficient inventory! Only ${totalDeducted} items available, but ${quantity} items were requested. Please restock before completing this sale.`);
    }
  } catch (error) {
    console.error("Error applying FIFO inventory deduction:", error);
    throw error;
  }
};

// 🔄 UPDATE INVENTORY WHEN SALE IS EDITED
export const updateInventoryFromSaleEdit = async (
  itemName: string,
  originalStatus: string,
  newStatus: string,
  originalQuantity: number,
  newQuantity: number
): Promise<void> => {
  try {
    // If original status was completed, restore the original quantity
    if (originalStatus === "completed") {
      // Restore inventory stock
      await adjustStockByName(itemName, originalQuantity, "Sale edit - restore original quantity");
      
      // Restore batch quantities using reverse FIFO (newest batches first)
      await restoreBatchQuantitiesForProduct(itemName, originalQuantity);
    }

    // If new status is completed, deduct the new quantity
    if (newStatus === "completed") {
      await applyFIFOInventoryDeduction(itemName, newQuantity);
    }
  } catch (error) {
    console.error("Error updating inventory from sale edit:", error);
    throw new Error("Failed to update inventory from sale edit. Please try again.");
  }
};

// 🔄 ADJUST STOCK BY PRODUCT NAME (helper function)
const adjustStockByName = async (
  itemName: string,
  quantity: number,
  reason?: string
): Promise<void> => {
  try {
    const inventoryRef = collection(db, "inventory");
    const q = query(inventoryRef, where("name", "==", itemName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Warning: Inventory item not found for ${itemName}. Cannot adjust stock.`);
      return;
    }

    const itemDoc = snapshot.docs[0];
    const currentData = itemDoc.data();
    const currentStock = currentData.stock || 0;
    const newStock = currentStock + quantity;
    const newStatus = newStock <= 10 ? "low_stock" : "active";

    await updateDoc(doc(db, "inventory", itemDoc.id), {
      stock: newStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Record the adjustment in stockAdjustments collection
    const { addStockAdjustment } = await import("./inventoryService");
    await addStockAdjustment({
      productId: itemDoc.id,
      productName: itemName,
      adjustmentType: "adjust",
      quantity: quantity,
      previousStock: currentStock,
      newStock: newStock,
      reason: reason,
    });
  } catch (error) {
    console.error("Error adjusting stock by name:", error);
    throw new Error("Failed to adjust stock. Please try again.");
  }
};

// 📥 GET SALES
export const getSales = async (): Promise<Sale[]> => {
  try {
    const q = query(salesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw new Error("Failed to fetch sales. Please try again.");
  }
};

// ✏️ UPDATE SALE
export const updateSale = async (
  id: string,
  data: Partial<Sale>,
  originalSale?: Sale
) => {
  try {
    const saleRef = doc(db, "sales", id);

    // If original sale data is provided and status or quantity changed, update inventory
    if (originalSale) {
      const statusChanged = data.status !== undefined && data.status !== originalSale.status;
      const quantityChanged = data.items !== undefined && data.items !== originalSale.items;

      if (statusChanged || quantityChanged) {
        const newStatus = data.status ?? originalSale.status;
        const newQuantity = data.items ?? originalSale.items;
        await updateInventoryFromSaleEdit(
          originalSale.itemName,
          originalSale.status,
          newStatus,
          originalSale.items,
          newQuantity
        );
      }

      // Recalculate COGS and Gross Profit if item name, quantity, or total amount changed
      const itemNameChanged = data.itemName !== undefined && data.itemName !== originalSale.itemName;
      const amountChanged = data.totalAmount !== undefined && data.totalAmount !== originalSale.totalAmount;

      if (itemNameChanged || quantityChanged || amountChanged) {
        const newItemName = data.itemName ?? originalSale.itemName;
        const newQuantity = data.items ?? originalSale.items;
        const newTotalAmount = data.totalAmount ?? originalSale.totalAmount;

        const cogs = await calculateCOGS(newItemName, newQuantity);
        const grossProfit = newTotalAmount - cogs;

        data.cogs = cogs;
        data.grossProfit = grossProfit;
      }
    }

    await updateDoc(saleRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating sale:", error);
    throw new Error("Failed to update sale. Please try again.");
  }
};

// 🗑️ DELETE SALE
export const deleteSale = async (id: string, sale?: Sale) => {
  try {
    // If sale data is provided and status was completed, restore inventory
    if (sale && sale.status === "completed") {
      await restoreInventoryFromSale(sale.itemName, sale.items);
    }

    const saleRef = doc(db, "sales", id);
    await deleteDoc(saleRef);
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw new Error("Failed to delete sale. Please try again.");
  }
};

// 🔄 RESTORE INVENTORY WHEN SALE IS DELETED OR CANCELLED
const restoreInventoryFromSale = async (
  itemName: string,
  quantity: number
): Promise<void> => {
  try {
    // Restore inventory stock
    await adjustStockByName(itemName, quantity, "Sale deleted/cancelled - restore inventory");

    // Restore batch quantities using reverse FIFO (newest batches first)
    await restoreBatchQuantitiesForProduct(itemName, quantity);

    console.log(`Restored ${quantity} items to inventory and batches for ${itemName}`);
  } catch (error) {
    console.error("Error restoring inventory from sale:", error);
    throw new Error("Failed to restore inventory from sale. Please try again.");
  }
};

// 🔍 SEARCH SALES BY ITEM NAME
export const searchSalesByItemName = async (itemName: string): Promise<Sale[]> => {
  try {
    const q = query(
      salesRef,
      where("itemName", ">=", itemName),
      where("itemName", "<=", itemName + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error searching sales:", error);
    throw new Error("Failed to search sales. Please try again.");
  }
};

// 🔍 FILTER SALES BY STATUS
export const filterSalesByStatus = async (status: string): Promise<Sale[]> => {
  try {
    const q = query(
      salesRef,
      where("status", "==", status),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error filtering sales:", error);
    throw new Error("Failed to filter sales. Please try again.");
  }
};

// 🔍 FILTER SALES BY PAYMENT METHOD
export const filterSalesByPayment = async (payment: string): Promise<Sale[]> => {
  try {
    const q = query(
      salesRef,
      where("payment", "==", payment),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error filtering sales:", error);
    throw new Error("Failed to filter sales. Please try again.");
  }
};

// 🔍 FILTER SALES BY AMOUNT RANGE
export const filterSalesByAmountRange = async (
  minAmount: number,
  maxAmount: number
): Promise<Sale[]> => {
  try {
    const q = query(
      salesRef,
      where("totalAmount", ">=", minAmount),
      where("totalAmount", "<=", maxAmount),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error filtering sales:", error);
    throw new Error("Failed to filter sales. Please try again.");
  }
};

// 🔍 FILTER SALES BY DATE RANGE
export const filterSalesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Sale[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      salesRef,
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Sale, "id">;
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
      };
    });
  } catch (error) {
    console.error("Error filtering sales:", error);
    throw new Error("Failed to filter sales. Please try again.");
  }
};
