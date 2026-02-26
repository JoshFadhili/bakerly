import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BakingSupplyInventoryItem, getBatchesBySupplyName, updateBakingSupplyPurchase } from "@/services/bakingSupplyPurchaseService";
import { BakingSupplyPurchase } from "@/types/bakingSupplyPurchase";
import { Edit, Package, AlertTriangle } from "lucide-react";

interface AdjustBakingSupplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdjusted: () => void;
  supply: BakingSupplyInventoryItem | null;
}

export default function AdjustBakingSupplyDialog({
  isOpen,
  onClose,
  onStockAdjusted,
  supply,
}: AdjustBakingSupplyDialogProps) {
  const [batches, setBatches] = useState<BakingSupplyPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Form state
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  // Fetch batches when supply changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (supply) {
        setLoadingBatches(true);
        try {
          const batchesList = await getBatchesBySupplyName(supply.supplyName);
          setBatches(batchesList);

          // Set default to first batch with remaining quantity
          const firstBatchWithItems = batchesList.find(
            (batch) => (batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity) > 0
          );
          if (firstBatchWithItems) {
            setSelectedBatchId(firstBatchWithItems.id!);
          } else if (batchesList.length > 0) {
            setSelectedBatchId(batchesList[0].id!);
          }
        } catch (error) {
          console.error("Error fetching batches:", error);
        } finally {
          setLoadingBatches(false);
        }
      }
    };

    fetchBatches();
  }, [supply]);

  // Reset form when dialog opens/closes or supply changes
  useEffect(() => {
    if (!isOpen) {
      setAdjustmentQuantity("");
      setAdjustmentReason("");
      setSelectedBatchId("");
    }
  }, [isOpen, supply]);

  const handleSubmit = async () => {
    if (!supply || !selectedBatchId || !adjustmentQuantity) return;

    const adjustment = Number(adjustmentQuantity);
    if (isNaN(adjustment) || adjustment === 0) {
      alert("Please enter a valid adjustment quantity");
      return;
    }

    setLoading(true);
    try {
      // Find the selected batch
      const selectedBatch = batches.find((b) => b.id === selectedBatchId);
      if (!selectedBatch) {
        throw new Error("Batch not found");
      }

      // Calculate new quantity remaining
      const currentQuantityRemaining = selectedBatch.quantityRemaining !== undefined
        ? selectedBatch.quantityRemaining
        : selectedBatch.quantity;

      const newQuantityRemaining = Math.max(0, currentQuantityRemaining + adjustment);

      // Update the batch with new quantity and reason
      await updateBakingSupplyPurchase(selectedBatchId, {
        quantityRemaining: newQuantityRemaining,
        // Store the adjustment reason in a notes field or similar
        // For now, we'll just update the quantity
      });

      // If there's a reason, we could store it in a custom field
      // For now, we'll log it
      if (adjustmentReason) {
        console.log(`Stock adjustment for ${supply.supplyName}: ${adjustment} (${adjustmentReason})`);
      }

      onStockAdjusted();
      onClose();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Failed to adjust stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBatchInfo = () => {
    const batch = batches.find((b) => b.id === selectedBatchId);
    if (!batch) return null;

    const quantityRemaining = batch.quantityRemaining !== undefined
      ? batch.quantityRemaining
      : batch.quantity;

    return {
      ...batch,
      quantityRemaining,
    };
  };

  const selectedBatch = getSelectedBatchInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Adjust Baking Supply Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supply Info */}
          {supply && (
            <div className="p-3 rounded-md bg-muted">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{supply.supplyName}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current Quantity: <span className="font-medium">{supply.quantityRemaining}</span> {supply.unit}
              </p>
              <p className="text-sm text-muted-foreground">
                Category: <span className="font-medium">{supply.category}</span>
              </p>
            </div>
          )}

          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch">Select Batch</Label>
            <Select
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
              disabled={loadingBatches}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBatches ? "Loading batches..." : "Select a batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No batches available
                  </SelectItem>
                ) : (
                  batches.map((batch) => {
                    const quantityRemaining = batch.quantityRemaining !== undefined
                      ? batch.quantityRemaining
                      : batch.quantity;
                    return (
                      <SelectItem key={batch.id} value={batch.id!}>
                        {batch.batchId} - {quantityRemaining} {supply?.unit} remaining
                        {batch.quantityRemaining !== undefined && batch.quantityRemaining <= 0 && " (Depleted)"}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the batch you want to adjust. If no batch is selected, the adjustment will apply to the total.
            </p>
          </div>

          {/* Selected Batch Info */}
          {selectedBatch && (
            <div className="p-3 rounded-md border bg-card">
              <p className="text-sm font-medium">Selected Batch Info</p>
              <p className="text-xs text-muted-foreground mt-1">
                Batch ID: {selectedBatch.batchId}
              </p>
              <p className="text-xs text-muted-foreground">
                Current Quantity: {selectedBatch.quantityRemaining} {supply?.unit}
              </p>
              <p className="text-xs text-muted-foreground">
                Unit Price: KSh {selectedBatch.unitPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Adjustment Quantity */}
          <div className="space-y-2">
            <Label htmlFor="adjustment">Adjustment (+/-)</Label>
            <Input
              id="adjustment"
              type="number"
              placeholder="Enter adjustment (positive to add, negative to reduce)"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter a positive number to increase stock, or a negative number to decrease stock.
            </p>
            {selectedBatch && adjustmentQuantity && (
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  New quantity will be:{" "}
                  <span className="font-bold">
                    {Math.max(0, selectedBatch.quantityRemaining + (Number(adjustmentQuantity) || 0))}
                  </span>{" "}
                  {supply?.unit}
                </p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              type="text"
              placeholder="e.g., Damaged goods, Data correction, Inventory count, etc."
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
            />
          </div>

          {/* Warning for negative adjustment */}
          {selectedBatch && adjustmentQuantity && Number(adjustmentQuantity) < 0 && (
            <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <p className="font-medium">Warning: Reducing Stock</p>
                  <p className="text-xs mt-1">
                    You are reducing the stock by {Math.abs(Number(adjustmentQuantity))} {supply?.unit}.
                    Please ensure this is intentional.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setAdjustmentQuantity("");
              setAdjustmentReason("");
              setSelectedBatchId("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedBatchId || !adjustmentQuantity || loadingBatches}
          >
            {loading ? "Adjusting..." : "Adjust Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
