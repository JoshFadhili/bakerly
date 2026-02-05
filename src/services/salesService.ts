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

// 🔗 Collection reference
const salesRef = collection(db, "sales");

// ➕ ADD SALE
export const addSale = async (sale: Sale) => {
  try {
    await addDoc(salesRef, {
      ...sale,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding sale:", error);
    throw new Error("Failed to add sale. Please try again.");
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
  data: Partial<Sale>
) => {
  try {
    const saleRef = doc(db, "sales", id);

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
export const deleteSale = async (id: string) => {
  try {
    const saleRef = doc(db, "sales", id);
    await deleteDoc(saleRef);
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw new Error("Failed to delete sale. Please try again.");
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
