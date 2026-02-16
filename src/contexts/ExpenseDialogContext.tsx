import { createContext, useContext, useState, ReactNode } from "react";

interface ExpenseDialogContextType {
  isAddExpenseDialogOpen: boolean;
  openAddExpenseDialog: () => void;
  closeAddExpenseDialog: () => void;
}

const ExpenseDialogContext = createContext<ExpenseDialogContextType | undefined>(
  undefined
);

export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);

  const openAddExpenseDialog = () => setIsAddExpenseDialogOpen(true);
  const closeAddExpenseDialog = () => setIsAddExpenseDialogOpen(false);

  return (
    <ExpenseDialogContext.Provider
      value={{
        isAddExpenseDialogOpen,
        openAddExpenseDialog,
        closeAddExpenseDialog,
      }}
    >
      {children}
    </ExpenseDialogContext.Provider>
  );
}

export function useExpenseDialog() {
  const context = useContext(ExpenseDialogContext);
  if (context === undefined) {
    throw new Error("useExpenseDialog must be used within a ExpenseDialogProvider");
  }
  return context;
}
