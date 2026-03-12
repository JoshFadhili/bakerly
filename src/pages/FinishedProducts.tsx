import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye, Edit, Plus, Send, CheckCircle } from "lucide-react";
import { getPurchases } from "@/services/purchaseService";
import { getProducts } from "@/services/productService";
import { Purchase } from "@/types/purchase";
import NewPurchaseDialog from "@/components/purchases/NewPurchaseDialog";
import EditPurchaseDialog from "@/components/purchases/EditPurchaseDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortByDateTimeDesc } from "@/lib/sortingUtils";
import { usePurchaseDialog } from "@/contexts/PurchaseDialogContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function FinishedProducts() {
  const navigate = useNavigate();
  
  // Finished Products State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const { isNewPurchaseDialogOpen: globalDialogOpen, closeNewPurchaseDialog } = usePurchaseDialog();
  
  // Send to Sales Dialog State
  const [isSendToSalesDialogOpen, setIsSendToSalesDialogOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<Purchase | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMinCost, setFilterMinCost] = useState<string>("");
  const [filterMaxCost, setFilterMaxCost] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Sync with global dialog state
  useEffect(() => {
    if (globalDialogOpen) {
      setIsNewPurchaseDialogOpen(true);
      closeNewPurchaseDialog();
    }
  }, [globalDialogOpen, closeNewPurchaseDialog]);

  // Fetch purchases from Firestore
  const fetchPurchases = async () => {
    try {
      const purchasesList = await getPurchases();
      setPurchases(sortByDateTimeDesc(purchasesList));
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filter purchases based on search query and active filters
  const filteredPurchases = purchases.filter((purchase) => {
    // Search filter
    const matchesSearch =
      purchase.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === "all" || purchase.status === filterStatus;

    // Supplier filter
    const matchesSupplier = filterSupplier === "" || purchase.supplier.toLowerCase().includes(filterSupplier.toLowerCase());

    // Month filter
    const matchesMonth = filterMonth === "all" || 
      (purchase.date instanceof Date ? purchase.date.getMonth() + 1 : new Date(purchase.date).getMonth() + 1) === parseInt(filterMonth);

    // Year filter
    const matchesYear = filterYear === "all" || 
      (purchase.date instanceof Date ? purchase.date.getFullYear() : new Date(purchase.date).getFullYear()) === parseInt(filterYear);

    // Cost range filter
    const matchesCost =
      (filterMinCost === "" || purchase.totalCost >= Number(filterMinCost)) &&
      (filterMaxCost === "" || purchase.totalCost <= Number(filterMaxCost));

    return matchesSearch && matchesStatus && matchesSupplier && matchesMonth && matchesYear && matchesCost;
  }).sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeB.localeCompare(timeA);
  });

  // Check if any active filters
  useEffect(() => {
    setHasActiveFilters(
      filterStatus !== "all" ||
      filterSupplier !== "" ||
      filterMonth !== "all" ||
      filterYear !== "all" ||
      filterMinCost !== "" ||
      filterMaxCost !== ""
    );
  }, [filterStatus, filterSupplier, filterMonth, filterYear, filterMinCost, filterMaxCost]);

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterSupplier("");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterMinCost("");
    setFilterMaxCost("");
  };

  // Get unique years from purchases
  const getAvailableYears = () => {
    const years = new Set(
      purchases.map((purchase) => 
        purchase.date instanceof Date ? purchase.date.getFullYear() : new Date(purchase.date).getFullYear()
      )
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Time", "Item Name", "Baker", "Items", "Production Cost", "Total Production Cost", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredPurchases.map((purchase) =>
        [
          purchase.date.toISOString().split('T')[0],
          purchase.time || "",
          purchase.itemName,
          purchase.supplier,
          purchase.items,
          purchase.itemPrice,
          purchase.totalCost,
          purchase.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `finished_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View purchase details
  const viewPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsViewDialogOpen(true);
  };

  // Edit purchase
  const editPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsEditDialogOpen(true);
  };

  // Send to Sales - open dialog
  const openSendToSalesDialog = (purchase: Purchase) => {
    if (purchase.status !== "received") {
      toast.error("Only received products can be sent to sales");
      return;
    }
    if (purchase.itemsRemaining <= 0) {
      toast.error("No items remaining in this batch");
      return;
    }
    setSelectedProductForSale(purchase);
    setIsSendToSalesDialogOpen(true);
  };

  // Send to Sales - confirm action
  const confirmSendToSales = async () => {
    if (selectedProductForSale) {
      // Fetch products to get the sale price
      let salePrice = selectedProductForSale.itemPrice; // Default to item price if product not found
      try {
        const products = await getProducts();
        const product = products.find(p => p.name === selectedProductForSale.itemName);
        if (product) {
          salePrice = product.salePrice;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      
      // Navigate to sales page with product data
      navigate("/sales", { 
        state: { 
          productForSale: {
            batchId: selectedProductForSale.batchId,
            itemName: selectedProductForSale.itemName,
            itemsAvailable: selectedProductForSale.itemsRemaining,
            unitPrice: salePrice,
            supplier: selectedProductForSale.supplier,
          }
        }
      });
      toast.success("Navigating to sales page to create sale");
    }
    setIsSendToSalesDialogOpen(false);
    setSelectedProductForSale(null);
  };

  // Calculate summary stats
  const totalPurchases = purchases.length;
  const receivedPurchases = purchases.filter((p) => p.status === "received").length;
  const pendingPurchases = purchases.filter((p) => p.status === "pending").length;
  const totalCost = purchases.reduce((acc, p) => acc + p.totalCost, 0);
  const availableForSale = purchases.filter((p) => p.status === "received" && p.itemsRemaining > 0).length;

  return (
    <ERPLayout title="Finished Products" subtitle="Manage finished cakes and products ready for sale">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">
              {totalPurchases}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available for Sale</p>
            <p className="text-2xl font-bold">
              {availableForSale}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-orange">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-2xl font-bold">
              {pendingPurchases}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              KSh {totalCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Finished Products Inventory</CardTitle>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "border-erp-blue text-erp-blue" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-erp-blue" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="success" size="sm" onClick={() => setIsNewPurchaseDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add finished Product</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filters Section */}
        {showFilters && (
          <CardContent className="border-b">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Baker</label>
                <Input
                  placeholder="Search baker..."
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                />
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {getAvailableYears().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Range (KSh)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filterMinCost}
                    onChange={(e) => setFilterMinCost(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filterMaxCost}
                    onChange={(e) => setFilterMaxCost(e.target.value)}
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
            <p className="text-sm text-muted-foreground">Loading finished products...</p>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No finished products found</p>
              <Button onClick={() => setIsNewPurchaseDialogOpen(true)}>
                Add your first finished product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Baker</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="hidden md:table-cell">Remaining</TableHead>
                    <TableHead className="hidden md:table-cell">Production Cost</TableHead>
                    <TableHead>Total Production Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.date instanceof Date
                          ? purchase.date.toLocaleDateString()
                          : new Date(purchase.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{purchase.time || ""}</TableCell>
                      <TableCell>{purchase.itemName}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {purchase.supplier}
                      </TableCell>
                      <TableCell>{purchase.items}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={purchase.itemsRemaining <= 0 ? "text-red-500 font-medium" : ""}>
                          {purchase.itemsRemaining}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        KSh {purchase.itemPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>KSh {purchase.totalCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            purchase.status === "received" ? "default" : "secondary"
                          }
                          className={
                            purchase.status === "received"
                              ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                              : purchase.status === "pending"
                              ? "bg-erp-orange/10 text-erp-orange hover:bg-erp-orange/20"
                              : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                          }
                        >
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewPurchase(purchase)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editPurchase(purchase)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {purchase.status === "received" && purchase.itemsRemaining > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openSendToSalesDialog(purchase)}
                              title="Send to Sales"
                              className="text-erp-green hover:text-erp-green hover:bg-erp-green/10"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* New Purchase Dialog */}
      <NewPurchaseDialog
        isOpen={isNewPurchaseDialogOpen}
        onClose={() => setIsNewPurchaseDialogOpen(false)}
        onPurchaseAdded={fetchPurchases}
      />

      {/* Edit Purchase Dialog */}
      <EditPurchaseDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onPurchaseUpdated={fetchPurchases}
        purchase={selectedPurchase}
      />

      {/* View Purchase Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finished Product Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {selectedPurchase.date instanceof Date
                    ? selectedPurchase.date.toLocaleDateString()
                    : new Date(selectedPurchase.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{selectedPurchase.time || ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch ID:</span>
                <span className="font-medium">{selectedPurchase.batchId || ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Name:</span>
                <span className="font-medium">{selectedPurchase.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Baker:</span>
                <span className="font-medium">{selectedPurchase.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{selectedPurchase.items}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Remaining:</span>
                <span className="font-medium">{selectedPurchase.itemsRemaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Price:</span>
                <span className="font-medium">KSh {selectedPurchase.itemPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">KSh {selectedPurchase.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    selectedPurchase.status === "received" ? "default" : "secondary"
                  }
                  className={
                    selectedPurchase.status === "received"
                      ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                      : selectedPurchase.status === "pending"
                      ? "bg-erp-orange/10 text-erp-orange hover:bg-erp-orange/20"
                      : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                  }
                >
                  {selectedPurchase.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Sales Confirmation Dialog */}
      <Dialog open={isSendToSalesDialogOpen} onOpenChange={setIsSendToSalesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Sales</DialogTitle>
          </DialogHeader>
          {selectedProductForSale && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to create a sale for this finished product?
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{selectedProductForSale.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch ID:</span>
                  <span className="font-medium">{selectedProductForSale.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Items:</span>
                  <span className="font-medium">{selectedProductForSale.itemsRemaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span className="font-medium">KSh {selectedProductForSale.itemPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You will be redirected to the Sales page to complete the sale.
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSendToSalesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSendToSales} className="bg-erp-green hover:bg-erp-green/90">
              <Send className="h-4 w-4 mr-2" />
              Go to Sales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERPLayout>
  );
}