import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

// 🔥 Services
import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "@/services/productService";

// 🧩 Dialog (modal)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // 🧠 Edit state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // 🗑️ Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    stock: "",
  });

  // 🔹 Fetch products
  const fetchProducts = async () => {
    try {
      const productsList = await getProducts();
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ➕ ADD PRODUCT
  const handleAddProduct = async () => {
    await addProduct({
      name: formData.name,
      category: formData.category,
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      stock: Number(formData.stock),
      status: Number(formData.stock) <= 10 ? "low_stock" : "active",
      createdAt: new Date(),
    });

    resetAndReload();
  };

  // ✏️ UPDATE PRODUCT
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    await updateProduct(editingProduct.id, {
      name: formData.name,
      category: formData.category,
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      stock: Number(formData.stock),
      status: Number(formData.stock) <= 10 ? "low_stock" : "active",
    });

    resetAndReload();
  };

  // 🗑️ CONFIRM DELETE
const handleDeleteProduct = async () => {
  if (!deleteTarget) return;

  await deleteProduct(deleteTarget.id);

  setDeleteTarget(null);
  setLoading(true);
  fetchProducts();
};

  // 🧹 Reset & reload
  const resetAndReload = () => {
    setFormData({
      name: "",
      category: "",
      costPrice: "",
      salePrice: "",
      stock: "",
    });
    setEditingProduct(null);
    setIsOpen(false);
    setLoading(true);
    fetchProducts();
  };

  // 🖊️ Open Edit modal
  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
      stock: product.stock.toString(),
    });
    setIsOpen(true);
  };

  // 🔍 Search filter
  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ERPLayout
      title="Products & Services"
      subtitle="Manage your product catalog"
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="goods" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="goods">Goods</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setEditingProduct(null);
                setIsOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Stock
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {product.category}
                      </TableCell>

                      <TableCell>
                        KSh {Number(product.costPrice).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        KSh {Number(product.salePrice).toLocaleString()}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {product.stock} Units
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            product.status === "active"
                              ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                              : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                          }
                        >
                          {product.status === "active"
                            ? "Active"
                            : "Low Stock"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ➕ / ✏️ Add/Edit Product Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} />
            <Input name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
            <Input name="costPrice" type="number" placeholder="Cost Price" value={formData.costPrice} onChange={handleChange} />
            <Input name="salePrice" type="number" placeholder="Sale Price" value={formData.salePrice} onChange={handleChange} />
            <Input name="stock" type="number" placeholder="Initial Stock" value={formData.stock} onChange={handleChange} />
          </div>

          <DialogFooter>
            <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
              {editingProduct ? "Save Changes" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 🗑️ Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium">{deleteTarget?.name}</span>?  
            This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERPLayout>
  );
}
