import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Receipt } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="sale" className="flex-1">
          <ShoppingCart className="h-4 w-4" />
          New Sale
        </Button>
        <Button variant="success" className="flex-1">
          <Truck className="h-4 w-4" />
          Add Purchase
        </Button>
        <Button variant="expense" className="flex-1">
          <Receipt className="h-4 w-4" />
          Record Expense
        </Button>
      </CardContent>
    </Card>
  );
}
