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
import { getBatchesByProductName, deleteOldDepletedBatches } from "@/services/purchaseService";
import { Purchase } from "@/types/purchase";
import { Hash, Calendar, Package, DollarSign, AlertCircle, Clock } from "lucide-react";

interface BatchDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function BatchDetailsDialog({
  isOpen,
  onClose,
  productName,
}: BatchDetailsDialogProps) {
  const [batches, setBatches] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch batches when dialog opens or product name changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (isOpen && productName) {
        setLoading(true);
        try {
          // Clean up old depleted batches before fetching
          try {
            await deleteOldDepletedBatches();
          } catch (cleanupError) {
            console.warn("Failed to clean up old depleted batches:", cleanupError);
            // Continue with fetching even if cleanup fails
          }

          console.log("Fetching batches for product:", JSON.stringify(productName));
          const batchesList = await getBatchesByProductName(productName);
          console.log("Fetched batches:", batchesList.length, batchesList);
          setBatches(batchesList);
        } catch (error) {
          console.error("Error fetching batches:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBatches();
  }, [isOpen, productName]);

  // Calculate total items across all batches
  const totalItems = batches.reduce((sum, batch) => sum + (batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items), 0);
  const totalBatches = batches.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Details - {productName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading batch details...</p>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No batches found for this product
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Batches</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totalBatches}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Total Items</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{totalItems}</p>
              </div>
            </div>

            {/* Batches List */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Batch Breakdown
              </h3>
              {batches.map((batch, index) => {
                const itemsRemaining = batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items;
                const isDepleted = itemsRemaining === 0;
                const isLowStock = itemsRemaining > 0 && itemsRemaining < 10;

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
                        ? "bg-gray-50 border-gray-200"
                        : isLowStock
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-white border-gray-200"
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
                              ? "bg-gray-200 text-gray-700"
                              : isLowStock
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-green-100 text-green-700"
                          }
                        >
                          {isDepleted
                            ? "Depleted"
                            : isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Batch #{index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {batch.date instanceof Date
                              ? batch.date.toLocaleDateString()
                              : new Date(batch.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-medium">
                            {batch.items} total
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className={`font-medium ${
                            isDepleted ? "text-gray-600" : isLowStock ? "text-yellow-600" : "text-green-600"
                          }`}>
                            {itemsRemaining} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Unit Price</p>
                          <p className="font-medium">
                            KSh {batch.itemPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Total Cost</p>
                          <p className="font-medium">
                            KSh {batch.totalCost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 text-muted-foreground">📦</span>
                        <div>
                          <p className="text-muted-foreground">Supplier</p>
                          <p className="font-medium">{batch.supplier}</p>
                        </div>
                      </div>
                    </div>

                    {isDepleted && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>This batch has been fully sold</span>
                        </div>
                        {timeUntilDeletion && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span>Will be deleted in {timeUntilDeletion}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FIFO Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">FIFO (First In, First Out)</p>
                  <p>
                    When sales are made, items are automatically deducted from the oldest batch first.
                    This ensures that inventory from earlier purchases is sold before newer stock.
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-Deletion Info */}
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Automatic Batch Cleanup</p>
                  <p>
                    Depleted batches (with 0 items remaining) are automatically deleted from this view after 168 hours (1 week).
                    This helps keep your batch records clean and focused on active inventory.
                  </p>
                </div>
              </div>
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
