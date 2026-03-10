import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getCurrentUserIdOrThrow } from "@/lib/userData";
import { Purchase } from "@/types/purchase";
import { addNotification, shouldCreateNotification } from "./notificationService";

const productsRef = collection(db, "products");
const inventoryRef = collection(db, "inventory");
const stockAdjustmentsRef = collection(db, "stockAdjustments");
const purchasesRef = collection(db, "purchases");

// 🔍 Helper function to get product category by name
export const getProductCategoryByName = async (productName: string): Promise<string | null> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(productsRef, where("ownerId", "==", ownerId), where("name", "==", productName));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const productData = snapshot.docs[0].data();
    return productData.category || null;
  } catch (error) {
    console.error("Error fetching product category:", error);
    return null;
  }
};

// 📥 Get all inventory items (user's own only)
export const getInventory = async () => {
  const ownerId = getCurrentUserIdOrThrow();
  const q = query(inventoryRef, where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 📥 Get inventory by category (user's own only)
export const getInventoryByCategory = async (category: string) => {
  const ownerId = getCurrentUserIdOrThrow();
  const q = query(
    inventoryRef,
    where("ownerId", "==", ownerId),
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 📥 Get low stock items (from inventory collection)
export const getLowStockItems = async (threshold: number = 5) => {
  const snapshot = await getDocs(inventoryRef);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((item: any) => item.stock < threshold);
};

// ➕ Add stock to product (updates inventory collection)
export const addStock = async (id: string, quantity: number, threshold: number = 5) => {
  const itemRef = doc(db, "inventory", id);
  // First get the current inventory item to calculate new stock
  const snapshot = await getDocs(query(inventoryRef, where("__name__", "==", id)));
  if (snapshot.empty) return;

  const currentData = snapshot.docs[0].data();
  const newStock = (currentData.stock || 0) + quantity;
  const newStatus = newStock < threshold ? "low_stock" : "active";

  await updateDoc(itemRef, {
    stock: newStock,
    status: newStatus,
    updatedAt: Timestamp.now(),
  });

  // Record the adjustment in stockAdjustments collection
  await addStockAdjustment({
    productId: id,
    productName: currentData.name,
    adjustmentType: "add",
    quantity: quantity,
    previousStock: currentData.stock || 0,
    newStock: newStock,
  });
};

// ✏️ Adjust stock (increase or decrease) - updates inventory collection
export const adjustStock = async (id: string, adjustment: number, reason?: string, threshold: number = 5) => {
  const itemRef = doc(db, "inventory", id);
  // First get the current inventory item
  const snapshot = await getDocs(query(inventoryRef, where("__name__", "==", id)));
  if (snapshot.empty) return;

  const currentData = snapshot.docs[0].data();
  const newStock = (currentData.stock || 0) + adjustment;
  const newStatus = newStock < threshold ? "low_stock" : "active";

  await updateDoc(itemRef, {
    stock: newStock,
    status: newStatus,
    updatedAt: Timestamp.now(),
  });

  // Record the adjustment in stockAdjustments collection
  await addStockAdjustment({
    productId: id,
    productName: currentData.name,
    adjustmentType: "adjust",
    quantity: adjustment,
    previousStock: currentData.stock || 0,
    newStock: newStock,
    reason: reason,
  });
};

// 📥 Get stock adjustments history
export const getStockAdjustments = async () => {
  const snapshot = await getDocs(stockAdjustmentsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ➕ Add stock adjustment record
export const addStockAdjustment = async (data: any) => {
  await addDoc(stockAdjustmentsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
};

// 🔧 Retroactively fix all inventory items with "Uncategorized" category
export const fixAllInventoryCategories = async (): Promise<{ updated: number; skipped: number }> => {
  try {
    const snapshot = await getDocs(inventoryRef);
    let updated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const inventoryItem = docSnap.data();
      const itemName = inventoryItem.name;
      const currentCategory = inventoryItem.category;

      // Skip if category is already set and not "Uncategorized"
      if (currentCategory && currentCategory !== "Uncategorized") {
        skipped++;
        continue;
      }

      // Fetch category from products database
      const productCategory = await getProductCategoryByName(itemName);

      if (productCategory && productCategory !== "Uncategorized") {
        await updateDoc(doc(db, "inventory", docSnap.id), {
          category: productCategory,
          updatedAt: Timestamp.now(),
        });
        updated++;
      } else {
        skipped++;
      }
    }

    return { updated, skipped };
  } catch (error) {
    console.error("Error fixing inventory categories:", error);
    throw new Error("Failed to fix inventory categories. Please try again.");
  }
};

// 🔄 Create or update inventory item from purchase
export const syncInventoryFromPurchase = async (
  itemName: string,
  quantity: number,
  status: string,
  category?: string,
  threshold: number = 5
) => {
  // Only update inventory if status is "received"
  if (status !== "received") {
    return;
  }

  // Auto-fetch category from products database if not provided
  let productCategory = category;
  if (!productCategory) {
    productCategory = await getProductCategoryByName(itemName);
  }

  // Check if inventory item already exists
  const q = query(inventoryRef, where("name", "==", itemName));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new inventory item
    await addDoc(inventoryRef, {
      name: itemName,
      category: productCategory || "Uncategorized",
      stock: quantity,
      status: quantity < threshold ? "low_stock" : "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    // Update existing inventory item
    const itemDoc = snapshot.docs[0];
    const currentData = itemDoc.data();
    const newStock = (currentData.stock || 0) + quantity;
    const newStatus = newStock < threshold ? "low_stock" : "active";

    // Update category if it was missing, is "Uncategorized", and we now have one from products
    const updateData: any = {
      stock: newStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    };
    
    if (productCategory && (!currentData.category || currentData.category === "Uncategorized")) {
      updateData.category = productCategory;
    }

    await updateDoc(doc(db, "inventory", itemDoc.id), updateData);
  }
};

// 🔄 Update inventory when purchase status or quantity changes
export const updateInventoryFromPurchaseEdit = async (
  itemName: string,
  originalStatus: string,
  newStatus: string,
  originalQuantity: number,
  newQuantity: number,
  threshold: number = 5
) => {
  // Auto-fetch category from products database
  const productCategory = await getProductCategoryByName(itemName);

  // Check if inventory item exists
  const q = query(inventoryRef, where("name", "==", itemName));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // If no inventory item exists, create one if new status is received
    if (newStatus === "received") {
      await addDoc(inventoryRef, {
        name: itemName,
        category: productCategory || "Uncategorized",
        stock: newQuantity,
        status: newQuantity < threshold ? "low_stock" : "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    return;
  }

  const itemDoc = snapshot.docs[0];
  const currentData = itemDoc.data();
  const currentStock = currentData.stock || 0;

  // Calculate the stock change
  let stockChange = 0;

  // If original status was received, remove original quantity
  if (originalStatus === "received") {
    stockChange -= originalQuantity;
  }

  // If new status is received, add new quantity
  if (newStatus === "received") {
    stockChange += newQuantity;
  }

  const newStock = currentStock + stockChange;
  const newStatusValue = newStock < threshold ? "low_stock" : "active";

  // Update category if it was missing, is "Uncategorized", and we now have one from products
  const updateData: any = {
    stock: newStock,
    status: newStatusValue,
    updatedAt: Timestamp.now(),
  };
  
  if (productCategory && (!currentData.category || currentData.category === "Uncategorized")) {
    updateData.category = productCategory;
  }

  await updateDoc(doc(db, "inventory", itemDoc.id), updateData);
};

// 🛒 Update inventory when a sale is made (deduct stock)
export const updateInventoryFromSale = async (
  itemName: string,
  quantitySold: number,
  threshold: number = 5
): Promise<void> => {
  try {
    // Check if inventory item exists
    const q = query(inventoryRef, where("name", "==", itemName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Warning: Inventory item not found for ${itemName}. Cannot deduct stock.`);
      return;
    }

    const itemDoc = snapshot.docs[0];
    const currentData = itemDoc.data();
    const currentStock = currentData.stock || 0;

    // Calculate new stock (ensure it doesn't go negative)
    const newStock = Math.max(0, currentStock - quantitySold);
    const newStatus = newStock < threshold ? "low_stock" : "active";

    // Update the inventory item
    await updateDoc(doc(db, "inventory", itemDoc.id), {
      stock: newStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Record the adjustment in stockAdjustments collection
    await addStockAdjustment({
      productId: itemDoc.id,
      productName: itemName,
      adjustmentType: "sale",
      quantity: -quantitySold, // Negative to indicate deduction
      previousStock: currentStock,
      newStock: newStock,
    });

    // Check if stock fell below threshold and create notification
    if (newStock < threshold && currentStock >= threshold) {
      if (auth.currentUser) {
        const shouldNotify = await shouldCreateNotification(auth.currentUser.uid, 'low_stock');
        if (shouldNotify) {
          await addNotification(
            auth.currentUser.uid,
            'low_stock',
            'Low Stock Alert',
            `${itemName} is running low on stock. Current stock: ${newStock} (threshold: ${threshold})`,
            {
              productName: itemName,
              itemType: 'product',
              stockLevel: newStock,
              threshold: threshold,
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error updating inventory from sale:", error);
    throw new Error("Failed to update inventory from sale. Please try again.");
  }
};

// 🔄 Get batches for a product (for stock adjustment)
export const getBatchesForProduct = async (productName: string): Promise<Purchase[]> => {
  try {
    const q = query(
      purchasesRef,
      where("status", "==", "received")
    );
    const snapshot = await getDocs(q);

    const batches: Purchase[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        date: data.date instanceof Timestamp
          ? data.date.toDate()
          : data.date,
      } as Purchase;
    });

    // Filter for exact match (case-insensitive and trimmed)
    const filtered = batches.filter((batch) =>
      batch.itemName?.trim().toLowerCase() === productName.trim().toLowerCase()
    );

    // Sort by date ascending (oldest first)
    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching batches for product:", error);
    throw new Error("Failed to fetch batches for product. Please try again.");
  }
};

// 🔄 Adjust stock in both inventory and batch (connected stock adjustment)
export const adjustStockWithBatch = async (
  inventoryId: string,
  adjustment: number,
  batchId?: string,
  reason?: string,
  threshold: number = 5
) => {
  try {
    // Get the inventory item
    const inventorySnapshot = await getDocs(query(inventoryRef, where("__name__", "==", inventoryId)));
    if (inventorySnapshot.empty) {
      throw new Error("Inventory item not found");
    }

    const currentInventoryData = inventorySnapshot.docs[0].data();
    const productName = currentInventoryData.name;
    const currentStock = currentInventoryData.stock || 0;

    // Calculate new stock
    const newStock = Math.max(0, currentStock + adjustment);
    const newStatus = newStock < threshold ? "low_stock" : "active";

    // Update inventory
    await updateDoc(doc(db, "inventory", inventoryId), {
      stock: newStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // If batchId is provided, update the batch
    if (batchId) {
      const batchRef = doc(db, "purchases", batchId);
      const batchDoc = await getDoc(batchRef);

      if (batchDoc.exists()) {
        const batchData = batchDoc.data();
        const currentItemsRemaining = batchData.itemsRemaining !== undefined ? batchData.itemsRemaining : batchData.items;
        const totalItems = batchData.items;

        // Calculate new items remaining
        let newItemsRemaining = currentItemsRemaining + adjustment;

        // Ensure it doesn't go below 0 or above total
        newItemsRemaining = Math.max(0, Math.min(totalItems, newItemsRemaining));

        await updateDoc(batchRef, {
          itemsRemaining: newItemsRemaining,
          updatedAt: Timestamp.now(),
        });
      }
    }

    // Record the adjustment
    await addStockAdjustment({
      productId: inventoryId,
      productName: productName,
      adjustmentType: "adjust",
      quantity: adjustment,
      previousStock: currentStock,
      newStock: newStock,
      reason: reason,
      batchId: batchId,
    });
  } catch (error) {
    console.error("Error adjusting stock with batch:", error);
    throw new Error("Failed to adjust stock with batch. Please try again.");
  }
};

// 🔄 Recalculate inventory stock from batches (sync inventory with batch data)
export const recalculateInventoryFromBatches = async (inventoryId: string, threshold: number = 5) => {
  try {
    // Get the inventory item
    const inventorySnapshot = await getDocs(query(inventoryRef, where("__name__", "==", inventoryId)));
    if (inventorySnapshot.empty) {
      throw new Error("Inventory item not found");
    }

    const inventoryData = inventorySnapshot.docs[0].data();
    const productName = inventoryData.name;

    // Get all batches for this product
    const batches = await getBatchesForProduct(productName);

    // Calculate total stock from all batches
    const totalStock = batches.reduce((sum, batch: any) => {
      const itemsRemaining = batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items;
      return sum + itemsRemaining;
    }, 0);

    // Update inventory with calculated stock
    const newStatus = totalStock < threshold ? "low_stock" : "active";

    await updateDoc(doc(db, "inventory", inventoryId), {
      stock: totalStock,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    return totalStock;
  } catch (error) {
    console.error("Error recalculating inventory from batches:", error);
    throw new Error("Failed to recalculate inventory from batches. Please try again.");
  }
};

// 💰 Calculate stock value from batch data (cost of goods)
export const calculateStockValueFromBatches = async (productName: string): Promise<number> => {
  try {
    // Get all batches for this product
    const batches = await getBatchesForProduct(productName);

    // Calculate total stock value by summing up (itemsRemaining * itemPrice) for all batches
    const totalStockValue = batches.reduce((sum, batch: any) => {
      const itemsRemaining = batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items;
      const itemPrice = batch.itemPrice || 0;
      return sum + (itemsRemaining * itemPrice);
    }, 0);

    return totalStockValue;
  } catch (error) {
    console.error("Error calculating stock value from batches:", error);
    return 0;
  }
};
