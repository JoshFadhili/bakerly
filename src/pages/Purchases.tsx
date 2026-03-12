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
import { Search, Filter, Download, Eye, Edit, Plus, DollarSign } from "lucide-react";
import { getBakingSupplyPurchases } from "@/services/bakingSupplyPurchaseService";
import { BakingSupplyPurchase } from "@/types/bakingSupplyPurchase";
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
import { useBakingSupplyPurchaseDialog } from "@/contexts/BakingSupplyPurchaseDialogContext";

export default function Purchases() {
  // Baking Supplies State
  const [bakingSupplyPurchases, setBakingSupplyPurchases] = useState<BakingSupplyPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBakingSupplyPurchaseDialogOpen, setIsNewBakingSupplyPurchaseDialogOpen] = useState(false);
  const [isViewBakingSupplyDialogOpen, setIsViewBakingSupplyDialogOpen] = useState(false);
  const [isEditBakingSupplyDialogOpen, setIsEditBakingSupplyDialogOpen] = useState(false);
  const [selectedBakingSupplyPurchase, setSelectedBakingSupplyPurchase] = useState<BakingSupplyPurchase | null>(null);
  const { isNewBakingSupplyPurchaseDialogOpen: globalDialogOpen, closeNewBakingSupplyPurchaseDialog } = useBakingSupplyPurchaseDialog();

  // Sync with global dialog state
  useEffect(() => {
    if (globalDialogOpen) {
      setIsNewBakingSupplyPurchaseDialogOpen(true);
      closeNewBakingSupplyPurchaseDialog();
    }
  }, [globalDialogOpen, closeNewBakingSupplyPurchaseDialog]);

  // Filter states for Baking Supplies
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMinCost, setFilterMinCost] = useState<string>("");
  const [filterMaxCost, setFilterMaxCost] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Fetch baking supply purchases from Firestore
  const fetchBakingSupplyPurchases = async () => {
    try {
      const purchasesList = await getBakingSupplyPurchases();
      setBakingSupplyPurchases(sortByDateTimeDesc(purchasesList));
    } catch (error) {
      console.error("Error fetching baking supply purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBakingSupplyPurchases();
  }, []);

  // Filter baking supply purchases based on search query and active filters
  const filteredBakingSupplyPurchases = bakingSupplyPurchases.filter((purchase) => {
    // Search filter
    const matchesSearch =
      purchase.supplyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === "all" || purchase.status === filterStatus;

    // Purpose filter
    const matchesPurpose = filterPurpose === "all" || purchase.purpose === filterPurpose;

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

  // Check if any active filters
  useEffect(() => {
    setHasActiveFilters(
      filterStatus !== "all" ||
      filterSupplier !== "" ||
      filterPurpose !== "all" ||
      filterMonth !== "all" ||
      filterYear !== "all" ||
      filterMinCost !== "" ||
      filterMaxCost !== ""
    );
  }, [filterStatus, filterSupplier, filterPurpose, filterMonth, filterYear, filterMinCost, filterMaxCost]);

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterSupplier("");
    setFilterPurpose("all");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterMinCost("");
    setFilterMaxCost("");
  };

  // Get unique years from baking supply purchases
  const getAvailableYears = () => {
    const years = new Set(
      bakingSupplyPurchases.map((purchase) => 
        purchase.date instanceof Date ? purchase.date.getFullYear() : new Date(purchase.date).getFullYear()
      )
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  // Export to CSV for baking supplies
  const exportToCSV = () => {
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

  // Calculate summary stats for baking supplies
  const totalBakingSupplyPurchases = bakingSupplyPurchases.length;
  const receivedBakingSupplyPurchases = bakingSupplyPurchases.filter((p) => p.status === "received").length;
  const pendingBakingSupplyPurchases = bakingSupplyPurchases.filter((p) => p.status === "pending").length;
  const totalBakingSupplyCost = bakingSupplyPurchases.reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <ERPLayout title="Baking Supply Purchases" subtitle="Track baking supply purchases and supplier orders">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Purchases</p>
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
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-muted-foreground">Total Amount Spent</p>
            </div>
            <p className="text-2xl font-bold mt-2">
              KSh {totalBakingSupplyCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Purpose */}
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

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Baking Supplies Purchase Orders</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search baking supplies..."
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
              <Button variant="success" size="sm" onClick={() => setIsNewBakingSupplyPurchaseDialogOpen(true)}>
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

              {/* Purpose Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <Select value={filterPurpose} onValueChange={setFilterPurpose}>
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
