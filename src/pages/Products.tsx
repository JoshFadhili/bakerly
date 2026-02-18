import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Info } from "lucide-react";
import {
  getCategories,
  addCategory,
  deleteCategory,
} from "@/services/categoryService";
import CategoryDialog from "@/components/products/CategoryDialog";

// 🔥 Products
import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "@/services/productService";

// 🔥 Services
import {
  addService,
  getServices,
  updateService,
  deleteService,
} from "@/services/serviceService";

// 🔥 Inventory
import { getInventory } from "@/services/inventoryService";

// 🧩 Types
import { Product } from "@/types/product";
import { Service } from "@/types/service";
import { InventoryItem } from "@/types/inventory";

// 🧩 Dialog (modal)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";

export default function Products() {
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // 🧠 Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // 🗑️ Delete state
  const [deleteTarget, setDeleteTarget] = useState<Product | Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    salePrice: "",
  });

  // Service form state
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    category: "",
    price: "",
  });

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState<"goods" | "services">("goods");

  // 🔹 Categories state
  const [goodsCategories, setGoodsCategories] = useState<any[]>([]);
  const [servicesCategories, setServicesCategories] = useState<any[]>([]);

  // 🔹 Helper function to get inventory status for a product
  const getInventoryStatus = (productName: string): { status: "active" | "low_stock" | "out_of_stock"; stock?: number } => {
    const inventoryItem = inventory.find(item => item.name === productName);
    if (!inventoryItem) {
      return { status: "out_of_stock", stock: 0 };
    }
    const isLowStock = inventoryItem.stock < lowStockThreshold;
    return {
      status: isLowStock ? "low_stock" : "active",
      stock: inventoryItem.stock
    };
  };

  // 🔹 Fetch products and services
  const fetchProducts = async () => {
    try {
      const [productsList, goodsCategoryList, servicesCategoryList, servicesList, inventoryList] = await Promise.all([
        getProducts(),
        getCategories("goods"),
        getCategories("services"),
        getServices(),
        getInventory(),
      ]);

      setProducts(productsList);
      setGoodsCategories(goodsCategoryList);
      setServicesCategories(servicesCategoryList);
      setServices(servicesList);
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error loading data:", error);
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

  // 🔹 Handle service input change
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceFormData({
      ...serviceFormData,
      [e.target.name]: e.target.value,
    });
  };

  // ➕ ADD PRODUCT
  const handleAddProduct = async () => {
    await addProduct({
      name: formData.name,
      category: formData.category,
      salePrice: Number(formData.salePrice),
      status: "active",
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
      salePrice: Number(formData.salePrice),
    });

    resetAndReload();
  };

  // ➕ ADD SERVICE
  const handleAddService = async () => {
    await addService({
      name: serviceFormData.name,
      category: serviceFormData.category,
      price: Number(serviceFormData.price),
      createdAt: new Date(),
    });

    resetServiceAndReload();
  };

  // ✏️ UPDATE SERVICE
  const handleUpdateService = async () => {
    if (!editingService) return;

    await updateService(editingService.id, {
      name: serviceFormData.name,
      category: serviceFormData.category,
      price: Number(serviceFormData.price),
    });

    resetServiceAndReload();
  };

  // 🗑️ CONFIRM DELETE
  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    if (activeTab === "services") {
      await deleteService(deleteTarget.id);
    } else {
      await deleteProduct(deleteTarget.id);
    }

    setDeleteTarget(null);
    setLoading(true);
    fetchProducts();
  };

  // 🧹 Reset & reload
  const resetAndReload = () => {
    setFormData({
      name: "",
      category: "",
      salePrice: "",
    });
    setEditingProduct(null);
    setIsOpen(false);
    setLoading(true);
    fetchProducts();
  };

  // 🧹 Reset service & reload
  const resetServiceAndReload = () => {
    setServiceFormData({
      name: "",
      category: "",
      price: "",
    });
    setEditingService(null);
    setIsServiceModalOpen(false);
    setLoading(true);
    fetchProducts();
  };

  // 🖊️ Open Edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      salePrice: product.salePrice.toString(),
    });
    setIsOpen(true);
  };

  // 🖊️ Open Edit service modal
  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      category: service.category,
      price: service.price.toString(),
    });
    setIsServiceModalOpen(true);
  };

  // 🔍 Search filter
  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter((service) =>
    service.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ERPLayout
      title="Products & Services"
      subtitle="Manage your product catalog"
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab as "goods" | "services"}
            onValueChange={(value: "goods" | "services") => setActiveTab(value)}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="goods" asChild={false}>Goods</TabsTrigger>
              <TabsTrigger value="services" asChild={false}>Services</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={activeTab === "services" ? "Search services..." : "Search products..."}
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Categories
            </Button>

            <Button
              variant="success"
              size="sm"
              onClick={() => {
                if (activeTab === "services") {
                  setEditingService(null);
                  setIsServiceModalOpen(true);
                } else {
                  setEditingProduct(null);
                  setIsOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4" />
              {activeTab === "services" ? "Add Service" : "Add Product"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : activeTab === "services" ? (
            /* ================= SERVICES TABLE ================= */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created At
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {service.category}
                      </TableCell>

                      <TableCell>
                        KSh {Number(service.price).toLocaleString()}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {service.createdAt
                          ? (service.createdAt instanceof Date
                              ? service.createdAt.toLocaleDateString()
                              : service.createdAt?.toDate
                                ? service.createdAt.toDate().toLocaleDateString()
                                : new Date(service.createdAt).toLocaleDateString())
                          : 'N/A'}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditServiceModal(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(service)}
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
          ) : (
            /* ================= GOODS TABLE ================= */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Sale Price</TableHead>
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
                        KSh {Number(product.salePrice).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            getInventoryStatus(product.name).status === "active"
                              ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                              : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                          }
                        >
                          {getInventoryStatus(product.name).status === "active"
                            ? "In Stock"
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

          <div className="space-y-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="productCategory">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {goodsCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (KSh)</Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.salePrice}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
              {editingProduct ? "Save Changes" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ➕ / ✏️ Add/Edit Service Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                name="name"
                placeholder="Enter service name"
                value={serviceFormData.name}
                onChange={handleServiceChange}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Category</Label>
              <Select
                value={serviceFormData.category}
                onValueChange={(value) =>
                  setServiceFormData({ ...serviceFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {servicesCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="servicePrice">Price (KSh)</Label>
              <Input
                id="servicePrice"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={serviceFormData.price}
                onChange={handleServiceChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={editingService ? handleUpdateService : handleAddService}>
              {editingService ? "Save Changes" : "Save Service"}
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
            <DialogTitle>{activeTab === "services" ? "Delete Service" : "Delete Product"}</DialogTitle>
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

      {/* 📋 Category Management Dialog */}
      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onCategoryChange={fetchProducts}
      />
    </ERPLayout>
  );
}
