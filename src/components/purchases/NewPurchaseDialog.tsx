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
import { addPurchase, generateBatchId } from "@/services/purchaseService";
import { getInventory, syncInventoryFromPurchase } from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";
import { Search, Calendar, AlertCircle, Info, Hash, Package, TrendingDown } from "lucide-react";

interface NewPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseAdded: () => void;
}

export default function NewPurchaseDialog({
  isOpen,
  onClose,
  onPurchaseAdded,
}: NewPurchaseDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemName: "",
    supplier: "",
    items: "1",
    itemPrice: "",
    totalCost: "",
    status: "received" as "received" | "pending" | "cancelled",
    batchId: generateBatchId(),
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get stock for a product
  const getStockForProduct = (productName: string): number => {
    const inventoryItem = inventory.find(item => item.name === productName);
    return inventoryItem?.stock ?? 0;
  };

  // Check if stock is low (<= 10)
  const isLowStock = (productName: string): boolean => {
    return getStockForProduct(productName) <= 10;
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
        const [productsList, inventoryList] = await Promise.all([
          getProducts(),
          getInventory(),
        ]);
        setProducts(productsList);
        setFilteredProducts(productsList);
        setInventory(inventoryList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

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

  // Auto-calculate total cost when item price and quantity change
  useEffect(() => {
    if (formData.itemPrice && formData.items) {
      const calculatedCost = Number(formData.itemPrice) * Number(formData.items);
      setFormData((prev) => ({
        ...prev,
        totalCost: calculatedCost.toString(),
      }));
    }
  }, [formData.itemPrice, formData.items, formData.status, selectedProduct]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
      itemPrice: "0", // Default to 0, user can edit
    }));
    setSearchQuery(product.name);
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
      // Add purchase
      await addPurchase({
        batchId: formData.batchId,
        date: new Date(formData.date),
        itemName: formData.itemName,
        supplier: formData.supplier,
        items: Number(formData.items),
        itemsRemaining: Number(formData.items), // Initially, all items are remaining
        itemPrice: Number(formData.itemPrice),
        totalCost: Number(formData.totalCost),
        status: formData.status,
        createdAt: new Date(),
      });

      // Sync inventory with purchase
      await syncInventoryFromPurchase(
        formData.itemName,
        Number(formData.items),
        formData.status,
        selectedProduct?.category
      );

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        itemName: "",
        supplier: "",
        items: "1",
        itemPrice: "",
        totalCost: "",
        status: "received",
        batchId: generateBatchId(),
      });
      setSelectedProduct(null);
      setSearchQuery("");
      setShowDropdown(false);
onClose();
      onPurchaseAdded();
    } catch (error) {
      console.error("Error adding purchase:", error);
      alert("Failed to add purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase</DialogTitle>
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
              Unique identifier for this purchase batch (auto-generated)
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

          {/* Product Name with Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="itemName">Product Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="itemName"
                name="itemName"
                type="text"
                placeholder="Search product..."
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

            {/* Product Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="border rounded-md max-h-48 overflow-y-auto bg-background z-[100] shadow-lg absolute w-full"
              >
                {filteredProducts.length > 0 ? (
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
                            {product.category}
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
                )}
              </div>
            )}
          </div>

          {/* Stock Info */}
          {selectedProduct && (
            <div className={`p-3 rounded-md border ${
              isLowStock(selectedProduct.name)
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
            }`}>
              <div className="flex items-start gap-2">
                <Info className={`h-4 w-4 mt-0.5 ${
                  isLowStock(selectedProduct.name) ? "text-orange-500" : "text-green-500"
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isLowStock(selectedProduct.name) ? "text-orange-700 dark:text-orange-400" : "text-green-700 dark:text-green-400"
                  }`}>
                    Current Stock Information
                  </p>
                  <p className={`text-xs mt-1 ${
                    isLowStock(selectedProduct.name) ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"
                  }`}>
                    Available Stock: <span className="font-semibold">{getStockForProduct(selectedProduct.name)}</span> units
                  </p>
                  {isLowStock(selectedProduct.name) && (
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      ⚠️ Low stock warning! This purchase will help restock.
                    </p>
                  )}
                  {formData.status === "received" && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      ✓ Stock will increase by {formData.items} units after this purchase.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
  
          {/* Item Price */}
          <div className="space-y-2">
            <Label htmlFor="itemPrice">Item Price (KSh)</Label>
            <Input
              id="itemPrice"
              name="itemPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.itemPrice}
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
            {formData.itemPrice && formData.items && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated: {Number(formData.itemPrice)} × {formData.items} = KSh{" "}
                {(Number(formData.itemPrice) * Number(formData.items)).toLocaleString()}
              </p>
            )}
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
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Note: Stock is only added when status is "Received"
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
