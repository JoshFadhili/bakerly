import { createContext, useContext, useState, ReactNode } from "react";

interface BakingSupplyPurchaseDialogContextType {
  isNewBakingSupplyPurchaseDialogOpen: boolean;
  openNewBakingSupplyPurchaseDialog: () => void;
  closeNewBakingSupplyPurchaseDialog: () => void;
}

const BakingSupplyPurchaseDialogContext = createContext<BakingSupplyPurchaseDialogContextType | undefined>(
  undefined
);

export function BakingSupplyPurchaseDialogProvider({ children }: { children: ReactNode }) {
  const [isNewBakingSupplyPurchaseDialogOpen, setIsNewBakingSupplyPurchaseDialogOpen] = useState(false);

  const openNewBakingSupplyPurchaseDialog = () => setIsNewBakingSupplyPurchaseDialogOpen(true);
  const closeNewBakingSupplyPurchaseDialog = () => setIsNewBakingSupplyPurchaseDialogOpen(false);

  return (
    <BakingSupplyPurchaseDialogContext.Provider
      value={{
        isNewBakingSupplyPurchaseDialogOpen,
        openNewBakingSupplyPurchaseDialog,
        closeNewBakingSupplyPurchaseDialog,
      }}
    >
      {children}
    </BakingSupplyPurchaseDialogContext.Provider>
  );
}

export function useBakingSupplyPurchaseDialog() {
  const context = useContext(BakingSupplyPurchaseDialogContext);
  if (context === undefined) {
    throw new Error("useBakingSupplyPurchaseDialog must be used within a BakingSupplyPurchaseDialogProvider");
  }
  return context;
}
