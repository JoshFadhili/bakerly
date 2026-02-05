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
import { Search, Filter, Download, Eye, X } from "lucide-react";
import { getSales } from "@/services/salesService";
import { Sale } from "@/types/sale";
import NewSaleDialog from "@/components/sales/NewSaleDialog";
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
import { useSaleDialog } from "@/contexts/SaleDialogContext";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const { isNewSaleDialogOpen: globalDialogOpen, closeNewSaleDialog } = useSaleDialog();
  
  // Filter states
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // View sale details
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Sync with global dialog state
  useEffect(() => {
    if (globalDialogOpen) {
      setIsNewSaleDialogOpen(true);
      closeNewSaleDialog();
    }
  }, [globalDialogOpen, closeNewSaleDialog]);

  // Fetch sales from Firestore
  const fetchSales = async () => {
    try {
      const salesList = await getSales();
      setSales(salesList);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter sales based on search query and active filters
  const filteredSales = sales.filter((sale) => {
    // Search filter
    const matchesSearch =
      sale.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.payment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.status.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;

    // Payment filter
    const matchesPayment = filterPayment === "all" || sale.payment === filterPayment;

    // Amount range filter
    const matchesAmount =
      (filterMinAmount === "" || sale.totalAmount >= Number(filterMinAmount)) &&
      (filterMaxAmount === "" || sale.totalAmount <= Number(filterMaxAmount));

    return matchesSearch && matchesStatus && matchesPayment && matchesAmount;
  });

  // Check if any active filters
  useEffect(() => {
    setHasActiveFilters(
      filterStatus !== "all" ||
      filterPayment !== "all" ||
      filterMinAmount !== "" ||
      filterMaxAmount !== ""
    );
  }, [filterStatus, filterPayment, filterMinAmount, filterMaxAmount]);

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPayment("all");
    setFilterMinAmount("");
    setFilterMaxAmount("");
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Item Name", "Items", "Total Amount", "Payment", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredSales.map((sale) =>
        [
          sale.date.toISOString().split('T')[0],
          sale.itemName,
          sale.items,
          sale.totalAmount,
          sale.payment,
          sale.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View sale details
  const viewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

  return (
    <ERPLayout title="Sales" subtitle="Track and manage all sales transactions">
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">
            Sales Transactions
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading sales...</p>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No sales found</p>
              <Button onClick={() => setIsNewSaleDialogOpen(true)}>
                Create your first sale
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.date instanceof Date
                          ? sale.date.toLocaleDateString()
                          : new Date(sale.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{sale.itemName}</TableCell>
                      <TableCell>{sale.items}</TableCell>
                      <TableCell>KSh {sale.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {sale.payment}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "completed" ? "default" : "secondary"
                          }
                          className={
                            sale.status === "completed"
                              ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                              : sale.status === "pending"
                              ? "bg-erp-yellow/10 text-erp-yellow hover:bg-erp-yellow/20"
                              : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <NewSaleDialog
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleAdded={fetchSales}
      />

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Sales</DialogTitle>
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterPayment">Payment Method</Label>
              <Select
                value={filterPayment}
                onValueChange={setFilterPayment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount Range (KSh)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  type="number"
                  min="0"
                  value={filterMinAmount}
                  onChange={(e) => setFilterMinAmount(e.target.value)}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  min="0"
                  value={filterMaxAmount}
                  onChange={(e) => setFilterMaxAmount(e.target.value)}
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

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {selectedSale.date instanceof Date
                    ? selectedSale.date.toLocaleDateString()
                    : new Date(selectedSale.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Name:</span>
                <span className="font-medium">{selectedSale.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{selectedSale.items}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  KSh {selectedSale.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{selectedSale.payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    selectedSale.status === "completed" ? "default" : "secondary"
                  }
                  className={
                    selectedSale.status === "completed"
                      ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                      : selectedSale.status === "pending"
                      ? "bg-erp-yellow/10 text-erp-yellow hover:bg-erp-yellow/20"
                      : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                  }
                >
                  {selectedSale.status}
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
