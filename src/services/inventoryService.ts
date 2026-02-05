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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const productsRef = collection(db, "products");
const stockAdjustmentsRef = collection(db, "stockAdjustments");

// 📥 Get all inventory items (from products collection)
export const getInventory = async () => {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 📥 Get inventory by category (from products collection)
export const getInventoryByCategory = async (category: string) => {
  const q = query(
    productsRef,
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 📥 Get low stock items (from products collection)
export const getLowStockItems = async () => {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((item: any) => item.stock < 10); // Using threshold of 10 for low stock
};

// ➕ Add stock to product (updates products collection)
export const addStock = async (id: string, quantity: number) => {
  const itemRef = doc(db, "products", id);
  // First get the current product to calculate new stock
  const snapshot = await getDocs(query(productsRef, where("__name__", "==", id)));
  if (snapshot.empty) return;

  const currentData = snapshot.docs[0].data();
  const newStock = (currentData.stock || 0) + quantity;
  const newStatus = newStock <= 10 ? "low_stock" : "active";

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

// ✏️ Adjust stock (increase or decrease) - updates products collection
export const adjustStock = async (id: string, adjustment: number, reason?: string) => {
  const itemRef = doc(db, "products", id);
  // First get the current product
  const snapshot = await getDocs(query(productsRef, where("__name__", "==", id)));
  if (snapshot.empty) return;

  const currentData = snapshot.docs[0].data();
  const newStock = (currentData.stock || 0) + adjustment;
  const newStatus = newStock <= 10 ? "low_stock" : "active";

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
