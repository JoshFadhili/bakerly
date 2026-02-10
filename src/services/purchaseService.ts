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
import { Purchase } from "../types/purchase";
import { deleteDoc } from "firebase/firestore";

// 🔗 Collection reference
const purchasesRef = collection(db, "purchases");

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
      };
    });
  } catch (error) {
    console.error("Error filtering purchases:", error);
    throw new Error("Failed to filter purchases. Please try again.");
  }
};
