import { createContext, useContext, useState, ReactNode } from "react";

interface SaleDialogContextType {
  isNewSaleDialogOpen: boolean;
  openNewSaleDialog: () => void;
  closeNewSaleDialog: () => void;
}

const SaleDialogContext = createContext<SaleDialogContextType | undefined>(
  undefined
);

export function SaleDialogProvider({ children }: { children: ReactNode }) {
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);

  const openNewSaleDialog = () => setIsNewSaleDialogOpen(true);
  const closeNewSaleDialog = () => setIsNewSaleDialogOpen(false);

  return (
    <SaleDialogContext.Provider
      value={{
        isNewSaleDialogOpen,
        openNewSaleDialog,
        closeNewSaleDialog,
      }}
    >
      {children}
    </SaleDialogContext.Provider>
  );
}

export function useSaleDialog() {
  const context = useContext(SaleDialogContext);
  if (context === undefined) {
    throw new Error("useSaleDialog must be used within a SaleDialogProvider");
  }
  return context;
}
