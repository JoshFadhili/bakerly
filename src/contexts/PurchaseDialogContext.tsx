import { createContext, useContext, useState, ReactNode } from "react";

interface PurchaseDialogContextType {
  isNewPurchaseDialogOpen: boolean;
  openNewPurchaseDialog: () => void;
  closeNewPurchaseDialog: () => void;
}

const PurchaseDialogContext = createContext<PurchaseDialogContextType | undefined>(
  undefined
);

export function PurchaseDialogProvider({ children }: { children: ReactNode }) {
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);

  const openNewPurchaseDialog = () => setIsNewPurchaseDialogOpen(true);
  const closeNewPurchaseDialog = () => setIsNewPurchaseDialogOpen(false);

  return (
    <PurchaseDialogContext.Provider
      value={{
        isNewPurchaseDialogOpen,
        openNewPurchaseDialog,
        closeNewPurchaseDialog,
      }}
    >
      {children}
    </PurchaseDialogContext.Provider>
  );
}

export function usePurchaseDialog() {
  const context = useContext(PurchaseDialogContext);
  if (context === undefined) {
    throw new Error("usePurchaseDialog must be used within a PurchaseDialogProvider");
  }
  return context;
}
