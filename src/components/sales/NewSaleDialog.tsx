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
import { addSale } from "@/services/salesService";
import { Search, Calendar, AlertCircle } from "lucide-react";

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleAdded: () => void;
}

export default function NewSaleDialog({
  isOpen,
  onClose,
  onSaleAdded,
}: NewSaleDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [stockWarning, setStockWarning] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemName: "",
    items: "1",
    totalAmount: "",
    payment: "Cash" as "Cash" | "M-Pesa" | "Card" | "Bank Transfer",
    status: "completed" as "completed" | "pending" | "cancelled",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  // Auto-calculate total amount when product and quantity change
  useEffect(() => {
    if (selectedProduct && formData.items) {
      const calculatedAmount = selectedProduct.salePrice * Number(formData.items);
      setFormData((prev) => ({
        ...prev,
        totalAmount: calculatedAmount.toString(),
      }));

      // Check stock availability (only for completed sales)
      if (formData.status === "completed") {
        const requestedQuantity = Number(formData.items);
        if (requestedQuantity > selectedProduct.stock) {
          setStockWarning(
            `Warning: Only ${selectedProduct.stock} items in stock. You're trying to sell ${requestedQuantity}.`
          );
        } else {
          setStockWarning("");
        }
      } else {
        setStockWarning("");
      }
    }
  }, [selectedProduct, formData.items, formData.status]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      itemName: product.name,
      items: "1",
    }));
    setSearchQuery(product.name);
    setShowDropdown(false);
    setStockWarning("");
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
      // Validate stock availability (only for completed sales)
      if (formData.status === "completed" && selectedProduct && Number(formData.items) > selectedProduct.stock) {
        alert(
          `Insufficient stock! Only ${selectedProduct.stock} items available. Please reduce the quantity.`
        );
        setLoading(false);
        return;
      }

      // Add the sale
      await addSale({
        date: new Date(formData.date),
        itemName: formData.itemName,
        items: Number(formData.items),
        totalAmount: Number(formData.totalAmount),
        payment: formData.payment,
        status: formData.status,
        createdAt: new Date(),
      });

      // Update product stock (only reduce for completed sales)
      if (selectedProduct && formData.status === "completed") {
        const newStock = selectedProduct.stock - Number(formData.items);
        const newStatus = newStock <= 10 ? "low_stock" : "active";
        
        await updateProduct(selectedProduct.id!, {
          stock: newStock,
          status: newStatus,
        });
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        itemName: "",
        items: "1",
        totalAmount: "",
        payment: "Cash",
        status: "completed",
      });
      setSelectedProduct(null);
      setSearchQuery("");
      setShowDropdown(false);
      setStockWarning("");

      onClose();
      onSaleAdded();
    } catch (error) {
      console.error("Error adding sale:", error);
      alert("Failed to add sale. Please try again.");
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
                    className={`px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center ${
                      product.stock === 0 ? "opacity-50" : ""
                    }`}
                    onClick={() => {
                      if (product.stock > 0) {
                        handleProductSelect(product);
                      }
                    }}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.category} • KSh {product.salePrice.toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`text-xs ${
                        product.stock === 0
                          ? "text-red-500 font-medium"
                          : product.stock <= 10
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock}`}
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
                Available stock: {selectedProduct.stock}
              </p>
            )}
          </div>

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
              Note: Stock is only reduced for completed sales
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
              {loading ? "Adding..." : "Add Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
