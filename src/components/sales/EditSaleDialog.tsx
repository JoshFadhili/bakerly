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
import { getProducts, updateProduct } from "@/services/productService";
import { Product } from "@/types/product";
import { updateSale } from "@/services/salesService";
import { Sale } from "@/types/sale";
import { Search, Calendar, AlertCircle, Info } from "lucide-react";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [stockWarning, setStockWarning] = useState("");
  const [stockChangeInfo, setStockChangeInfo] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    itemName: "",
    items: "1",
    totalAmount: "",
    payment: "Cash" as "Cash" | "M-Pesa" | "Card" | "Bank Transfer",
    status: "completed" as "completed" | "pending" | "cancelled",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [originalStatus, setOriginalStatus] = useState<"completed" | "pending" | "cancelled">("completed");
  const [originalQuantity, setOriginalQuantity] = useState(0);

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

  // Initialize form with sale data when sale changes
  useEffect(() => {
    if (sale) {
      const dateStr = sale.date instanceof Date 
        ? sale.date.toISOString().split('T')[0]
        : new Date(sale.date).toISOString().split('T')[0];
      
      setFormData({
        date: dateStr,
        itemName: sale.itemName,
        items: sale.items.toString(),
        totalAmount: sale.totalAmount.toString(),
        payment: sale.payment,
        status: sale.status,
      });
      
      setOriginalStatus(sale.status);
      setOriginalQuantity(sale.items);
      setSearchQuery(sale.itemName);
      
      // Find the product
      const product = products.find(p => p.name === sale.itemName);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [sale, products]);

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

  // Auto-calculate total amount when product and quantity change
  useEffect(() => {
    if (selectedProduct && formData.items) {
      const calculatedAmount = selectedProduct.salePrice * Number(formData.items);
      setFormData((prev) => ({
        ...prev,
        totalAmount: calculatedAmount.toString(),
      }));

      // Calculate stock changes
      const newQuantity = Number(formData.items);
      const quantityChange = newQuantity - originalQuantity;
      
      if (formData.status === "completed") {
        if (quantityChange > 0) {
          // Selling more items than before
          const availableStock = selectedProduct.stock;
          const additionalNeeded = quantityChange;
          if (additionalNeeded > availableStock) {
            setStockWarning(
              `Warning: Only ${availableStock} additional items available in stock. You're trying to sell ${additionalNeeded} more.`
            );
            setStockChangeInfo(`Stock will be reduced by ${additionalNeeded} (from ${selectedProduct.stock} to ${selectedProduct.stock - additionalNeeded})`);
          } else {
            setStockWarning("");
            setStockChangeInfo(`Stock will be reduced by ${additionalNeeded} (from ${selectedProduct.stock} to ${selectedProduct.stock - additionalNeeded})`);
          }
        } else if (quantityChange < 0) {
          // Selling fewer items than before - restore stock
          setStockWarning("");
          setStockChangeInfo(`Stock will be increased by ${Math.abs(quantityChange)} (from ${selectedProduct.stock} to ${selectedProduct.stock + Math.abs(quantityChange)})`);
        } else {
          setStockWarning("");
          setStockChangeInfo("No change in quantity");
        }
      }
    }
  }, [selectedProduct, formData.items, formData.status, originalQuantity]);

  // Handle status change
  useEffect(() => {
    if (selectedProduct && sale) {
      const statusChanged = formData.status !== originalStatus;
      
      if (statusChanged && formData.status === "completed" && originalStatus !== "completed") {
        // Changing to completed - reduce stock
        const newQuantity = Number(formData.items);
        const availableStock = selectedProduct.stock;
        if (newQuantity > availableStock) {
          setStockWarning(
            `Warning: Only ${availableStock} items available in stock. You're trying to sell ${newQuantity}.`
          );
        } else {
          setStockWarning("");
          setStockChangeInfo(`Stock will be reduced by ${newQuantity} (from ${selectedProduct.stock} to ${selectedProduct.stock - newQuantity})`);
        }
      } else if (statusChanged && formData.status !== "completed" && originalStatus === "completed") {
        // Changing from completed - restore stock
        setStockWarning("");
        setStockChangeInfo(`Stock will be restored by ${originalQuantity} (from ${selectedProduct.stock} to ${selectedProduct.stock + originalQuantity})`);
      }
    }
  }, [formData.status, originalStatus, selectedProduct, sale]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
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
      if (!sale || !sale.id) {
        throw new Error("Sale ID is required");
      }

      // Validate stock availability for completed sales
      const newQuantity = Number(formData.items);
      const quantityChange = newQuantity - originalQuantity;
      
      if (formData.status === "completed" && selectedProduct) {
        let stockToReduce = 0;
        
        if (originalStatus !== "completed" && formData.status === "completed") {
          // First time completing - reduce by full quantity
          stockToReduce = newQuantity;
        } else if (originalStatus === "completed" && formData.status === "completed") {
          // Still completed - adjust by quantity change
          stockToReduce = quantityChange;
        }
        
        if (stockToReduce > 0 && stockToReduce > selectedProduct.stock) {
          alert(
            `Insufficient stock! Only ${selectedProduct.stock} items available. Please reduce the quantity.`
          );
          setLoading(false);
          return;
        }
      }

      // Update the sale
      await updateSale(sale.id, {
        date: new Date(formData.date),
        itemName: formData.itemName,
        items: Number(formData.items),
        totalAmount: Number(formData.totalAmount),
        payment: formData.payment,
        status: formData.status,
      });

      // Update product stock based on status and quantity changes
      if (selectedProduct) {
        let newStock = selectedProduct.stock;
        
        if (originalStatus !== "completed" && formData.status === "completed") {
          // Changing to completed - reduce stock
          newStock = selectedProduct.stock - newQuantity;
        } else if (originalStatus === "completed" && formData.status !== "completed") {
          // Changing from completed - restore stock
          newStock = selectedProduct.stock + originalQuantity;
        } else if (originalStatus === "completed" && formData.status === "completed") {
          // Still completed - adjust by quantity change
          newStock = selectedProduct.stock - quantityChange;
        }
        
        const newStatus = newStock <= 10 ? "low_stock" : "active";
        
        await updateProduct(selectedProduct.id!, {
          stock: newStock,
          status: newStatus,
        });
      }

      onClose();
      onSaleUpdated();
    } catch (error) {
      console.error("Error updating sale:", error);
      alert("Failed to update sale. Please try again.");
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

          {/* Product Name with Search */}
          <div className="space-y-2">
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
            {showDropdown && filteredProducts.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto bg-background z-10">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.category} • KSh {product.salePrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {product.stock}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                Available stock: {selectedProduct.stock} | Original quantity: {originalQuantity}
              </p>
            )}
          </div>

          {/* Stock Change Info */}
          {stockChangeInfo && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{stockChangeInfo}</p>
            </div>
          )}

          {/* Stock Warning */}
          {stockWarning && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{stockWarning}</p>
            </div>
          )}

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
                Auto-calculated: {selectedProduct.salePrice} × {formData.items} = KSh{" "}
                {(selectedProduct.salePrice * Number(formData.items)).toLocaleString()}
              </p>
            )}
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (stockWarning !== "" && formData.status === "completed")}
            >
              {loading ? "Updating..." : "Update Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
