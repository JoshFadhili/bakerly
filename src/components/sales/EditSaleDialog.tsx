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
import { getProducts, updateProduct } from "@/services/productService";
import { Product } from "@/types/product";
import { updateSale } from "@/services/salesService";
import { Sale } from "@/types/sale";
import { getInventory } from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";
import { getBakingSuppliesForSale, BakingSupplyForSale } from "@/services/bakingSupplyPurchaseService";
import { Search, Calendar, AlertCircle, Info, Package, TrendingDown, ArrowUpDown, Clock, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";

interface EditSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleUpdated: () => void;
  sale: Sale | null;
}

export default function EditSaleDialog({
  isOpen,
  onClose,
  onSaleUpdated,
  sale,
}: EditSaleDialogProps) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [bakingSupplies, setBakingSupplies] = useState<BakingSupplyForSale[]>([]);
  const [filteredBakingSupplies, setFilteredBakingSupplies] = useState<BakingSupplyForSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [itemType, setItemType] = useState<"product" | "bakingSupply">("product");

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    itemName: "",
    items: "1",
    totalAmount: "",
    payment: "Cash" as "Cash" | "M-Pesa" | "Card" | "Bank Transfer",
    status: "completed" as "completed" | "pending" | "cancelled",
    customer: "",
    itemType: "product" as "product" | "bakingSupply",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBakingSupply, setSelectedBakingSupply] = useState<BakingSupplyForSale | null>(null);
  const [originalStatus, setOriginalStatus] = useState<"completed" | "pending" | "cancelled">("completed");
  const [originalQuantity, setOriginalQuantity] = useState(0);
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

  // Check if stock is low for product
  const isLowStock = (productName: string): boolean => {
    return getStockForProduct(productName) < lowStockThreshold;
  };

  // Check if baking supply stock is low
  const isBakingSupplyLowStock = (supplyName: string): boolean => {
    const supply = bakingSupplies.find(s => s.supplyName === supplyName);
    return supply ? supply.status === "low_stock" : false;
  };

  // Check if there's enough stock for the requested quantity (product)
  const hasEnoughStock = (productName: string, quantity: number): boolean => {
    return getStockForProduct(productName) >= quantity;
  };

  // Check if there's enough baking supply stock
  const hasEnoughBakingSupplyStock = (supplyName: string, quantity: number): boolean => {
    return getStockForBakingSupply(supplyName) >= quantity;
  };

  // Get current stock based on item type
  const getCurrentStock = (): number => {
    if (itemType === "bakingSupply") {
      return getStockForBakingSupply(formData.itemName);
    }
    return getStockForProduct(formData.itemName);
  };

  // Calculate remaining stock after sale
  const getRemainingStock = (productName: string, quantity: number): number => {
    const currentStock = getStockForProduct(productName);
    return Math.max(0, currentStock - quantity);
  };

  // Calculate stock change based on status and quantity changes
  const calculateStockChange = (): number => {
    if (!selectedProduct) return 0;

    const currentStock = getCurrentStock();
    const newQuantity = Number(formData.items);
    const newStatus = formData.status;

    // If original status was completed, stock was already reduced
    let stockAfterOriginal = currentStock;
    if (originalStatus === "completed") {
      stockAfterOriginal = currentStock + originalQuantity; // Add back original quantity
    }

    // Calculate new stock after changes
    let newStock = stockAfterOriginal;
    if (newStatus === "completed") {
      newStock = stockAfterOriginal - newQuantity;
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

  // Refresh data when dialog opens
  useEffect(() => {
    const refreshData = async () => {
      try {
        const [inventoryList, bakingSuppliesList] = await Promise.all([
          getInventory(),
          getBakingSuppliesForSale(),
        ]);
        setInventory(inventoryList);
        setBakingSupplies(bakingSuppliesList);
        setFilteredBakingSupplies(bakingSuppliesList);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  // Initialize form with sale data when sale changes
  useEffect(() => {
    if (sale) {
      const dateStr = sale.date instanceof Date 
        ? sale.date.toISOString().split('T')[0]
        : new Date(sale.date).toISOString().split('T')[0];
      
      const saleItemType = sale.itemType || "product";
      
      setFormData({
        date: dateStr,
        time: sale.time || "",
        itemName: sale.itemName,
        items: sale.items.toString(),
        totalAmount: sale.totalAmount.toString(),
        payment: sale.payment,
        status: sale.status,
        customer: sale.customer || "",
        itemType: saleItemType,
      });
      
      setItemType(saleItemType);
      setOriginalStatus(sale.status);
      setOriginalQuantity(sale.items);
      setSearchQuery(sale.itemName);
      
      // Find the product or baking supply
      if (saleItemType === "bakingSupply") {
        const supply = bakingSupplies.find(s => s.supplyName === sale.itemName);
        if (supply) {
          setSelectedBakingSupply(supply);
          setSelectedProduct(null);
        }
      } else {
        const product = products.find(p => p.name === sale.itemName);
        if (product) {
          setSelectedProduct(product);
          setSelectedBakingSupply(null);
        }
      }
    }
  }, [sale, products, bakingSupplies]);

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
    }
  }, [selectedProduct, formData.items, formData.status, originalQuantity]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedBakingSupply(null);
    setItemType("product");
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
      itemType: "product",
    }));
    setSearchQuery(product.name);
    setShowDropdown(false);
  };

  const handleBakingSupplySelect = (supply: BakingSupplyForSale) => {
    setSelectedBakingSupply(supply);
    setSelectedProduct(null);
    setItemType("bakingSupply");
    setFormData((prev) => ({
      ...prev,
      itemName: supply.supplyName,
      itemType: "bakingSupply",
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
      if (!sale || !sale.id) {
        throw new Error("Sale ID is required");
      }

      // Stock validation for completed sales
      if (itemType === "product") {
        if (formData.status === "completed" && !hasEnoughStock(formData.itemName, Number(formData.items))) {
          const currentStock = getCurrentStock();
          const adjustedStock = originalStatus === "completed" ? currentStock + originalQuantity : currentStock;
          if (adjustedStock < Number(formData.items)) {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Available after reversal: ${adjustedStock}, Requested: ${formData.items}. Please restock before completing this sale.`,
            });
            setLoading(false);
            return;
          }
        }
      } else if (itemType === "bakingSupply") {
        if (formData.status === "completed" && !hasEnoughBakingSupplyStock(formData.itemName, Number(formData.items))) {
          const currentStock = getCurrentStock();
          const adjustedStock = originalStatus === "completed" ? currentStock + originalQuantity : currentStock;
          if (adjustedStock < Number(formData.items)) {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Available after reversal: ${adjustedStock}, Requested: ${formData.items}. Please restock before completing this sale.`,
            });
            setLoading(false);
            return;
          }
        }
      }

      // Update the sale
      const updateData: any = {
        date: new Date(formData.date),
        time: formData.time,
        itemName: formData.itemName,
        items: Number(formData.items),
        totalAmount: Number(formData.totalAmount),
        payment: formData.payment,
        status: formData.status,
      };
      
      // Only include customer field if it has a value
      if (formData.customer && formData.customer.trim() !== "") {
        updateData.customer = formData.customer;
      }
      
      await updateSale(sale.id, updateData, sale);

      onClose();
      onSaleUpdated();
    } catch (error: any) {
      console.error("Error updating sale:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Sale",
        description: error.message || "Failed to update sale. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
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
                  setFormData((prev) => ({ ...prev, itemName: "", totalAmount: "", itemType: "product" }));
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
                  setFormData((prev) => ({ ...prev, itemName: "", totalAmount: "", itemType: "bakingSupply" }));
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
                          onClick={() => handleProductSelect(product)}
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
                          onClick={() => handleBakingSupplySelect(supply)}
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

          {/* Stock Change Info */}
          {(selectedProduct || selectedBakingSupply) && (originalStatus !== formData.status || originalQuantity !== Number(formData.items)) && (
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
                      <span>New Quantity: <span className="font-semibold">{formData.items}</span></span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-semibold">
                        Stock Change: {calculateStockChange() > 0 ? '+' : ''}{calculateStockChange()} units
                      </span>
                    </div>
                  </div>
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
              required
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated: {selectedProduct.salePrice ?? 0} × {formData.items} = KSh{" "}
                {((selectedProduct.salePrice ?? 0) * Number(formData.items)).toLocaleString()}
              </p>
            )}
          </div>

          {/* COGS and Gross Profit Display */}
          {sale && (sale.cogs !== undefined || sale.grossProfit !== undefined) && (
            <div className="p-3 rounded-md border bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 mt-0.5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Profit Analysis
                  </p>
                  <div className="text-xs mt-1 space-y-1 text-green-600 dark:text-green-500">
                    {sale.cogs !== undefined && (
                      <div className="flex justify-between">
                        <span>COGS:</span>
                        <span className="font-semibold">KSh {sale.cogs.toLocaleString()}</span>
                      </div>
                    )}
                    {sale.grossProfit !== undefined && (
                      <div className="flex justify-between">
                        <span>Gross Profit:</span>
                        <span className={`font-semibold ${sale.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          KSh {sale.grossProfit.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {sale.grossProfit !== undefined && sale.totalAmount > 0 && (
                      <div className="flex justify-between pt-1 border-t border-green-200 dark:border-green-800">
                        <span>Profit Margin:</span>
                        <span className={`font-semibold ${sale.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {((sale.grossProfit / sale.totalAmount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
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
              Original status: {originalStatus}
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
              {loading ? "Updating..." : "Update Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
