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
import { getCurrentUserIdOrThrow } from "../lib/userData";
import { Category, CategoryType } from "@/types/category";

const categoriesRef = collection(db, "categories");

// ➕ Add Category
export const addCategory = async (
  name: string,
  type: CategoryType
) => {
  const ownerId = getCurrentUserIdOrThrow();
  await addDoc(categoriesRef, {
    name,
    type,
    ownerId,
    createdAt: Timestamp.now(),
  });
};

// 📥 Get Categories by Type (user's own only)
export const getCategories = async (
  type?: CategoryType
): Promise<Category[]> => {
  const ownerId = getCurrentUserIdOrThrow();
  const q = type
    ? query(categoriesRef, where("ownerId", "==", ownerId), where("type", "==", type))
    : query(categoriesRef, where("ownerId", "==", ownerId));

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
