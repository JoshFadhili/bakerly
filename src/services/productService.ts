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
import { deleteDoc } from "firebase/firestore";

// 🔗 Collection reference
const productsRef = collection(db, "products");

// ➕ ADD PRODUCT
export const addProduct = async (product: Product) => {
  try {
    await addDoc(productsRef, {
      ...product,
      createdAt: Timestamp.now(), // 🔥 handled here
      updatedAt: Timestamp.now(), // 🔥 optional but recommended
    });
  } catch (error) {
    console.error("Error adding product:", error);
    throw new Error("Failed to add product. Please try again.");
  }
};

// 📥 GET PRODUCTS
export const getProducts = async (): Promise<Product[]> => {
  try {
    const snapshot = await getDocs(productsRef);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Product, "id">;
      return {
        id: docSnap.id,
        ...data,
        // Convert Firebase Timestamp to JavaScript Date
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products. Please try again.");
  }
};

// ✏️ UPDATE PRODUCT
export const updateProduct = async (
  id: string,
  data: Partial<Product>
) => {
  try {
    const productRef = doc(db, "products", id);

    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now(), // 🔥 centrally controlled
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product. Please try again.");
  }
};

// 🗑️ DELETE PRODUCT
export const deleteProduct = async (id: string) => {
  try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product. Please try again.");
  }
};