import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Filter, AlertTriangle, Edit, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getInventory,
  getLowStockItems,
  getInventoryByCategory,
  adjustStockWithBatch,
  getBatchesForProduct,
  recalculateInventoryFromBatches,
  calculateStockValueFromBatches,
} from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";
import { Product } from "@/types/product";
import { Purchase } from "@/types/purchase";
import { getProducts } from "@/services/productService";
import { deleteOldDepletedBatches } from "@/services/purchaseService";
import {
  getBakingSupplyInventoryFromBatches,
  BakingSupplyInventoryItem,
} from "@/services/bakingSupplyPurchaseService";
import BatchDetailsDialog from "@/components/inventory/BatchDetailsDialog";
import BakingSupplyBatchDetailsDialog from "@/components/inventory/BakingSupplyBatchDetailsDialog";
import AdjustBakingSupplyDialog from "@/components/inventory/AdjustBakingSupplyDialog";
import { useSettings } from "@/contexts/SettingsContext";

export default function Inventory() {
  const { settings } = useSettings();
  const lowStockThreshold = settings?.notifications?.lowStockThreshold ?? 5;
  
  // Finished Products State
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [stockMin, setStockMin] = useState<string>("");
  const [stockMax, setStockMax] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Baking Supplies State - Now sourced from purchase batches
  const [bakingSupplyInventory, setBakingSupplyInventory] = useState<BakingSupplyInventoryItem[]>([]);
  const [loadingBakingSupplies, setLoadingBakingSupplies] = useState(true);
  const [bakingSearchQuery, setBakingSearchQuery] = useState("");
  const [bakingFilter, setBakingFilter] = useState("all");
  const [bakingCategoryFilter, setBakingCategoryFilter] = useState("all");
  const [showBakingFilters, setShowBakingFilters] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("finished-products");

  // Modal states
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isAdjustBakingSupplyOpen, setIsAdjustBakingSupplyOpen] = useState(false);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false);
  const [isBakingSupplyBatchDetailsOpen, setIsBakingSupplyBatchDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedBakingSupply, setSelectedBakingSupply] = useState<BakingSupplyInventoryItem | null>(null);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<string>("");
  const [selectedBakingSupplyForBatches, setSelectedBakingSupplyForBatches] = useState<string>("");

  // Form states
  const [adjustStockQuantity, setAdjustStockQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [batches, setBatches] = useState<Purchase[]>([]);

  // Fetch inventory and products
  const fetchData = async () => {
    try {
      // Clean up old depleted batches (older than 168 hours)
      try {
        const cleanupResult = await deleteOldDepletedBatches();
        if (cleanupResult.hidden > 0) {
          console.log(`Hidden ${cleanupResult.hidden} old depleted batches`);
        }
      } catch (cleanupError) {
        console.warn("Failed to clean up old depleted batches:", cleanupError);
        // Continue with loading data even if cleanup fails
      }

      const [inventoryList, productsList] = await Promise.all([
        getInventory(),
        getProducts(),
      ]);

      setInventory(inventoryList);
      setProducts(productsList);

      // Fetch stock values from batches for each product
      const stockValuesMap: Record<string, number> = {};
      for (const item of inventoryList as InventoryItem[]) {
        if (item.name) {
          const stockValue = await calculateStockValueFromBatches(item.name);
          stockValuesMap[item.name] = stockValue;
        }
      }
      setStockValues(stockValuesMap);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch baking supply inventory from batches
  const fetchBakingSupplyInventory = async () => {
    try {
      const inventoryData = await getBakingSupplyInventoryFromBatches(lowStockThreshold);
      setBakingSupplyInventory(inventoryData);
    } catch (error) {
      console.error("Error loading baking supply inventory:", error);
    } finally {
      setLoadingBakingSupplies(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBakingSupplyInventory();
  }, []);

  // Filter inventory based on search query and filters
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesFilter = filter === "all" ||
      (filter === "low" && item.stock < lowStockThreshold);

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    // Stock range filter
    const matchesStock =
      (stockMin === "" || item.stock >= Number(stockMin)) &&
      (stockMax === "" || item.stock <= Number(stockMax));

    return matchesSearch && matchesFilter && matchesCategory && matchesStock;
  });

  // Filter baking supplies based on search query and filters
  const filteredBakingSupplies = bakingSupplyInventory.filter((supply) => {
    const matchesSearch = supply.supplyName
      ?.toLowerCase()
      .includes(bakingSearchQuery.toLowerCase()) ||
      supply.category?.toLowerCase().includes(bakingSearchQuery.toLowerCase());

    const matchesFilter = bakingFilter === "all" ||
      (bakingFilter === "low" && (supply.status === "low_stock" || supply.status === "out_of_stock")) ||
      (bakingFilter === "in_stock" && supply.status === "in_stock");

    const matchesCategory = bakingCategoryFilter === "all" || supply.category === bakingCategoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Get unique categories for finished products
  const categories = Array.from(
    new Set(inventory.map((item) => item.category))
  ).filter(Boolean);

  // Get unique categories for baking supplies
  const bakingCategories = Array.from(
    new Set(bakingSupplyInventory.map((supply) => supply.category))
  ).filter(Boolean);

  // Calculate stats for finished products
  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  const lowStockCount = inventory.filter((item) => item.stock < lowStockThreshold).length;
  const totalStockValue = inventory.reduce((acc, item) => {
    const stockValue = item.name ? (stockValues[item.name] || 0) : 0;
    return acc + stockValue;
  }, 0);

  // Calculate stats for baking supplies (from batches)
  const totalBakingSupplies = bakingSupplyInventory.length;
  const totalBakingSupplyQuantity = bakingSupplyInventory.reduce((acc, supply) => acc + supply.quantityRemaining, 0);
  const lowStockBakingSupplies = bakingSupplyInventory.filter(
    (supply) => supply.status === "low_stock" || supply.status === "out_of_stock"
  ).length;
  const totalBakingSupplyValue = bakingSupplyInventory.reduce((acc, supply) => acc + supply.stockValue, 0);

  // Handle adjust stock
  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustStockQuantity) return;

    await adjustStockWithBatch(
      selectedItem.id!,
      Number(adjustStockQuantity),
      selectedBatchId || undefined,
      adjustmentReason,
      lowStockThreshold
    );

    setIsAdjustStockOpen(false);
    setAdjustStockQuantity("");
    setAdjustmentReason("");
    setSelectedBatchId("");
    setSelectedItem(null);
    fetchData();
  };

  // Fetch batches for a product
  const fetchBatchesForProduct = async (productName: string) => {
    try {
      const batchesList = await getBatchesForProduct(productName);
      setBatches(batchesList);

      // Set default batch to the first batch that still has items
      const firstBatchWithItems = batchesList.find(
        (batch) => (batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items) > 0
      );
      if (firstBatchWithItems) {
        setSelectedBatchId(firstBatchWithItems.id!);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  // Handle view batch details
  const handleViewBatchDetails = (item: InventoryItem) => {
    setSelectedProductForBatches(item.name || "");
    setIsBatchDetailsOpen(true);
  };

  // Handle view baking supply batch details
  const handleViewBakingSupplyBatchDetails = (supply: BakingSupplyInventoryItem) => {
    setSelectedBakingSupplyForBatches(supply.supplyName);
    setIsBakingSupplyBatchDetailsOpen(true);
  };

  // Clear filters for finished products
  const clearFilters = () => {
    setCategoryFilter("all");
    setStockMin("");
    setStockMax("");
  };

  // Clear filters for baking supplies
  const clearBakingFilters = () => {
    setBakingCategoryFilter("all");
    setBakingFilter("all");
  };

  // Export to CSV for finished products
  const exportToCSV = () => {
    const headers = [
      "Product Name",
      "Category",
      "Stock In Hand",
      "Unit Cost (from batch)",
      "Stock Value",
      "Status",
      "Last Updated",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredInventory.map((item) => {
        const stockValue = item.name ? (stockValues[item.name] || 0) : 0;
        const unitCost = item.stock > 0 ? stockValue / item.stock : 0;
        const isLowStock = item.stock < lowStockThreshold;
        const status = isLowStock ? "Low Stock" : "In Stock";
        const lastUpdated = item.updatedAt
          ? item.updatedAt instanceof Date
            ? item.updatedAt.toLocaleDateString()
            : item.updatedAt?.toDate
              ? item.updatedAt.toDate().toLocaleDateString()
              : new Date(item.updatedAt).toLocaleDateString()
          : "N/A";

        return [
          `"${item.name || ""}"`,
          `"${item.category || ""}"`,
          item.stock || 0,
          unitCost.toFixed(2),
          stockValue.toFixed(2),
          status,
          lastUpdated,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_${filter === "low" ? "low_stock" : categoryFilter}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV for baking supplies
  const exportBakingSuppliesToCSV = () => {
    const headers = [
      "Supply Name",
      "Category",
      "Quantity Remaining",
      "Unit",
      "Avg Unit Price",
      "Stock Value",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredBakingSupplies.map((supply) => {
        const status = supply.status === "in_stock" ? "In Stock" : 
                       supply.status === "low_stock" ? "Low Stock" : "Out of Stock";

        return [
          `"${supply.supplyName || ""}"`,
          `"${supply.category || ""}"`,
          supply.quantityRemaining || 0,
          `"${supply.unit || ""}"`,
          supply.unitPrice.toFixed(2),
          supply.stockValue.toFixed(2),
          status,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `baking_supplies_inventory_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ERPLayout title="Inventory" subtitle="Track stock levels and manage inventory">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="finished-products">Finished Products</TabsTrigger>
          <TabsTrigger value="baking-supplies">Baking Supplies</TabsTrigger>
        </TabsList>

        {/* Finished Products Tab */}
        <TabsContent value="finished-products">
          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock} pcs</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">KSh {totalStockValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-red">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-erp-red">{lowStockCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory..."
                    className="w-full pl-9 sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (filteredInventory.length === 1) {
                      setSelectedItem(filteredInventory[0]);
                      setIsAdjustStockOpen(true);
                      fetchBatchesForProduct(filteredInventory[0].name || "");
                    }
                  }}
                  disabled={filteredInventory.length !== 1}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Adjust Stock</span>
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </CardHeader>

            {/* Filters Section */}
            {showFilters && (
              <CardContent className="border-b">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Stock Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Status</label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All items" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="low" className="gap-1">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stock Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock In Hand Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={stockMin}
                        onChange={(e) => setStockMin(e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={stockMax}
                        onChange={(e) => setStockMax(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            )}

            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading inventory...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead>Stock In Hand</TableHead>
                        <TableHead className="hidden lg:table-cell">Unit Cost</TableHead>
                        <TableHead className="hidden lg:table-cell">Stock Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredInventory.map((item) => {
                        const stockValue = item.name ? (stockValues[item.name] || 0) : 0;
                        const unitCost = item.stock > 0 ? stockValue / item.stock : 0;
                        const isLowStock = item.stock < lowStockThreshold;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{item.category}</TableCell>
                            <TableCell>{item.stock} pcs</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              KSh {unitCost > 0 ? unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              KSh {stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  isLowStock
                                    ? "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                                    : "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                                }
                              >
                                {isLowStock ? "Low Stock" : "In Stock"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsAdjustStockOpen(true);
                                    fetchBatchesForProduct(item.name || "");
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewBatchDetails(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Baking Supplies Tab */}
        <TabsContent value="baking-supplies">
          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Supplies</p>
                <p className="text-2xl font-bold">{totalBakingSupplies}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{totalBakingSupplyQuantity.toLocaleString()} units</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">KSh {totalBakingSupplyValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-red">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-erp-red">{lowStockBakingSupplies}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search baking supplies..."
                    className="w-full pl-9 sm:w-64"
                    value={bakingSearchQuery}
                    onChange={(e) => setBakingSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBakingFilters(!showBakingFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (filteredBakingSupplies.length === 1) {
                      setSelectedBakingSupply(filteredBakingSupplies[0]);
                      setIsAdjustBakingSupplyOpen(true);
                    }
                  }}
                  disabled={filteredBakingSupplies.length !== 1}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Adjust Stock</span>
                </Button>
                <Button variant="outline" size="sm" onClick={exportBakingSuppliesToCSV}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </CardHeader>

            {/* Filters Section */}
            {showBakingFilters && (
              <CardContent className="border-b">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Stock Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Status</label>
                    <Select value={bakingFilter} onValueChange={setBakingFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All items" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low" className="gap-1">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low/Out of Stock
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={bakingCategoryFilter} onValueChange={setBakingCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {bakingCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4">
                  <Button variant="ghost" size="sm" onClick={clearBakingFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            )}

            <CardContent>
              {loadingBakingSupplies ? (
                <p className="text-sm text-muted-foreground">Loading baking supplies inventory...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supply Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="hidden md:table-cell">Unit</TableHead>
                        <TableHead className="hidden lg:table-cell">Avg Unit Price</TableHead>
                        <TableHead className="hidden lg:table-cell">Stock Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredBakingSupplies.map((supply) => {
                        return (
                          <TableRow key={supply.supplyName}>
                            <TableCell className="font-medium">{supply.supplyName}</TableCell>
                            <TableCell className="hidden sm:table-cell">{supply.category}</TableCell>
                            <TableCell>{supply.quantityRemaining}</TableCell>
                            <TableCell className="hidden md:table-cell">{supply.unit}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              KSh {supply.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              KSh {supply.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  supply.status === "out_of_stock"
                                    ? "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                                    : supply.status === "low_stock"
                                    ? "bg-erp-orange/10 text-erp-orange hover:bg-erp-orange/20"
                                    : "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                                }
                              >
                                {supply.status === "out_of_stock" ? "Out of Stock" : 
                                 supply.status === "low_stock" ? "Low Stock" : "In Stock"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedBakingSupply(supply);
                                    setIsAdjustBakingSupplyOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewBakingSupplyBatchDetails(supply)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Modal */}
      <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Product</p>
              <p className="text-lg font-semibold">{selectedItem?.name}</p>
              <p className="text-sm text-muted-foreground">
                Current Stock: {selectedItem?.stock} pcs
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Adjustment (+/-)</label>
              <Input
                type="number"
                placeholder="Enter adjustment (positive to add, negative to reduce)"
                value={adjustStockQuantity}
                onChange={(e) => setAdjustStockQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Batch (Optional)</label>
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {batches.length === 0 ? (
                    <SelectItem value="none" disabled>No batches available</SelectItem>
                  ) : (
                    batches.map((batch) => {
                      const itemsRemaining = batch.itemsRemaining !== undefined ? batch.itemsRemaining : batch.items;
                      return (
                        <SelectItem key={batch.id} value={batch.id!}>
                          {batch.batchId} - {itemsRemaining} items remaining
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                If no batch is selected, the adjustment will only update the inventory stock.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                type="text"
                placeholder="e.g., Damaged goods, Data correction, etc."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustStockOpen(false);
                setAdjustStockQuantity("");
                setAdjustmentReason("");
                setSelectedBatchId("");
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Adjust Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Details Dialog */}
      <BatchDetailsDialog
        isOpen={isBatchDetailsOpen}
        onClose={() => setIsBatchDetailsOpen(false)}
        productName={selectedProductForBatches}
      />

      {/* Baking Supply Batch Details Dialog */}
      <BakingSupplyBatchDetailsDialog
        isOpen={isBakingSupplyBatchDetailsOpen}
        onClose={() => setIsBakingSupplyBatchDetailsOpen(false)}
        supplyName={selectedBakingSupplyForBatches}
      />

      {/* Adjust Baking Supply Stock Dialog */}
      <AdjustBakingSupplyDialog
        isOpen={isAdjustBakingSupplyOpen}
        onClose={() => {
          setIsAdjustBakingSupplyOpen(false);
          setSelectedBakingSupply(null);
        }}
        onStockAdjusted={() => {
          fetchBakingSupplyInventory();
        }}
        supply={selectedBakingSupply}
      />
    </ERPLayout>
  );
}
