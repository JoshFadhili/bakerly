import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Product } from "../types/product"

const productsRef = collection(db, "products")

export const addProduct = async (product: Product) => {
  await addDoc(productsRef, {
    ...product,
    createdAt: Timestamp.now(),
  })
}

export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(productsRef)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, "id">),
  }))
}
