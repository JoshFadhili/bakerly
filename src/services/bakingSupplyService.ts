import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCurrentUserIdOrThrow } from "../lib/userData";
import { BakingSupply } from "../types/bakingSupply";

// 🔗 Collection reference
const bakingSuppliesRef = collection(db, "bakingSupplies");

// ➕ ADD BAKING SUPPLY
export const addBakingSupply = async (bakingSupply: BakingSupply) => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    await addDoc(bakingSuppliesRef, {
      ...bakingSupply,
      ownerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding baking supply:", error);
    throw new Error("Failed to add baking supply. Please try again.");
  }
};

// 📥 GET BAKING SUPPLIES (user's own only)
export const getBakingSupplies = async (): Promise<BakingSupply[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(bakingSuppliesRef, where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<BakingSupply, "id">;
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
    console.error("Error fetching baking supplies:", error);
    throw new Error("Failed to fetch baking supplies. Please try again.");
  }
};

// ✏️ UPDATE BAKING SUPPLY
export const updateBakingSupply = async (
  id: string,
  data: Partial<BakingSupply>
) => {
  try {
    const bakingSupplyRef = doc(db, "bakingSupplies", id);

    await updateDoc(bakingSupplyRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating baking supply:", error);
    throw new Error("Failed to update baking supply. Please try again.");
  }
};

// 🗑️ DELETE BAKING SUPPLY
export const deleteBakingSupply = async (id: string) => {
  try {
    const bakingSupplyRef = doc(db, "bakingSupplies", id);
    await deleteDoc(bakingSupplyRef);
  } catch (error) {
    console.error("Error deleting baking supply:", error);
    throw new Error("Failed to delete baking supply. Please try again.");
  }
};
