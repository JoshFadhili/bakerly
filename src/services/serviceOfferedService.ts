import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCurrentUserIdOrThrow } from "../lib/userData";
import { ServiceOffered } from "../types/serviceOffered";

// 🔗 Collection reference
const servicesOfferedRef = collection(db, "servicesOffered");

// ➕ ADD SERVICE OFFERED
export const addServiceOffered = async (serviceOffered: ServiceOffered) => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    await addDoc(servicesOfferedRef, {
      ...serviceOffered,
      ownerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding service offered:", error);
    throw new Error("Failed to add service offered. Please try again.");
  }
};

// 📥 GET SERVICES OFFERED (user's own only)
export const getServicesOffered = async (): Promise<ServiceOffered[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(servicesOfferedRef, where("ownerId", "==", ownerId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error fetching services offered:", error);
    throw new Error("Failed to fetch services offered. Please try again.");
  }
};

// ✏️ UPDATE SERVICE OFFERED
export const updateServiceOffered = async (
  id: string,
  data: Partial<ServiceOffered>
) => {
  try {
    const serviceOfferedRef = doc(db, "servicesOffered", id);
    await updateDoc(serviceOfferedRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating service offered:", error);
    throw new Error("Failed to update service offered. Please try again.");
  }
};

// 🗑️ DELETE SERVICE OFFERED
export const deleteServiceOffered = async (id: string) => {
  try {
    const serviceOfferedRef = doc(db, "servicesOffered", id);
    await deleteDoc(serviceOfferedRef);
  } catch (error) {
    console.error("Error deleting service offered:", error);
    throw new Error("Failed to delete service offered. Please try again.");
  }
};

// 🔍 SEARCH SERVICES OFFERED BY SERVICE NAME
export const searchServicesOfferedByServiceName = async (serviceName: string): Promise<ServiceOffered[]> => {
  try {
    const q = query(
      servicesOfferedRef,
      where("serviceName", ">=", serviceName),
      where("serviceName", "<=", serviceName + "\uf8ff"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error searching services offered:", error);
    throw new Error("Failed to search services offered. Please try again.");
  }
};

// 🔍 FILTER SERVICES OFFERED BY STATUS
export const filterServicesOfferedByStatus = async (status: string): Promise<ServiceOffered[]> => {
  try {
    const q = query(
      servicesOfferedRef,
      where("status", "==", status),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error filtering services offered:", error);
    throw new Error("Failed to filter services offered. Please try again.");
  }
};

// 🔍 FILTER SERVICES OFFERED BY PAYMENT METHOD
export const filterServicesOfferedByPayment = async (payment: string): Promise<ServiceOffered[]> => {
  try {
    const q = query(
      servicesOfferedRef,
      where("payment", "==", payment),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error filtering services offered:", error);
    throw new Error("Failed to filter services offered. Please try again.");
  }
};

// 🔍 FILTER SERVICES OFFERED BY AMOUNT RANGE
export const filterServicesOfferedByAmountRange = async (
  minAmount: number,
  maxAmount: number
): Promise<ServiceOffered[]> => {
  try {
    const q = query(
      servicesOfferedRef,
      where("totalAmount", ">=", minAmount),
      where("totalAmount", "<=", maxAmount),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error filtering services offered:", error);
    throw new Error("Failed to filter services offered. Please try again.");
  }
};

// 🔍 FILTER SERVICES OFFERED BY DATE RANGE
export const filterServicesOfferedByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ServiceOffered[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      servicesOfferedRef,
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<ServiceOffered, "id">;
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
    console.error("Error filtering services offered:", error);
    throw new Error("Failed to filter services offered. Please try again.");
  }
};
