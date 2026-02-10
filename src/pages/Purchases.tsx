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
import { Search, Filter, Download, Eye, Edit, Plus } from "lucide-react";
import { getPurchases } from "@/services/purchaseService";
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
import { Label } from "@/components/ui/label";

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  // Filter states
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterMinCost, setFilterMinCost] = useState<string>("");
  const [filterMaxCost, setFilterMaxCost] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Fetch purchases from Firestore
  const fetchPurchases = async () => {
    try {
      const purchasesList = await getPurchases();
      setPurchases(purchasesList);
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

    // Cost range filter
    const matchesCost =
      (filterMinCost === "" || purchase.totalCost >= Number(filterMinCost)) &&
      (filterMaxCost === "" || purchase.totalCost <= Number(filterMaxCost));

    return matchesSearch && matchesStatus && matchesSupplier && matchesCost;
  });

  // Check if any active filters
  useEffect(() => {
    setHasActiveFilters(
      filterStatus !== "all" ||
      filterSupplier !== "" ||
      filterMinCost !== "" ||
      filterMaxCost !== ""
    );
  }, [filterStatus, filterSupplier, filterMinCost, filterMaxCost]);

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterSupplier("");
    setFilterMinCost("");
    setFilterMaxCost("");
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Item Name", "Supplier", "Items", "Item Price", "Total Cost", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredPurchases.map((purchase) =>
        [
          purchase.date.toISOString().split('T')[0],
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

  // Calculate summary stats
  const totalPurchases = purchases.length;
  const receivedPurchases = purchases.filter((p) => p.status === "received").length;
  const pendingPurchases = purchases.filter((p) => p.status === "pending").length;
  const cancelledPurchases = purchases.filter((p) => p.status === "cancelled").length;
  const totalCost = purchases.reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <ERPLayout title="Purchases" subtitle="Track purchases and supplier orders">
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
          <CardTitle className="text-lg font-semibold">Purchase Orders</CardTitle>
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
                onClick={() => setIsFilterDialogOpen(true)}
                className={hasActiveFilters ? "border-erp-blue text-erp-blue" : ""}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
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

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Purchases</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filterStatus">Status</Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterSupplier">Supplier</Label>
              <Input
                id="filterSupplier"
                placeholder="Search supplier..."
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cost Range (KSh)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  type="number"
                  min="0"
                  value={filterMinCost}
                  onChange={(e) => setFilterMinCost(e.target.value)}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  min="0"
                  value={filterMaxCost}
                  onChange={(e) => setFilterMaxCost(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </ERPLayout>
  );
}
