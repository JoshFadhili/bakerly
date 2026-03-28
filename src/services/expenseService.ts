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
import { Expense } from "../types/expense";

// 🔗 Collection reference
const expensesRef = collection(db, "expenses");

// ➕ ADD EXPENSE
export const addExpense = async (expense: Expense) => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    await addDoc(expensesRef, {
      ...expense,
      ownerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Failed to add expense. Please try again.");
  }
};

// 📥 GET EXPENSES (user's own only)
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(expensesRef, where("ownerId", "==", ownerId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Expense, "id">;
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
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses. Please try again.");
  }
};

// ✏️ UPDATE EXPENSE
export const updateExpense = async (id: string, data: Partial<Expense>) => {
  try {
    const expenseRef = doc(db, "expenses", id);
    await updateDoc(expenseRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Failed to update expense. Please try again.");
  }
};

// 🗑️ DELETE EXPENSE
export const deleteExpense = async (id: string) => {
  try {
    const expenseRef = doc(db, "expenses", id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Failed to delete expense. Please try again.");
  }
};

// 🔍 FILTER EXPENSES BY CATEGORY
export const filterExpensesByCategory = async (category: string): Promise<Expense[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      expensesRef,
      where("ownerId", "==", ownerId),
      where("category", "==", category),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Expense, "id">;
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
    console.error("Error filtering expenses:", error);
    throw new Error("Failed to filter expenses. Please try again.");
  }
};

// 🔍 FILTER EXPENSES BY AMOUNT RANGE
export const filterExpensesByAmountRange = async (
  minAmount: number,
  maxAmount: number
): Promise<Expense[]> => {
  try {
    const ownerId = getCurrentUserIdOrThrow();
    const q = query(
      expensesRef,
      where("ownerId", "==", ownerId),
      where("amount", ">=", minAmount),
      where("amount", "<=", maxAmount),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Expense, "id">;
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
    console.error("Error filtering expenses:", error);
    throw new Error("Failed to filter expenses. Please try again.");
  }
};

// 🔍 FILTER EXPENSES BY DATE RANGE
export const filterExpensesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    const ownerId = getCurrentUserIdOrThrow();

    const q = query(
      expensesRef,
      where("ownerId", "==", ownerId),
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Expense, "id">;
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
    console.error("Error filtering expenses:", error);
    throw new Error("Failed to filter expenses. Please try again.");
  }
};

// 🔍 FILTER EXPENSES BY MONTH AND YEAR
export const filterExpensesByMonthAndYear = async (
  month: number,
  year: number
): Promise<Expense[]> => {
  try {
    // Create start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    const ownerId = getCurrentUserIdOrThrow();

    const q = query(
      expensesRef,
      where("ownerId", "==", ownerId),
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Expense, "id">;
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
    console.error("Error filtering expenses:", error);
    throw new Error("Failed to filter expenses. Please try again.");
  }
};

// 🔍 SEARCH EXPENSES BY DESCRIPTION OR CATEGORY
export const searchExpenses = async (searchQuery: string): Promise<Expense[]> => {
  try {
    // Get all expenses and filter client-side
    const expenses = await getExpenses();
    const lowerQuery = searchQuery.toLowerCase();

    return expenses.filter(
      (expense) =>
        expense.description.toLowerCase().includes(lowerQuery) ||
        expense.category.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error("Error searching expenses:", error);
    throw new Error("Failed to search expenses. Please try again.");
  }
};
