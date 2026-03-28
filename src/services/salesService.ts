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
import { db, auth } from "../lib/firebase";
import { getCurrentUserIdOrThrow } from "../lib/userData";
import { Sale } from "../types/sale";
import { deleteDoc } from "firebase/firestore";
import { getPurchasesByProductName, updateBatchQuantity, addPurchase, restoreBatchQuantitiesForProduct } from "./purchaseService";
import { updateInventoryFromSale, adjustStock } from "./inventoryService";
import { addNotification, shouldCreateNotification } from "./notificationService";
import { getUserSettings } from "./settingsService";
import { getBakingSupplyPurchasesBySupplyName, updateBakingSupplyBatchQuantity, restoreBakingSupplyBatchQuantitiesForSupply } from "./bakingSupplyPurchaseService";

// 🔗 Collection reference
const salesRef = collection(db, "sales");

// 💰 CALCULATE COGS USING FIFO FOR BAKING SUPPLIES
const calculateBakingSupplyCOGS = async (supplyName: string, quantity: number): Promise<number> => {
  try {
    const purchases = await getBakingSupplyPurchasesBySupplyName(supplyName);
    let remainingQuantity = quantity;
    let totalCOGS = 0;

    for (const purchase of purchases) {
      if (remainingQuantity <= 0) break;

      const availableInBatch = purchase.quantityRemaining !== undefined ? purchase.quantityRemaining : purchase.quantity;

      if (availableInBatch > 0) {
        const deduction = Math.min(remainingQuantity, availableInBatch);
        totalCOGS += deduction * purchase.unitPrice;
        remainingQuantity -= deduction;
      }
    }

    return totalCOGS;
  } catch (error) {
    console.error("Error calculating baking supply COGS:", error);
    return 0;
  }
};

