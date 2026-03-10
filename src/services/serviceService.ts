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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUserIdOrThrow } from "@/lib/userData";

const servicesRef = collection(db, "services");

// 📥 Get services (user's own only)
export const getServices = async () => {
  const ownerId = getCurrentUserIdOrThrow();
  const q = query(servicesRef, where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ➕ Add service
export const addService = async (data: any) => {
  const ownerId = getCurrentUserIdOrThrow();
  await addDoc(servicesRef, {
    ...data,
    ownerId,
    createdAt: Timestamp.now(),
  });
};

// ✏️ Update service
export const updateService = async (id: string, data: any) => {
  await updateDoc(doc(db, "services", id), data);
};

// 🗑️ Delete service
export const deleteService = async (id: string) => {
  await deleteDoc(doc(db, "services", id));
};
