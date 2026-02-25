import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBatchesBySupplyName } from "@/services/bakingSupplyPurchaseService";
import { BakingSupplyPurchase } from "@/types/bakingSupplyPurchase";
import { Hash, Calendar, Package, DollarSign, AlertCircle, Clock, Tag } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface BakingSupplyBatchDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplyName: string;
}

export default function BakingSupplyBatchDetailsDialog({
  isOpen,
  onClose,
  supplyName,
}: BakingSupplyBatchDetailsDialogProps) {
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  const [batches, setBatches] = useState<BakingSupplyPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch batches when dialog opens or supply name changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (isOpen && supplyName) {
        setLoading(true);
        try {
          console.log("Fetching batches for baking supply:", JSON.stringify(supplyName));
          const batchesList = await getBatchesBySupplyName(supplyName);
          console.log("Fetched batches:", batchesList.length, batchesList);
          setBatches(batchesList);
        } catch (error) {
          console.error("Error fetching baking supply batches:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBatches();
  }, [isOpen, supplyName]);

  // Calculate total quantity across all batches
  const totalQuantity = batches.reduce((sum, batch) => sum + (batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity), 0);
  const totalBatches = batches.length;
  const unit = batches.length > 0 ? batches[0].unit : "units";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Baking Supply Batch Details - {supplyName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading batch details...</p>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No batches found for this baking supply
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Batches</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalBatches}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Total Quantity</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalQuantity} {unit}</p>
              </div>
            </div>

            {/* Batches List */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Batch Breakdown
              </h3>
              {batches.map((batch, index) => {
                const quantityRemaining = batch.quantityRemaining !== undefined ? batch.quantityRemaining : batch.quantity;
                const isDepleted = quantityRemaining === 0;
                const isLowStock = quantityRemaining > 0 && quantityRemaining < lowStockThreshold;

                // Calculate time until deletion for depleted batches
                const getTimeUntilDeletion = () => {
                  if (!isDepleted || !batch.depletedAt) return null;
                  const now = Date.now();
                  const depletedAtTime = batch.depletedAt instanceof Date 
                    ? batch.depletedAt.getTime() 
                    : new Date(batch.depletedAt).getTime();
                  const hoursInMs = 168 * 60 * 60 * 1000; // 168 hours in milliseconds
                  const timeUntilDeletion = depletedAtTime + hoursInMs - now;
                  
                  if (timeUntilDeletion <= 0) return null;
                  
                  const days = Math.floor(timeUntilDeletion / (24 * 60 * 60 * 1000));
                  const hours = Math.floor((timeUntilDeletion % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                  
                  if (days > 0) {
                    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
                  }
                  return `${hours} hour${hours > 1 ? 's' : ''}`;
                };

                const timeUntilDeletion = getTimeUntilDeletion();

                return (
                  <div
                    key={batch.id}
                    className={`border rounded-lg p-4 ${
                      isDepleted
                        ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        : isLowStock
                        ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{batch.batchId}</span>
                        <Badge
                          variant={
                            isDepleted
                              ? "secondary"
                              : isLowStock
                              ? "outline"
                              : "default"
                          }
                          className={
                            isDepleted
                              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              : isLowStock
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {isDepleted ? "Depleted" : isLowStock ? "Low Stock" : "Available"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">Batch #{index + 1}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {batch.date instanceof Date
                            ? batch.date.toLocaleDateString()
                            : new Date(batch.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{batch.time || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">
                          {quantityRemaining} / {batch.quantity} {batch.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span className="font-medium">KSh {batch.unitPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="font-medium">KSh {batch.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Purpose:</span>
                        <Badge variant="outline" className="text-xs">
                          {batch.purpose}
                        </Badge>
                      </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium">{batch.supplier}</span>
                      </div>
                    </div>

                    {/* Depletion Warning */}
                    {isDepleted && timeUntilDeletion && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Will be hidden in {timeUntilDeletion}</span>
                        </div>
                      </div>
                    )}

                    {/* Low Stock Warning */}
                    {isLowStock && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Low stock warning: Only {quantityRemaining} {batch.unit} remaining</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