// 🔄 APPLY BAKING SUPPLY INVENTORY DEDUCTION (FIFO)
const applyBakingSupplyInventoryDeduction = async (supplyName: string, quantity: number): Promise<void> => {
  try {
    // Get all received purchases for this supply, ordered by date (oldest first)
    const purchases = await getBakingSupplyPurchasesBySupplyName(supplyName);
    
    let remainingQuantity = quantity;
    let totalDeducted = 0;
    
    for (const purchase of purchases) {
      if (remainingQuantity <= 0) break;
      
      // Check how many items are remaining in this batch
      const availableInBatch = purchase.quantityRemaining !== undefined ? purchase.quantityRemaining : purchase.quantity;
      
      if (availableInBatch > 0) {
        // Calculate how much to deduct from this batch
        const deduction = Math.min(remainingQuantity, availableInBatch);
        
        // Update the batch quantity
        await updateBakingSupplyBatchQuantity(purchase.id!, deduction);
        
        totalDeducted += deduction;
        remainingQuantity -= deduction;
      }
    }
    
    if (remainingQuantity > 0) {
      throw new Error(`Insufficient inventory! Only ${totalDeducted} items available, but ${quantity} items were requested. Please restock before completing this sale.`);
    }
    
    // After deduction, check if remaining stock is below threshold and create notification
    if (totalDeducted > 0 && auth.currentUser) {
      try {
        // Get current total remaining quantity for this supply
        const allPurchases = await getBakingSupplyPurchasesBySupplyName(supplyName);
        const totalRemaining = allPurchases.reduce((sum, p) => {
          const remaining = p.quantityRemaining !== undefined ? p.quantityRemaining : p.quantity;
          return sum + remaining;
        }, 0);
        
        // Get user's baking supply threshold from settings
        const userSettings = await getUserSettings(auth.currentUser.uid);
        const bakingSupplyThreshold = userSettings.notifications?.bakingSupplyThreshold ?? 10;
        
        // Check if stock fell below threshold
        if (totalRemaining < bakingSupplyThreshold) {
          const shouldNotify = await shouldCreateNotification(auth.currentUser.uid, 'low_stock_baking_supply');
          if (shouldNotify) {
            // Get previous total to check if this is a new low stock condition
            const previousTotal = totalRemaining + totalDeducted;
            if (previousTotal >= bakingSupplyThreshold) {
              await addNotification(
                auth.currentUser.uid,
                'low_stock_baking_supply',
                'Baking Supply Low Stock Alert',
                `${supplyName} is running low. Current quantity: ${totalRemaining} (threshold: ${bakingSupplyThreshold})`,
                {
                  productName: supplyName,
                  itemType: 'bakingSupply',
                  stockLevel: totalRemaining,
                  threshold: bakingSupplyThreshold,
                }
              );
            }
          }
        }
      } catch (notificationError) {
        console.error("Error creating low stock notification for baking supply:", notificationError);
        // Don't fail the sale if notification fails
      }
    }
  } catch (error) {
    console.error("Error applying baking supply inventory deduction:", error);
    throw error;
  }
};

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
    const cogs = sale.itemType === "bakingSupply" 
      ? await calculateBakingSupplyCOGS(sale.itemName, sale.items)
      : await calculateCOGS(sale.itemName, sale.items);
    const grossProfit = sale.totalAmount - cogs;

    // Add the sale record with COGS and Gross Profit
    const ownerId = getCurrentUserIdOrThrow();
    const saleDoc = await addDoc(salesRef, {
      ...sale,
      ownerId,
      cogs,
      grossProfit,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create notification for new order if enabled
    if (auth.currentUser && sale.status === "completed") {
      const shouldNotify = await shouldCreateNotification(auth.currentUser.uid, 'new_order');
      if (shouldNotify) {
        await addNotification(
          auth.currentUser.uid,
          'new_order',
          'New Order Received',
          `${sale.items} ${sale.itemName} sold for KSh ${sale.totalAmount.toLocaleString()}`,
          {
            orderId: saleDoc.id,
            productName: sale.itemName,
            amount: sale.totalAmount,
          }
        );
      }
    }

    // If sale is completed, apply FIFO inventory deduction
    // Note: We don't throw an error if FIFO deduction fails after sale is added
    // The sale is already recorded, we just log the error for manual review
    if (sale.status === "completed") {
      try {
        if (sale.itemType === "bakingSupply") {
          await applyBakingSupplyInventoryDeduction(sale.itemName, sale.items);
        } else {
          await applyFIFOInventoryDeduction(sale.itemName, sale.items);
        }
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
      // Get user's low stock threshold from settings for finished products
      let lowStockThreshold = 5; // default value
      if (auth.currentUser) {
        try {
          const userSettings = await getUserSettings(auth.currentUser.uid);
          // Use the new finishedProductThreshold, fall back to legacy lowStockThreshold
          lowStockThreshold = userSettings.notifications?.finishedProductThreshold ?? 
            userSettings.notifications?.lowStockThreshold ?? 5;
        } catch (error) {
          console.error("Error fetching user settings for low stock threshold:", error);
          // Use default value if settings fetch fails
        }
      }
      
      await updateInventoryFromSale(itemName, totalDeducted, lowStockThreshold);
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
  newQuantity: number,
  itemType?: "product" | "bakingSupply",
  threshold?: number
): Promise<void> => {
  try {
    // Get user's low stock threshold from settings if not provided
    let lowStockThreshold = threshold;
    if (lowStockThreshold === undefined && auth.currentUser) {
      try {
        const userSettings = await getUserSettings(auth.currentUser.uid);
        lowStockThreshold = userSettings.notifications?.lowStockThreshold ?? 5;
      } catch (error) {
        console.error("Error fetching user settings for low stock threshold:", error);
        lowStockThreshold = 5; // Use default value if settings fetch fails
      }
    }
    if (lowStockThreshold === undefined) {
      lowStockThreshold = 5; // Ensure we have a value
    }

    // If original status was completed, restore the original quantity
    if (originalStatus === "completed") {
      // Restore inventory stock based on item type
      if (itemType === "bakingSupply") {
        // Restore baking supply stock
        await adjustBakingSupplyStockByName(itemName, originalQuantity, "Sale edit - restore original quantity");
        // Restore baking supply batch quantities using reverse FIFO (newest batches first)
        await restoreBakingSupplyBatchQuantitiesForSupply(itemName, originalQuantity);
      } else {
        // Restore finished product stock
        await adjustStockByName(itemName, originalQuantity, "Sale edit - restore original quantity", lowStockThreshold);
        // Restore batch quantities using reverse FIFO (newest batches first)
        await restoreBatchQuantitiesForProduct(itemName, originalQuantity);
      }
    }

    // If new status is completed, deduct the new quantity
    if (newStatus === "completed") {
      if (itemType === "bakingSupply") {
        await applyBakingSupplyInventoryDeduction(itemName, newQuantity);
      } else {
        await applyFIFOInventoryDeduction(itemName, newQuantity);
      }
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
  reason?: string,
  threshold: number = 5
): Promise<void> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const inventoryRef = collection(db, "inventory");
    const q = query(inventoryRef, where("ownerId", "==", ownerId), where("name", "==", itemName));
    const snapshot = await getDocs(q);


    if (snapshot.empty) {
      console.warn(`Warning: Inventory item not found for ${itemName}. Cannot adjust stock.`);
      return;
    }

    const itemDoc = snapshot.docs[0];
    const currentData = itemDoc.data();
    const currentStock = currentData.stock || 0;
    const newStock = currentStock + quantity;
    const newStatus = newStock < threshold ? "low_stock" : "active";

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

// 🔄 ADJUST BAKING SUPPLY STOCK BY NAME (helper function)
const adjustBakingSupplyStockByName = async (
  supplyName: string,
  quantity: number,
  reason?: string
): Promise<void> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const bakingSuppliesRef = collection(db, "bakingSupplies");
    const q = query(bakingSuppliesRef, where("ownerId", "==", ownerId), where("name", "==", supplyName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Warning: Baking supply not found for ${supplyName}. Cannot adjust stock.`);
      return;
    }

    const itemDoc = snapshot.docs[0];
    const currentData = itemDoc.data();
    const currentStock = currentData.quantity || 0;
    const newStock = currentStock + quantity;
    
    // Determine status based on new stock level
    let newStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    if (newStock <= 0) {
      newStatus = "out_of_stock";
    } else if (newStock < 5) {
      newStatus = "low_stock";
    }

    await updateDoc(doc(db, "bakingSupplies", itemDoc.id), {
      quantity: newStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    console.log(`Adjusted baking supply ${supplyName} stock: ${currentStock} -> ${newStock}`);
  } catch (error) {
    console.error("Error adjusting baking supply stock by name:", error);
    throw new Error("Failed to adjust baking supply stock. Please try again.");
  }
};

// 📥 GET SALES
export const getSales = async (): Promise<Sale[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(salesRef, where("ownerId", "==", ownerId), orderBy("date", "desc"));
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
          newQuantity,
          originalSale.itemType
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
      await restoreInventoryFromSale(sale.itemName, sale.items, sale.itemType);
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
  quantity: number,
  itemType?: "product" | "bakingSupply",
  threshold: number = 5
): Promise<void> => {
  try {
    // Restore inventory stock based on item type
    if (itemType === "bakingSupply") {
      // Restore baking supply stock
      await adjustBakingSupplyStockByName(itemName, quantity, "Sale deleted/cancelled - restore inventory");
      // Restore baking supply batch quantities using reverse FIFO (newest batches first)
      await restoreBakingSupplyBatchQuantitiesForSupply(itemName, quantity);
    } else {
      // Restore finished product stock
      await adjustStockByName(itemName, quantity, "Sale deleted/cancelled - restore inventory", threshold);
      // Restore batch quantities using reverse FIFO (newest batches first)
      await restoreBatchQuantitiesForProduct(itemName, quantity);
    }

    console.log(`Restored ${quantity} items to inventory and batches for ${itemName}`);
  } catch (error) {
    console.error("Error restoring inventory from sale:", error);
    throw new Error("Failed to restore inventory from sale. Please try again.");
  }
};

// 🔍 SEARCH SALES BY ITEM NAME
export const searchSalesByItemName = async (itemName: string): Promise<Sale[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      salesRef,
      where("ownerId", "==", ownerId),
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
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      salesRef,
      where("ownerId", "==", ownerId),
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
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      salesRef,
      where("ownerId", "==", ownerId),
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
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      salesRef,
      where("ownerId", "==", ownerId),
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
    const ownerId = getCurrentUserIdOrThrow();

    const q = query(
      salesRef,
      where("ownerId", "==", ownerId),
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
