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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Eye, Edit, Plus, DollarSign } from "lucide-react";
import { getPurchases } from "@/services/purchaseService";
import { getBakingSupplyPurchases } from "@/services/bakingSupplyPurchaseService";
import { Purchase } from "@/types/purchase";
import { BakingSupplyPurchase } from "@/types/bakingSupplyPurchase";
import NewPurchaseDialog from "@/components/purchases/NewPurchaseDialog";
import EditPurchaseDialog from "@/components/purchases/EditPurchaseDialog";
import NewBakingSupplyPurchaseDialog from "@/components/purchases/NewBakingSupplyPurchaseDialog";
import EditBakingSupplyPurchaseDialog from "@/components/purchases/EditBakingSupplyPurchaseDialog";
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

export default function Purchases() {
  // Finished Products State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const { isNewPurchaseDialogOpen: globalDialogOpen, closeNewPurchaseDialog } = usePurchaseDialog();
  
  // Baking Supplies State
  const [bakingSupplyPurchases, setBakingSupplyPurchases] = useState<BakingSupplyPurchase[]>([]);
  const [loadingBakingSupplies, setLoadingBakingSupplies] = useState(true);
  const [bakingSearchQuery, setBakingSearchQuery] = useState("");
  const [isNewBakingSupplyPurchaseDialogOpen, setIsNewBakingSupplyPurchaseDialogOpen] = useState(false);
  const [isViewBakingSupplyDialogOpen, setIsViewBakingSupplyDialogOpen] = useState(false);
  const [isEditBakingSupplyDialogOpen, setIsEditBakingSupplyDialogOpen] = useState(false);
  const [selectedBakingSupplyPurchase, setSelectedBakingSupplyPurchase] = useState<BakingSupplyPurchase | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("finished-products");
  
  // Filter states for Finished Products
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMinCost, setFilterMinCost] = useState<string>("");
  const [filterMaxCost, setFilterMaxCost] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Filter states for Baking Supplies
  const [showBakingFilters, setShowBakingFilters] = useState(false);
  const [bakingFilterStatus, setBakingFilterStatus] = useState<string>("all");
  const [bakingFilterSupplier, setBakingFilterSupplier] = useState<string>("");
  const [bakingFilterPurpose, setBakingFilterPurpose] = useState<string>("all");
  const [bakingFilterMonth, setBakingFilterMonth] = useState<string>("all");
  const [bakingFilterYear, setBakingFilterYear] = useState<string>("all");
  const [bakingFilterMinCost, setBakingFilterMinCost] = useState<string>("");
  const [bakingFilterMaxCost, setBakingFilterMaxCost] = useState<string>("");
  const [hasActiveBakingFilters, setHasActiveBakingFilters] = useState(false);

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

  // Fetch baking supply purchases from Firestore
  const fetchBakingSupplyPurchases = async () => {
    try {
      const purchasesList = await getBakingSupplyPurchases();
      setBakingSupplyPurchases(sortByDateTimeDesc(purchasesList));
    } catch (error) {
      console.error("Error fetching baking supply purchases:", error);
    } finally {
      setLoadingBakingSupplies(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchBakingSupplyPurchases();
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

  // Filter baking supply purchases based on search query and active filters
  const filteredBakingSupplyPurchases = bakingSupplyPurchases.filter((purchase) => {
    // Search filter
    const matchesSearch =
      purchase.supplyName.toLowerCase().includes(bakingSearchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(bakingSearchQuery.toLowerCase()) ||
      purchase.category.toLowerCase().includes(bakingSearchQuery.toLowerCase());

    // Status filter
    const matchesStatus = bakingFilterStatus === "all" || purchase.status === bakingFilterStatus;

    // Purpose filter
    const matchesPurpose = bakingFilterPurpose === "all" || purchase.purpose === bakingFilterPurpose;

    // Supplier filter
    const matchesSupplier = bakingFilterSupplier === "" || purchase.supplier.toLowerCase().includes(bakingFilterSupplier.toLowerCase());

    // Month filter
    const matchesMonth = bakingFilterMonth === "all" || 
      (purchase.date instanceof Date ? purchase.date.getMonth() + 1 : new Date(purchase.date).getMonth() + 1) === parseInt(bakingFilterMonth);

    // Year filter
    const matchesYear = bakingFilterYear === "all" || 
      (purchase.date instanceof Date ? purchase.date.getFullYear() : new Date(purchase.date).getFullYear()) === parseInt(bakingFilterYear);

    // Cost range filter
    const matchesCost =
      (bakingFilterMinCost === "" || purchase.totalCost >= Number(bakingFilterMinCost)) &&
      (bakingFilterMaxCost === "" || purchase.totalCost <= Number(bakingFilterMaxCost));

    return matchesSearch && matchesStatus && matchesPurpose && matchesSupplier && matchesMonth && matchesYear && matchesCost;
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

  // Check if any active filters for finished products
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

  // Check if any active filters for baking supplies
  useEffect(() => {
    setHasActiveBakingFilters(
      bakingFilterStatus !== "all" ||
      bakingFilterSupplier !== "" ||
      bakingFilterPurpose !== "all" ||
      bakingFilterMonth !== "all" ||
      bakingFilterYear !== "all" ||
      bakingFilterMinCost !== "" ||
      bakingFilterMaxCost !== ""
    );
  }, [bakingFilterStatus, bakingFilterSupplier, bakingFilterPurpose, bakingFilterMonth, bakingFilterYear, bakingFilterMinCost, bakingFilterMaxCost]);

  // Clear all filters for finished products
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterSupplier("");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterMinCost("");
    setFilterMaxCost("");
  };

  // Clear all filters for baking supplies
  const clearBakingFilters = () => {
    setBakingFilterStatus("all");
    setBakingFilterSupplier("");
    setBakingFilterPurpose("all");
    setBakingFilterMonth("all");
    setBakingFilterYear("all");
    setBakingFilterMinCost("");
    setBakingFilterMaxCost("");
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

  // Get unique years from baking supply purchases
  const getAvailableBakingSupplyYears = () => {
    const years = new Set(
      bakingSupplyPurchases.map((purchase) => 
        purchase.date instanceof Date ? purchase.date.getFullYear() : new Date(purchase.date).getFullYear()
      )
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  // Export to CSV for finished products
  const exportToCSV = () => {
    const headers = ["Date", "Time", "Item Name", "Supplier", "Items", "Item Price", "Total Cost", "Status"];
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
    link.setAttribute("download", `purchases_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV for baking supplies
  const exportBakingSuppliesToCSV = () => {
    const headers = ["Date", "Time", "Supply Name", "Category", "Supplier", "Quantity", "Unit", "Unit Price", "Total Cost", "Purpose", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredBakingSupplyPurchases.map((purchase) =>
        [
          purchase.date.toISOString().split('T')[0],
          purchase.time || "",
          purchase.supplyName,
          purchase.category,
          purchase.supplier,
          purchase.quantity,
          purchase.unit,
          purchase.unitPrice,
          purchase.totalCost,
          purchase.purpose,
          purchase.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `baking_supply_purchases_${new Date().toISOString().split('T')[0]}.csv`);
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

  // View baking supply purchase details
  const viewBakingSupplyPurchase = (purchase: BakingSupplyPurchase) => {
    setSelectedBakingSupplyPurchase(purchase);
    setIsViewBakingSupplyDialogOpen(true);
  };

  // Edit baking supply purchase
  const editBakingSupplyPurchase = (purchase: BakingSupplyPurchase) => {
    setSelectedBakingSupplyPurchase(purchase);
    setIsEditBakingSupplyDialogOpen(true);
  };

  // Calculate summary stats for finished products
  const totalPurchases = purchases.length;
  const receivedPurchases = purchases.filter((p) => p.status === "received").length;
  const pendingPurchases = purchases.filter((p) => p.status === "pending").length;
  const totalCost = purchases.reduce((acc, p) => acc + p.totalCost, 0);

  // Calculate summary stats for baking supplies
  const totalBakingSupplyPurchases = bakingSupplyPurchases.length;
  const receivedBakingSupplyPurchases = bakingSupplyPurchases.filter((p) => p.status === "received").length;
  const pendingBakingSupplyPurchases = bakingSupplyPurchases.filter((p) => p.status === "pending").length;
  const totalBakingSupplyCost = bakingSupplyPurchases.reduce((acc, p) => acc + p.totalCost, 0);

  // Calculate total amounts spent
  const totalAmountSpent = totalCost + totalBakingSupplyCost;
  const totalFinishedProductsCost = totalCost;
  const totalBakingSuppliesCost = totalBakingSupplyCost;

  return (
    <ERPLayout title="Purchases" subtitle="Track purchases and supplier orders">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="finished-products">Finished Products</TabsTrigger>
          <TabsTrigger value="baking-supplies">Baking Supplies</TabsTrigger>
          <TabsTrigger value="amounts">Amounts</TabsTrigger>
        </TabsList>

        {/* Finished Products Tab */}
        <TabsContent value="finished-products">
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">
                  {totalPurchases}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Received Orders</p>
                <p className="text-2xl font-bold">
                  {receivedPurchases}
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
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-semibold">Finished Products Purchase Orders</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search purchases..."
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
                    <span className="hidden sm:inline">New Purchase</span>
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
                    <label className="text-sm font-medium">Supplier</label>
                    <Input
                      placeholder="Search supplier..."
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
                <p className="text-sm text-muted-foreground">Loading purchases...</p>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No purchases found</p>
                  <Button onClick={() => setIsNewPurchaseDialogOpen(true)}>
                    Create your first purchase
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
                        <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="hidden md:table-cell">Item Price</TableHead>
                        <TableHead>Total Cost</TableHead>
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
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editPurchase(purchase)}
                              >
                                <Edit className="h-4 w-4" />
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
        </TabsContent>

        {/* Baking Supplies Tab */}
        <TabsContent value="baking-supplies">
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Baking Supply Purchases</p>
                <p className="text-2xl font-bold">
                  {totalBakingSupplyPurchases}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Received Orders</p>
                <p className="text-2xl font-bold">
                  {receivedBakingSupplyPurchases}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">
                  {pendingBakingSupplyPurchases}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-semibold">Baking Supplies Purchase Orders</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search baking supplies..."
                    className="w-full pl-9 sm:w-64"
                    value={bakingSearchQuery}
                    onChange={(e) => setBakingSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBakingFilters(!showBakingFilters)}
                    className={hasActiveBakingFilters ? "border-erp-blue text-erp-blue" : ""}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveBakingFilters && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-erp-blue" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportBakingSuppliesToCSV}>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button variant="success" size="sm" onClick={() => setIsNewBakingSupplyPurchaseDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Purchase</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Filters Section */}
            {showBakingFilters && (
              <CardContent className="border-b">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={bakingFilterStatus} onValueChange={setBakingFilterStatus}>
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

                  {/* Purpose Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Purpose</label>
                    <Select value={bakingFilterPurpose} onValueChange={setBakingFilterPurpose}>
                      <SelectTrigger>
                        <SelectValue placeholder="All purposes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Purposes</SelectItem>
                        <SelectItem value="resale">Resale</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Supplier Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier</label>
                    <Input
                      placeholder="Search supplier..."
                      value={bakingFilterSupplier}
                      onChange={(e) => setBakingFilterSupplier(e.target.value)}
                    />
                  </div>

                  {/* Month Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={bakingFilterMonth} onValueChange={setBakingFilterMonth}>
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
                    <Select value={bakingFilterYear} onValueChange={setBakingFilterYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {getAvailableBakingSupplyYears().map((year) => (
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
                        value={bakingFilterMinCost}
                        onChange={(e) => setBakingFilterMinCost(e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={bakingFilterMaxCost}
                        onChange={(e) => setBakingFilterMaxCost(e.target.value)}
                        min="0"
                      />
                    </div>
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
                <p className="text-sm text-muted-foreground">Loading baking supply purchases...</p>
              ) : filteredBakingSupplyPurchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No baking supply purchases found</p>
                  <Button onClick={() => setIsNewBakingSupplyPurchaseDialogOpen(true)}>
                    Create your first baking supply purchase
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Supply Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="hidden md:table-cell">Unit</TableHead>
                        <TableHead className="hidden md:table-cell">Unit Price</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead className="hidden lg:table-cell">Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBakingSupplyPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">
                            {purchase.date instanceof Date
                              ? purchase.date.toLocaleDateString()
                              : new Date(purchase.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{purchase.time || ""}</TableCell>
                          <TableCell>{purchase.supplyName}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {purchase.category}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {purchase.supplier}
                          </TableCell>
                          <TableCell>{purchase.quantity}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {purchase.unit}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            KSh {purchase.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>KSh {purchase.totalCost.toLocaleString()}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline">
                              {purchase.purpose}
                            </Badge>
                          </TableCell>
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
                                onClick={() => viewBakingSupplyPurchase(purchase)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editBakingSupplyPurchase(purchase)}
                              >
                                <Edit className="h-4 w-4" />
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
        </TabsContent>

        {/* Amounts Tab */}
        <TabsContent value="amounts">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-erp-blue" />
                  <p className="text-sm text-muted-foreground">Total Amount Spent</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  KSh {totalAmountSpent.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-erp-green" />
                  <p className="text-sm text-muted-foreground">Finished Products</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  KSh {totalFinishedProductsCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalPurchases} purchases
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-erp-orange" />
                  <p className="text-sm text-muted-foreground">Baking Supplies</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  KSh {totalBakingSuppliesCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBakingSupplyPurchases} purchases
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                </div>
                <p className="text-2xl font-bold mt-2">
                  KSh {(
                    purchases.filter(p => p.status === "pending").reduce((acc, p) => acc + p.totalCost, 0) +
                    bakingSupplyPurchases.filter(p => p.status === "pending").reduce((acc, p) => acc + p.totalCost, 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingPurchases + pendingBakingSupplyPurchases} pending orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown by Purpose (Baking Supplies) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Baking Supplies by Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">For Resale</p>
                  <p className="text-xl font-bold">
                    KSh {bakingSupplyPurchases.filter(p => p.purpose === "resale").reduce((acc, p) => acc + p.totalCost, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bakingSupplyPurchases.filter(p => p.purpose === "resale").length} purchases
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">For Production</p>
                  <p className="text-xl font-bold">
                    KSh {bakingSupplyPurchases.filter(p => p.purpose === "production").reduce((acc, p) => acc + p.totalCost, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bakingSupplyPurchases.filter(p => p.purpose === "production").length} purchases
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">For Both</p>
                  <p className="text-xl font-bold">
                    KSh {bakingSupplyPurchases.filter(p => p.purpose === "both").reduce((acc, p) => acc + p.totalCost, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bakingSupplyPurchases.filter(p => p.purpose === "both").length} purchases
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Finished Products</TableHead>
                      <TableHead>Baking Supplies</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i;
                      const currentYear = new Date().getFullYear();
                      const finishedProductsTotal = purchases
                        .filter(p => {
                          const date = p.date instanceof Date ? p.date : new Date(p.date);
                          return date.getMonth() === month && date.getFullYear() === currentYear;
                        })
                        .reduce((acc, p) => acc + p.totalCost, 0);
                      const bakingSuppliesTotal = bakingSupplyPurchases
                        .filter(p => {
                          const date = p.date instanceof Date ? p.date : new Date(p.date);
                          return date.getMonth() === month && date.getFullYear() === currentYear;
                        })
                        .reduce((acc, p) => acc + p.totalCost, 0);
                      
                      const monthNames = ["January", "February", "March", "April", "May", "June", 
                                         "July", "August", "September", "October", "November", "December"];
                      
                      return (
                        <TableRow key={month}>
                          <TableCell className="font-medium">{monthNames[month]}</TableCell>
                          <TableCell>KSh {finishedProductsTotal.toLocaleString()}</TableCell>
                          <TableCell>KSh {bakingSuppliesTotal.toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">
                            KSh {(finishedProductsTotal + bakingSuppliesTotal).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <DialogTitle>Purchase Details</DialogTitle>
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
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{selectedPurchase.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{selectedPurchase.items}</span>
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

      {/* New Baking Supply Purchase Dialog */}
      <NewBakingSupplyPurchaseDialog
        isOpen={isNewBakingSupplyPurchaseDialogOpen}
        onClose={() => setIsNewBakingSupplyPurchaseDialogOpen(false)}
        onPurchaseAdded={fetchBakingSupplyPurchases}
      />

      {/* Edit Baking Supply Purchase Dialog */}
      <EditBakingSupplyPurchaseDialog
        isOpen={isEditBakingSupplyDialogOpen}
        onClose={() => setIsEditBakingSupplyDialogOpen(false)}
        onPurchaseUpdated={fetchBakingSupplyPurchases}
        purchase={selectedBakingSupplyPurchase}
      />

      {/* View Baking Supply Purchase Details Dialog */}
      <Dialog open={isViewBakingSupplyDialogOpen} onOpenChange={setIsViewBakingSupplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Baking Supply Purchase Details</DialogTitle>
          </DialogHeader>
          {selectedBakingSupplyPurchase && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {selectedBakingSupplyPurchase.date instanceof Date
                    ? selectedBakingSupplyPurchase.date.toLocaleDateString()
                    : new Date(selectedBakingSupplyPurchase.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.time || ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch ID:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.batchId || ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supply Name:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.supplyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{selectedBakingSupplyPurchase.quantity} {selectedBakingSupplyPurchase.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium">KSh {selectedBakingSupplyPurchase.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">KSh {selectedBakingSupplyPurchase.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose:</span>
                <Badge variant="outline">{selectedBakingSupplyPurchase.purpose}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    selectedBakingSupplyPurchase.status === "received" ? "default" : "secondary"
                  }
                  className={
                    selectedBakingSupplyPurchase.status === "received"
                      ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                      : selectedBakingSupplyPurchase.status === "pending"
                      ? "bg-erp-orange/10 text-erp-orange hover:bg-erp-orange/20"
                      : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                  }
                >
                  {selectedBakingSupplyPurchase.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewBakingSupplyDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERPLayout>
  );
}
