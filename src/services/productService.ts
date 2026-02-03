import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product } from "../types/product";

// 🔗 Collection reference
const productsRef = collection(db, "products");

// ➕ ADD PRODUCT
export const addProduct = async (product: Product) => {
  await addDoc(productsRef, {
    ...product,
    createdAt: Timestamp.now(), // 🔥 handled here
    updatedAt: Timestamp.now(), // 🔥 optional but recommended
  });
};

// 📥 GET PRODUCTS
export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(productsRef);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Product, "id">),
  }));
};

// ✏️ UPDATE PRODUCT
export const updateProduct = async (
  id: string,
  data: Partial<Product>
) => {
  const productRef = doc(db, "products", id);

  await updateDoc(productRef, {
    ...data,
    updatedAt: Timestamp.now(), // 🔥 centrally controlled
  });
};
