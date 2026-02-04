import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Category, CategoryType } from "@/types/category";

const categoriesRef = collection(db, "categories");

// ➕ Add Category
export const addCategory = async (
  name: string,
  type: CategoryType
) => {
  await addDoc(categoriesRef, {
    name,
    type,
    createdAt: Timestamp.now(),
  });
};

// 📥 Get Categories by Type
export const getCategories = async (
  type?: CategoryType
): Promise<Category[]> => {
  const q = type
    ? query(categoriesRef, where("type", "==", type))
    : categoriesRef;

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Category, "id">),
  }));
};

// 🗑️ Delete Category
export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(db, "categories", id));
};
