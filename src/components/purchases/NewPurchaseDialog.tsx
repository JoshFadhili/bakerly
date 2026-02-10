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
import { addPurchase } from "@/services/purchaseService";
import { Search, Calendar, AlertCircle, Info } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [stockInfo, setStockInfo] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemName: "",
    supplier: "",
    items: "1",
    itemPrice: "",
    totalCost: "",
    status: "received" as "received" | "pending" | "cancelled",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsList = await getProducts();
        setProducts(productsList);
        setFilteredProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
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

      // Check stock info for inventory alignment
      if (selectedProduct && formData.status === "received") {
        const currentStock = selectedProduct.stock;
        const itemsToAdd = Number(formData.items);
        const newStock = currentStock + itemsToAdd;
        
        setStockInfo(
          `Current stock: ${currentStock} → New stock: ${newStock} (+${itemsToAdd})`
        );
      } else {
        setStockInfo("");
      }
    }
  }, [formData.itemPrice, formData.items, formData.status, selectedProduct]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
      itemPrice: (product.averageCost ?? 0).toString(), // Use average cost from purchases
    }));
    setSearchQuery(product.name);
    setShowDropdown(false);
    setStockInfo("");
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
        date: new Date(formData.date),
        itemName: formData.itemName,
        supplier: formData.supplier,
        items: Number(formData.items),
        itemPrice: Number(formData.itemPrice),
        totalCost: Number(formData.totalCost),
        status: formData.status,
        createdAt: new Date(),
      });

      // Update product stock if purchase is received
      if (selectedProduct && formData.status === "received") {
        const currentStock = selectedProduct.stock;
        const itemsToAdd = Number(formData.items);
        const newStock = currentStock + itemsToAdd;
        const newStatus = newStock <= 10 ? "low_stock" : "active";

        // Calculate new average cost
        const currentTotalCost = selectedProduct.averageCost * currentStock;
        const newTotalCost = Number(formData.totalCost) + currentTotalCost;
        const newAverageCost = newTotalCost / newStock;

        await updateProduct(selectedProduct.id!, {
          stock: newStock,
          averageCost: newAverageCost,
          status: newStatus,
        });
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        itemName: "",
        supplier: "",
        items: "1",
        itemPrice: "",
        totalCost: "",
        status: "received",
      });
      setSelectedProduct(null);
      setSearchQuery("");
      setShowDropdown(false);
      setStockInfo("");

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
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.category} • Avg Cost: KSh {(product.averageCost ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            )}
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
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Current stock: {selectedProduct.stock}
              </p>
            )}
          </div>

          {/* Stock Info */}
          {stockInfo && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{stockInfo}</p>
            </div>
          )}

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
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Using average cost from purchases: KSh {(selectedProduct.averageCost ?? 0).toLocaleString()}
              </p>
            )}
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
