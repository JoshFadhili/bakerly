/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from "react";
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
import { getBakingSupplies, updateBakingSupply } from "@/services/bakingSupplyService";
import { BakingSupply } from "@/types/bakingSupply";
import { updateBakingSupplyPurchase } from "@/services/bakingSupplyPurchaseService";
import { BakingSupplyPurchase } from "@/types/bakingSupplyPurchase";
import { Search, Calendar, Info, Hash, Package, TrendingDown, ArrowUpDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EditBakingSupplyPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseUpdated: () => void;
  purchase: BakingSupplyPurchase | null;
}

// Common measurement units
const MEASUREMENT_UNITS = [
  "kg",
  "grams",
  "Litres",
  "ml",
  "pieces",
  "packs",
  "boxes",
  "bags",
  "bottles",
  "cans",
];

export default function EditBakingSupplyPurchaseDialog({
  isOpen,
  onClose,
  onPurchaseUpdated,
  purchase,
}: EditBakingSupplyPurchaseDialogProps) {
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  const [bakingSupplies, setBakingSupplies] = useState<BakingSupply[]>([]);
  const [filteredSupplies, setFilteredSupplies] = useState<BakingSupply[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    batchId: "",
    date: "",
    time: "",
    supplyName: "",
    category: "",
    supplier: "",
    quantity: "1",
    unit: "kg",
    unitPrice: "",
    totalCost: "",
    purpose: "production" as "resale" | "production" | "both",
    status: "received" as "received" | "pending" | "cancelled",
  });

  const [selectedSupply, setSelectedSupply] = useState<BakingSupply | null>(null);
  const [originalStatus, setOriginalStatus] = useState<"received" | "pending" | "cancelled">("received");
  const [originalQuantity, setOriginalQuantity] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get stock for a supply
  const getStockForSupply = (supplyName: string): number => {
    const supply = bakingSupplies.find(s => s.name === supplyName);
    return supply?.quantity ?? 0;
  };

  // Check if stock is low
  const isLowStock = (supplyName: string): boolean => {
    const supply = bakingSupplies.find(s => s.name === supplyName);
    if (!supply) return false;
    return supply.quantity < lowStockThreshold || supply.status === "low_stock" || supply.status === "out_of_stock";
  };

  // Calculate stock change based on status and quantity changes
  const calculateStockChange = (): number => {
    if (!selectedSupply) return 0;

    const currentStock = getStockForSupply(selectedSupply.name);
    const newQuantity = Number(formData.quantity);
    const newStatus = formData.status;

    // If original status was received, stock was already added
    let stockAfterOriginal = currentStock;
    if (originalStatus === "received") {
      stockAfterOriginal = currentStock - originalQuantity; // Remove original quantity
    }

    // Calculate new stock after changes
    let newStock = stockAfterOriginal;
    if (newStatus === "received") {
      newStock = stockAfterOriginal + newQuantity;
    }

    return newStock - currentStock;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch baking supplies on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliesList = await getBakingSupplies();
        setBakingSupplies(suppliesList);
        setFilteredSupplies(suppliesList);
      } catch (error) {
        console.error("Error fetching baking supplies:", error);
      }
    };
    fetchData();
  }, []);

  // Initialize form with purchase data when purchase changes
  useEffect(() => {
    if (purchase) {
      const dateStr = purchase.date instanceof Date
        ? purchase.date.toISOString().split('T')[0]
        : new Date(purchase.date).toISOString().split('T')[0];

      setFormData({
        batchId: purchase.batchId || "",
        date: dateStr,
        time: purchase.time || "",
        supplyName: purchase.supplyName,
        category: purchase.category || "",
        supplier: purchase.supplier,
        quantity: purchase.quantity.toString(),
        unit: purchase.unit || "kg",
        unitPrice: purchase.unitPrice.toString(),
        totalCost: purchase.totalCost.toString(),
        purpose: purchase.purpose || "production",
        status: purchase.status,
      });

      setOriginalStatus(purchase.status);
      setOriginalQuantity(purchase.quantity);
      setSearchQuery(purchase.supplyName);

      // Find the supply
      const supply = bakingSupplies.find(s => s.name === purchase.supplyName);
      if (supply) {
        setSelectedSupply(supply);
      }
    }
  }, [purchase, bakingSupplies]);

  // Filter supplies based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSupplies(bakingSupplies);
    } else {
      const filtered = bakingSupplies.filter((supply) =>
        supply.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSupplies(filtered);
    }
  }, [searchQuery, bakingSupplies]);

  // Auto-calculate total cost when unit price and quantity change
  useEffect(() => {
    if (formData.unitPrice && formData.quantity) {
      const calculatedCost = Number(formData.unitPrice) * Number(formData.quantity);
      setFormData((prev) => ({
        ...prev,
        totalCost: calculatedCost.toString(),
      }));
    }
  }, [formData.unitPrice, formData.quantity, formData.status, originalQuantity, selectedSupply]);

  const handleSupplySelect = (supply: BakingSupply) => {
    setSelectedSupply(supply);
    setFormData((prev) => ({
      ...prev,
      supplyName: supply.name,
      category: supply.category,
      unit: supply.unit || "kg",
      unitPrice: "0", // Default to 0, user can edit
    }));
    setSearchQuery(supply.name);
    setShowDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!purchase || !purchase.id) {
        throw new Error("Purchase ID is required");
      }

      // Update baking supply purchase
      await updateBakingSupplyPurchase(purchase.id, {
        date: new Date(formData.date),
        time: formData.time,
        supplyName: formData.supplyName,
        category: formData.category,
        supplier: formData.supplier,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        unitPrice: Number(formData.unitPrice),
        totalCost: Number(formData.totalCost),
        purpose: formData.purpose,
        status: formData.status,
      });

      // Update baking supply stock if status is received
      if (selectedSupply && formData.status === "received") {
        const stockChange = calculateStockChange();
        if (stockChange !== 0) {
          const newQuantity = selectedSupply.quantity + stockChange;
          const newStatus = newQuantity <= 0 ? "out_of_stock" : 
                           newQuantity < lowStockThreshold ? "low_stock" : "in_stock";
          
          await updateBakingSupply(selectedSupply.id!, {
            quantity: Math.max(0, newQuantity),
            status: newStatus,
          });
        }
      }

      onClose();
      onPurchaseUpdated();
    } catch (error) {
      console.error("Error updating baking supply purchase:", error);
      alert("Failed to update baking supply purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Baking Supply Purchase</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch ID */}
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch ID</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="batchId"
                name="batchId"
                type="text"
                value={formData.batchId}
                onChange={handleInputChange}
                className="pl-9 bg-muted"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Unique identifier for this purchase batch
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Supply Name with Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="supplyName">Baking Supply Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="supplyName"
                name="supplyName"
                type="text"
                placeholder="Search baking supply..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
                required
              />
            </div>

            {/* Supply Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="border rounded-md max-h-48 overflow-y-auto bg-background z-[100] shadow-lg absolute w-full"
              >
                {filteredSupplies.length > 0 ? (
                  filteredSupplies.map((supply) => {
                    const stock = supply.quantity;
                    const lowStock = supply.status === "low_stock" || supply.status === "out_of_stock";
                    return (
                      <div
                        key={supply.id}
                        className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                        onClick={() => handleSupplySelect(supply)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{supply.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {supply.category} • {supply.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-3 w-3" />
                            <span className={lowStock ? "text-orange-500 font-medium" : ""}>
                              {stock}
                            </span>
                          </div>
                          {lowStock && (
                            <TrendingDown className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No baking supplies found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stock Info */}
          {selectedSupply && (
            <div className={`p-3 rounded-md border ${
              isLowStock(selectedSupply.name)
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
            }`}>
              <div className="flex items-start gap-2">
                <Info className={`h-4 w-4 mt-0.5 ${
                  isLowStock(selectedSupply.name) ? "text-orange-500" : "text-green-500"
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isLowStock(selectedSupply.name) ? "text-orange-700 dark:text-orange-400" : "text-green-700 dark:text-green-400"
                  }`}>
                    Current Stock Information
                  </p>
                  <p className={`text-xs mt-1 ${
                    isLowStock(selectedSupply.name) ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"
                  }`}>
                    Available Stock: <span className="font-semibold">{selectedSupply.quantity}</span> {selectedSupply.unit}
                  </p>
                  {isLowStock(selectedSupply.name) && (
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      ⚠️ Low stock warning! This purchase will help restock.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stock Change Info */}
          {selectedSupply && (originalStatus !== formData.status || originalQuantity !== Number(formData.quantity)) && (
            <div className="p-3 rounded-md border bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Stock Change Information
                  </p>
                  <div className="text-xs mt-1 space-y-1 text-purple-600 dark:text-purple-500">
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      <span>Original Status: <span className="font-semibold">{originalStatus}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      <span>Original Quantity: <span className="font-semibold">{originalQuantity}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      <span>New Status: <span className="font-semibold">{formData.status}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      <span>New Quantity: <span className="font-semibold">{formData.quantity}</span></span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold">
                        Stock Change: {calculateStockChange() > 0 ? '+' : ''}{calculateStockChange()} {formData.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              type="text"
              placeholder="e.g., Flour, Sugar, Eggs"
              value={formData.category}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              name="supplier"
              type="text"
              placeholder="Enter supplier name"
              value={formData.supplier}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Measurement Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Measurement Unit</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, unit: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the unit of measurement (e.g., kg, Litres)
            </p>
          </div>

          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price (KSh)</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Cost (KSh)</Label>
            <Input
              id="totalCost"
              name="totalCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalCost}
              onChange={handleInputChange}
              required
            />
            {formData.unitPrice && formData.quantity && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated: {Number(formData.unitPrice)} × {formData.quantity} = KSh{" "}
                {(Number(formData.unitPrice) * Number(formData.quantity)).toLocaleString()}
              </p>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Select
              value={formData.purpose}
              onValueChange={(value: "resale" | "production" | "both") =>
                setFormData((prev) => ({ ...prev, purpose: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resale">Resale</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="both">Both (Resale & Production)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How will this supply be used?
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "received" | "pending" | "cancelled") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Original status: {originalStatus} • Stock is only added when status is "Received"
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
