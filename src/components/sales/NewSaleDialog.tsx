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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getProducts, updateProduct } from "@/services/productService";
import { Product } from "@/types/product";
import { addSale } from "@/services/salesService";
import { getInventory } from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";
import { getBakingSuppliesForSale, BakingSupplyForSale } from "@/services/bakingSupplyPurchaseService";
import { Search, Calendar, AlertCircle, Package, TrendingDown, Clock, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";

interface FinishedProductData {
  batchId: string;
  itemName: string;
  itemsAvailable: number;
  unitPrice: number;
  supplier: string;
}

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleAdded: () => void;
  finishedProductData?: FinishedProductData | null;
}

export default function NewSaleDialog({
  isOpen,
  onClose,
  onSaleAdded,
  finishedProductData,
}: NewSaleDialogProps) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Baking supplies state
  const [bakingSupplies, setBakingSupplies] = useState<BakingSupplyForSale[]>([]);
  const [filteredBakingSupplies, setFilteredBakingSupplies] = useState<BakingSupplyForSale[]>([]);
  const [itemType, setItemType] = useState<"product" | "bakingSupply">("product");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    itemName: "",
    items: "1",
    totalAmount: "",
    payment: "Cash" as "Cash" | "M-Pesa" | "Card" | "Bank Transfer",
    status: "completed" as "completed" | "pending" | "cancelled",
    customer: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBakingSupply, setSelectedBakingSupply] = useState<BakingSupplyForSale | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get stock for a product
  const getStockForProduct = (productName: string): number => {
    const inventoryItem = inventory.find(item => item.name === productName);
    return inventoryItem?.stock ?? 0;
  };

  // Helper function to get stock for a baking supply
  const getStockForBakingSupply = (supplyName: string): number => {
    const supply = bakingSupplies.find(s => s.supplyName === supplyName);
    return supply?.quantityAvailable ?? 0;
  };

  // Check if stock is low
  const isLowStock = (productName: string): boolean => {
    return getStockForProduct(productName) < lowStockThreshold;
  };

  // Check if there's enough stock for the requested quantity
  const hasEnoughStock = (productName: string, quantity: number): boolean => {
    return getStockForProduct(productName) >= quantity;
  };

  // Check if baking supply stock is low
  const isBakingSupplyLowStock = (supplyName: string): boolean => {
    const supply = bakingSupplies.find(s => s.supplyName === supplyName);
    return supply ? supply.status === "low_stock" : false;
  };

  // Check if there's enough baking supply stock
  const hasEnoughBakingSupplyStock = (supplyName: string, quantity: number): boolean => {
    return getStockForBakingSupply(supplyName) >= quantity;
  };

  // Calculate remaining stock after sale
  const getRemainingStock = (productName: string, quantity: number): number => {
    const currentStock = getStockForProduct(productName);
    return Math.max(0, currentStock - quantity);
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

  // Fetch products and inventory on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsList, inventoryList, bakingSuppliesList] = await Promise.all([
          getProducts(),
          getInventory(),
          getBakingSuppliesForSale(),
        ]);
        setProducts(productsList);
        setFilteredProducts(productsList);
        setInventory(inventoryList);
        setBakingSupplies(bakingSuppliesList);
        setFilteredBakingSupplies(bakingSuppliesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Refresh inventory when dialog opens
  useEffect(() => {
    const refreshInventory = async () => {
      try {
        const inventoryList = await getInventory();
        setInventory(inventoryList);
      } catch (error) {
        console.error("Error refreshing inventory:", error);
      }
    };
    if (isOpen) {
      refreshInventory();
    }
  }, [isOpen]);

  // Handle finished product data from FinishedProducts page
  useEffect(() => {
    if (finishedProductData && isOpen) {
      setFormData((prev) => ({
        ...prev,
        itemName: finishedProductData.itemName,
        items: "1",
        totalAmount: finishedProductData.unitPrice.toString(),
      }));
      setSearchQuery(finishedProductData.itemName);
      // Create a temporary product object for the finished product
      const tempProduct: Product = {
        id: finishedProductData.batchId,
        name: finishedProductData.itemName,
        salePrice: finishedProductData.unitPrice,
        category: "Finished Product",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSelectedProduct(tempProduct);
    }
  }, [finishedProductData, isOpen]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Filter baking supplies based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBakingSupplies(bakingSupplies);
    } else {
      const filtered = bakingSupplies.filter((supply) =>
        supply.supplyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBakingSupplies(filtered);
    }
  }, [searchQuery, bakingSupplies]);

  // Auto-calculate total amount when product and quantity change
  useEffect(() => {
    if (selectedProduct && formData.items) {
      const calculatedAmount = selectedProduct.salePrice * Number(formData.items);
      setFormData((prev) => ({
        ...prev,
        totalAmount: calculatedAmount.toString(),
      }));
    } else if (selectedBakingSupply && formData.items) {
      const calculatedAmount = selectedBakingSupply.salePrice * Number(formData.items);
      setFormData((prev) => ({
        ...prev,
        totalAmount: calculatedAmount.toString(),
      }));
    }
  }, [selectedProduct, selectedBakingSupply, formData.items, formData.status]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedBakingSupply(null);
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
      items: "1",
    }));
    setSearchQuery(product.name);
    setShowDropdown(false);
  };

  const handleBakingSupplySelect = (supply: BakingSupplyForSale) => {
    setSelectedBakingSupply(supply);
    setSelectedProduct(null);
    setFormData((prev) => ({
      ...prev,
      itemName: supply.supplyName,
      items: "1",
      totalAmount: supply.salePrice.toString(),
    }));
    setSearchQuery(supply.supplyName);
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
      // Stock validation for completed sales
      if (itemType === "product") {
        if (formData.status === "completed" && !hasEnoughStock(formData.itemName, Number(formData.items))) {
          const currentStock = getStockForProduct(formData.itemName);
          toast({
            variant: "destructive",
            title: "Insufficient Stock",
            description: `Available: ${currentStock}, Requested: ${formData.items}. Please restock before completing this sale.`,
          });
          setLoading(false);
          return;
        }
      } else if (itemType === "bakingSupply") {
        if (formData.status === "completed" && !hasEnoughBakingSupplyStock(formData.itemName, Number(formData.items))) {
          const currentStock = getStockForBakingSupply(formData.itemName);
          toast({
            variant: "destructive",
            title: "Insufficient Stock",
            description: `Available: ${currentStock}, Requested: ${formData.items}. Please restock before completing this sale.`,
          });
          setLoading(false);
          return;
        }
      }

      // Add the sale
      const saleData: any = {
        date: new Date(formData.date),
        time: formData.time,
        itemName: formData.itemName,
        items: Number(formData.items),
        totalAmount: Number(formData.totalAmount),
        payment: formData.payment,
        status: formData.status,
        itemType: itemType, // "product" or "bakingSupply"
        createdAt: new Date(),
      };
      
      // Only include customer field if it has a value
      if (formData.customer && formData.customer.trim() !== "") {
        saleData.customer = formData.customer;
      }
      
      await addSale(saleData);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        itemName: "",
        items: "1",
        totalAmount: "",
        payment: "Cash",
        status: "completed",
        customer: "",
      });
      setSelectedProduct(null);
      setSelectedBakingSupply(null);
      setSearchQuery("");
      setShowDropdown(false);
      setItemType("product");

      onClose();
      onSaleAdded();
    } catch (error: any) {
      console.error("Error adding sale:", error);
      toast({
        variant: "destructive",
        title: "Error Adding Sale",
        description: error.message || "Failed to add sale. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-9"
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Product Name with Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="itemName">Item Name</Label>
            
            {/* Item Type Toggle */}
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={itemType === "product" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setItemType("product");
                  setSelectedBakingSupply(null);
                  setSearchQuery("");
                  setFormData((prev) => ({ ...prev, itemName: "", totalAmount: "" }));
                }}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-1" />
                Finished Products
              </Button>
              <Button
                type="button"
                variant={itemType === "bakingSupply" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setItemType("bakingSupply");
                  setSelectedProduct(null);
                  setSearchQuery("");
                  setFormData((prev) => ({ ...prev, itemName: "", totalAmount: "" }));
                }}
                className="flex-1"
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Baking Supplies
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="itemName"
                name="itemName"
                type="text"
                placeholder={itemType === "product" ? "Search product..." : "Search baking supply..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
                autoComplete="off"
                required
              />
            </div>

            {/* Product/Baking Supply Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="border rounded-md max-h-48 overflow-y-auto bg-background z-[100] shadow-lg absolute w-full"
              >
                {itemType === "product" ? (
                  filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const stock = getStockForProduct(product.name);
                      const lowStock = isLowStock(product.name);
                      return (
                        <div
                          key={product.id}
                          className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            handleProductSelect(product);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.category} • KSh {(product.salePrice ?? 0).toLocaleString()}
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
                      No products found
                    </div>
                  )
                ) : (
                  filteredBakingSupplies.length > 0 ? (
                    filteredBakingSupplies.map((supply) => {
                      const stock = getStockForBakingSupply(supply.supplyName);
                      const lowStock = isBakingSupplyLowStock(supply.supplyName);
                      return (
                        <div
                          key={supply.supplyName}
                          className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            handleBakingSupplySelect(supply);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{supply.supplyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {supply.category} • KSh {supply.salePrice.toLocaleString()}/{supply.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="flex items-center gap-1 text-sm">
                              <Package className="h-3 w-3" />
                              <span className={lowStock ? "text-orange-500 font-medium" : ""}>
                                {stock} {supply.unit}
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
                      No baking supplies available for sale
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Stock Warning */}
          {(selectedProduct || selectedBakingSupply) && formData.status === "completed" && (
            <div className={`p-3 rounded-md border ${
              (selectedProduct && isLowStock(selectedProduct.name)) || (selectedBakingSupply && isBakingSupplyLowStock(selectedBakingSupply.supplyName))
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`h-4 w-4 mt-0.5 ${
                  (selectedProduct && isLowStock(selectedProduct.name)) || (selectedBakingSupply && isBakingSupplyLowStock(selectedBakingSupply.supplyName))
                    ? "text-orange-500" : "text-blue-500"
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    (selectedProduct && isLowStock(selectedProduct.name)) || (selectedBakingSupply && isBakingSupplyLowStock(selectedBakingSupply.supplyName))
                      ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"
                  }`}>
                    Stock Information
                  </p>
                  {selectedProduct && (
                    <>
                      <p className={`text-xs mt-1 ${
                        selectedProduct && isLowStock(selectedProduct.name)
                          ? "text-orange-600 dark:text-orange-500" : "text-blue-600 dark:text-blue-500"
                      }`}>
                        Available Stock: <span className="font-semibold">{getStockForProduct(selectedProduct.name)}</span> units
                      </p>
                      <p className={`text-xs mt-1 ${
                        selectedProduct && isLowStock(selectedProduct.name)
                          ? "text-orange-600 dark:text-orange-500" : "text-blue-600 dark:text-blue-500"
                      }`}>
                        Stock After Sale: <span className="font-semibold">{getRemainingStock(selectedProduct.name, Number(formData.items))}</span> units
                      </p>
                      {isLowStock(selectedProduct.name) && (
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                          ⚠️ Low stock warning! Consider restocking soon.
                        </p>
                      )}
                      {!hasEnoughStock(selectedProduct.name, Number(formData.items)) && (
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1 font-medium">
                          ⚠️ Insufficient stock for requested quantity!
                        </p>
                      )}
                    </>
                  )}
                  {selectedBakingSupply && (
                    <>
                      <p className={`text-xs mt-1 ${
                        selectedBakingSupply && isBakingSupplyLowStock(selectedBakingSupply.supplyName)
                          ? "text-orange-600 dark:text-orange-500" : "text-blue-600 dark:text-blue-500"
                      }`}>
                        Available Stock: <span className="font-semibold">{getStockForBakingSupply(selectedBakingSupply.supplyName)}</span> {selectedBakingSupply.unit}
                      </p>
                      <p className={`text-xs mt-1 ${
                        selectedBakingSupply && isBakingSupplyLowStock(selectedBakingSupply.supplyName)
                          ? "text-orange-600 dark:text-orange-500" : "text-blue-600 dark:text-blue-500"
                      }`}>
                        Stock After Sale: <span className="font-semibold">{Math.max(0, getStockForBakingSupply(selectedBakingSupply.supplyName) - Number(formData.items))}</span> {selectedBakingSupply.unit}
                      </p>
                      {isBakingSupplyLowStock(selectedBakingSupply.supplyName) && (
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                          ⚠️ Low stock warning! Consider restocking soon.
                        </p>
                      )}
                      {!hasEnoughBakingSupplyStock(selectedBakingSupply.supplyName, Number(formData.items)) && (
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1 font-medium">
                          ⚠️ Insufficient stock for requested quantity!
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items (Quantity) */}
          <div className="space-y-2">
            <Label htmlFor="items">Items (Quantity)</Label>
            <Input
              id="items"
              name="items"
              type="number"
              min="1"
              value={formData.items}
              onChange={handleInputChange}
              autoComplete="off"
              required
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (KSh)</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount}
              onChange={handleInputChange}
              autoComplete="off"
              required
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated: {selectedProduct.salePrice ?? 0} × {formData.items} = KSh{" "}
                {((selectedProduct.salePrice ?? 0) * Number(formData.items)).toLocaleString()}
              </p>
            )}
          </div>

          {/* Estimated COGS and Gross Profit */}
          {selectedProduct && (
            <div className="p-3 rounded-md border bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Estimated Profit Analysis
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    *COGS and Gross Profit will be calculated based on FIFO inventory after the sale is created
                  </p>
                  <div className="text-xs mt-2 space-y-1 text-blue-600 dark:text-blue-500">
                    <div className="flex justify-between">
                      <span>Estimated Revenue:</span>
                      <span className="font-semibold">KSh {Number(formData.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-semibold">{formData.items} units</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select
              value={formData.payment}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, payment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Note: Stock is only reduced for completed sales
            </p>
          </div>

          {/* Customer (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer (Optional)</Label>
            <Input
              id="customer"
              name="customer"
              type="text"
              placeholder="Enter customer name"
              value={formData.customer}
              onChange={handleInputChange}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
