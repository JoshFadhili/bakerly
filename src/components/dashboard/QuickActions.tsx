import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSaleDialog } from "@/contexts/SaleDialogContext";
import { usePurchaseDialog } from "@/contexts/PurchaseDialogContext";
import { useExpenseDialog } from "@/contexts/ExpenseDialogContext";

interface QuickActionsProps {
  onNewSaleClick?: () => void;
  onAddPurchaseClick?: () => void;
  onRecordExpenseClick?: () => void;
}

export function QuickActions({ onNewSaleClick, onAddPurchaseClick, onRecordExpenseClick }: QuickActionsProps) {
  const navigate = useNavigate();
  const { openNewSaleDialog } = useSaleDialog();
  const { openNewPurchaseDialog } = usePurchaseDialog();
  const { openAddExpenseDialog } = useExpenseDialog();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="sale" className="flex-1" onClick={handleNewSaleClick}>
          <ShoppingCart className="h-4 w-4" />
          New Sale
        </Button>
        <Button variant="success" className="flex-1" onClick={handleAddPurchaseClick}>
          <Truck className="h-4 w-4" />
          Add Purchase
        </Button>
        <Button variant="expense" className="flex-1" onClick={handleRecordExpenseClick}>
          <Receipt className="h-4 w-4" />
          Record Expense
        </Button>
      </CardContent>
    </Card>
  );
}
