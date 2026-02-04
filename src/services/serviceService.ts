import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const servicesRef = collection(db, "services");

// 📥 Get services
export const getServices = async () => {
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ➕ Add service
export const addService = async (data: any) => {
  await addDoc(servicesRef, {
    ...data,
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
