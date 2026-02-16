import { createContext, useContext, useState, ReactNode } from "react";

interface ServiceOfferedDialogContextType {
  isNewServiceOfferedDialogOpen: boolean;
  openNewServiceOfferedDialog: () => void;
  closeNewServiceOfferedDialog: () => void;
}

const ServiceOfferedDialogContext = createContext<ServiceOfferedDialogContextType | undefined>(
  undefined
);

export function ServiceOfferedDialogProvider({ children }: { children: ReactNode }) {
  const [isNewServiceOfferedDialogOpen, setIsNewServiceOfferedDialogOpen] = useState(false);

  const openNewServiceOfferedDialog = () => setIsNewServiceOfferedDialogOpen(true);
  const closeNewServiceOfferedDialog = () => setIsNewServiceOfferedDialogOpen(false);

  return (
    <ServiceOfferedDialogContext.Provider
      value={{
        isNewServiceOfferedDialogOpen,
        openNewServiceOfferedDialog,
        closeNewServiceOfferedDialog,
      }}
    >
      {children}
    </ServiceOfferedDialogContext.Provider>
  );
}

export function useServiceOfferedDialog() {
  const context = useContext(ServiceOfferedDialogContext);
  if (context === undefined) {
    throw new Error("useServiceOfferedDialog must be used within a ServiceOfferedDialogProvider");
  }
  return context;
}
