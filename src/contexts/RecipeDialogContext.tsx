import { createContext, useContext, useState, ReactNode } from "react";

interface RecipeDialogContextType {
  isNewRecipeDialogOpen: boolean;
  openNewRecipeDialog: () => void;
  closeNewRecipeDialog: () => void;
}

const RecipeDialogContext = createContext<RecipeDialogContextType | undefined>(
  undefined
);

export function RecipeDialogProvider({ children }: { children: ReactNode }) {
  const [isNewRecipeDialogOpen, setIsNewRecipeDialogOpen] = useState(false);

  const openNewRecipeDialog = () => setIsNewRecipeDialogOpen(true);
  const closeNewRecipeDialog = () => setIsNewRecipeDialogOpen(false);

  return (
    <RecipeDialogContext.Provider
      value={{
        isNewRecipeDialogOpen,
        openNewRecipeDialog,
        closeNewRecipeDialog,
      }}
    >
      {children}
    </RecipeDialogContext.Provider>
  );
}

export function useRecipeDialog() {
  const context = useContext(RecipeDialogContext);
  if (context === undefined) {
    throw new Error("useRecipeDialog must be used within a RecipeDialogProvider");
  }
  return context;
}
