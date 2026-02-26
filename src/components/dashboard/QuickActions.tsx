import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Receipt, Plus, Wrench, Package, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSaleDialog } from "@/contexts/SaleDialogContext";
import { usePurchaseDialog } from "@/contexts/PurchaseDialogContext";
import { useExpenseDialog } from "@/contexts/ExpenseDialogContext";
import { useServiceOfferedDialog } from "@/contexts/ServiceOfferedDialogContext";
import { useRecipeDialog } from "@/contexts/RecipeDialogContext";
import { useBakingSupplyPurchaseDialog } from "@/contexts/BakingSupplyPurchaseDialogContext";

interface QuickActionsProps {
  onNewSaleClick?: () => void;
  onAddPurchaseClick?: () => void;
  onRecordExpenseClick?: () => void;
  onNewServiceOfferedClick?: () => void;
  onAddFinishedProductClick?: () => void;
  onAddNewRecipeClick?: () => void;
  onAddBakingSupplyPurchaseClick?: () => void;
}

export function QuickActions({ onNewSaleClick, onAddPurchaseClick, onRecordExpenseClick, onNewServiceOfferedClick, onAddFinishedProductClick, onAddNewRecipeClick, onAddBakingSupplyPurchaseClick }: QuickActionsProps) {
  const navigate = useNavigate();
  const { openNewSaleDialog } = useSaleDialog();
  const { openNewPurchaseDialog } = usePurchaseDialog();
  const { openAddExpenseDialog } = useExpenseDialog();
  const { openNewServiceOfferedDialog } = useServiceOfferedDialog();
  const { openNewRecipeDialog } = useRecipeDialog();
  const { openNewBakingSupplyPurchaseDialog } = useBakingSupplyPurchaseDialog();

  const handleNewSaleClick = () => {
    onNewSaleClick?.();
    openNewSaleDialog();
    navigate("/sales");
  };

  const handleAddPurchaseClick = () => {
    onAddPurchaseClick?.();
    openNewPurchaseDialog();
    navigate("/purchases");
  };

  const handleRecordExpenseClick = () => {
    onRecordExpenseClick?.();
    openAddExpenseDialog();
    navigate("/expenses");
  };

  const handleNewServiceOfferedClick = () => {
    onNewServiceOfferedClick?.();
    openNewServiceOfferedDialog();
    navigate("/sales");
  };

  const handleAddFinishedProductClick = () => {
    onAddFinishedProductClick?.();
    openNewPurchaseDialog();
    navigate("/finished-products");
  };

  const handleAddNewRecipeClick = () => {
    onAddNewRecipeClick?.();
    openNewRecipeDialog();
    navigate("/recipes");
  };

  const handleAddBakingSupplyPurchaseClick = () => {
    onAddBakingSupplyPurchaseClick?.();
    openNewBakingSupplyPurchaseDialog();
    navigate("/purchases");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Button variant="success" className="h-24 text-base" onClick={handleAddFinishedProductClick}>
          <Package className="h-8 w-8 mb-1" />
          <span>Add Finished Product</span>
        </Button>
        <Button variant="expense" className="h-24 text-base" onClick={handleRecordExpenseClick}>
          <Receipt className="h-8 w-8 mb-1" />
          <span>Record Expense</span>
        </Button>
        <Button variant="sale" className="h-24 text-base" onClick={handleNewSaleClick}>
          <ShoppingCart className="h-8 w-8 mb-1" />
          <span>New Sale</span>
        </Button>
        <Button variant="default" className="h-24 text-base" onClick={handleNewServiceOfferedClick}>
          <Wrench className="h-8 w-8 mb-1" />
          <span>New Service Offered</span>
        </Button>
        <Button variant="success" className="h-24 text-base" onClick={handleAddNewRecipeClick}>
          <ChefHat className="h-8 w-8 mb-1" />
          <span>Add New Recipe</span>
        </Button>
        <Button variant="expense" className="h-24 text-base" onClick={handleAddBakingSupplyPurchaseClick}>
          <Truck className="h-8 w-8 mb-1" />
          <span>Baking Supplies Purchase</span>
        </Button>
      </CardContent>
    </Card>
  );
}
