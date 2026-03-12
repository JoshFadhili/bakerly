import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Search, Filter, Download, Eye, Edit, X, Plus, Clock, Wrench, ShoppingCart } from "lucide-react";
import { getSales } from "@/services/salesService";
import { Sale } from "@/types/sale";
import { getServicesOffered } from "@/services/serviceOfferedService";
import { ServiceOffered } from "@/types/serviceOffered";
import NewSaleDialog from "@/components/sales/NewSaleDialog";
import EditSaleDialog from "@/components/sales/EditSaleDialog";
import NewServiceOfferedDialog from "@/components/sales/NewServiceOfferedDialog";
import EditServiceOfferedDialog from "@/components/sales/EditServiceOfferedDialog";
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
import { useSaleDialog } from "@/contexts/SaleDialogContext";
import { useServiceOfferedDialog } from "@/contexts/ServiceOfferedDialogContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sortByDateTimeDesc } from "@/lib/sortingUtils";
import { toast } from "sonner";

export default function Sales() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [servicesOffered, setServicesOffered] = useState<ServiceOffered[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [isNewServiceOfferedDialogOpen, setIsNewServiceOfferedDialogOpen] = useState(false);
  const { isNewSaleDialogOpen: globalDialogOpen, closeNewSaleDialog } = useSaleDialog();
  const { isNewServiceOfferedDialogOpen: globalServiceDialogOpen, closeNewServiceOfferedDialog } = useServiceOfferedDialog();
  const [activeTab, setActiveTab] = useState("sales");
  
  // Product from FinishedProducts page
  const [productFromFinishedProducts, setProductFromFinishedProducts] = useState<{
    batchId: string;
    itemName: string;
    itemsAvailable: number;
    unitPrice: number;
    supplier: string;
  } | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // View/Edit sale details
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // View/Edit service offered details
  const [selectedServiceOffered, setSelectedServiceOffered] = useState<ServiceOffered | null>(null);
  const [isViewServiceOfferedDialogOpen, setIsViewServiceOfferedDialogOpen] = useState(false);
  const [isEditServiceOfferedDialogOpen, setIsEditServiceOfferedDialogOpen] = useState(false);

  // Sync with global dialog state
  useEffect(() => {
    if (globalDialogOpen) {
      setIsNewSaleDialogOpen(true);
      closeNewSaleDialog();
    }
  }, [globalDialogOpen, closeNewSaleDialog]);

  // Sync with global service offered dialog state
  useEffect(() => {
    if (globalServiceDialogOpen) {
      setIsNewServiceOfferedDialogOpen(true);
      setActiveTab("services");
      closeNewServiceOfferedDialog();
    }
  }, [globalServiceDialogOpen, closeNewServiceOfferedDialog]);

  // Handle incoming product from FinishedProducts page
  useEffect(() => {
    const state = location.state as { productForSale?: {
      batchId: string;
      itemName: string;
      itemsAvailable: number;
      unitPrice: number;
      supplier: string;
    } } | null;
    
    if (state?.productForSale) {
      setProductFromFinishedProducts(state.productForSale);
      setIsNewSaleDialogOpen(true);
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
      toast.info(`Creating sale for ${state.productForSale.itemName}`);
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch sales and services offered from Firestore
  const fetchData = async () => {
    try {
      const [salesList, servicesOfferedList] = await Promise.all([
        getSales(),
        getServicesOffered(),
      ]);
      setSales(sortByDateTimeDesc(salesList));
      setServicesOffered(sortByDateTimeDesc(servicesOfferedList));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate sales statistics
  const totalSales = sales.length;
  const completedSales = sales.filter((s) => s.status === "completed").length;
  const pendingSales = sales.filter((s) => s.status === "pending").length;
  const cancelledSales = sales.filter((s) => s.status === "cancelled").length;
  const totalSalesAmount = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Calculate services statistics
  const totalServices = servicesOffered.length;
  const completedServices = servicesOffered.filter((s) => s.status === "completed").length;
  const pendingServices = servicesOffered.filter((s) => s.status === "pending").length;
  const totalServicesAmount = servicesOffered.reduce((acc, s) => acc + s.totalAmount, 0);

  // Filter sales based on search query and active filters
  const filteredSales = sales.filter((sale) => {
    // Search filter
    const matchesSearch =
      sale.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.payment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.customer && sale.customer.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;

    // Payment filter
    const matchesPayment = filterPayment === "all" || sale.payment === filterPayment;

    // Customer filter
    const matchesCustomer = filterCustomer === "" || 
      (sale.customer && sale.customer.toLowerCase().includes(filterCustomer.toLowerCase()));

    // Month filter
    const matchesMonth = filterMonth === "all" || 
      (sale.date instanceof Date ? sale.date.getMonth() + 1 : new Date(sale.date).getMonth() + 1) === parseInt(filterMonth);

    // Year filter
    const matchesYear = filterYear === "all" || 
      (sale.date instanceof Date ? sale.date.getFullYear() : new Date(sale.date).getFullYear()) === parseInt(filterYear);

    // Amount range filter
    const matchesAmount =
      (filterMinAmount === "" || sale.totalAmount >= Number(filterMinAmount)) &&
      (filterMaxAmount === "" || sale.totalAmount <= Number(filterMaxAmount));

    return matchesSearch && matchesStatus && matchesPayment && matchesCustomer && matchesMonth && matchesYear && matchesAmount;
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

  // Filter services offered based on search query and active filters
  const filteredServicesOffered = servicesOffered.filter((service) => {
    // Search filter
    const matchesSearch =
      service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.payment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.customer && service.customer.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = filterStatus === "all" || service.status === filterStatus;

    // Payment filter
    const matchesPayment = filterPayment === "all" || service.payment === filterPayment;

    // Customer filter
    const matchesCustomer = filterCustomer === "" || 
      (service.customer && service.customer.toLowerCase().includes(filterCustomer.toLowerCase()));

    // Month filter
    const matchesMonth = filterMonth === "all" || 
      (service.date instanceof Date ? service.date.getMonth() + 1 : new Date(service.date).getMonth() + 1) === parseInt(filterMonth);

    // Year filter
    const matchesYear = filterYear === "all" || 
      (service.date instanceof Date ? service.date.getFullYear() : new Date(service.date).getFullYear()) === parseInt(filterYear);

    // Amount range filter
    const matchesAmount =
      (filterMinAmount === "" || service.totalAmount >= Number(filterMinAmount)) &&
      (filterMaxAmount === "" || service.totalAmount <= Number(filterMaxAmount));

    return matchesSearch && matchesStatus && matchesPayment && matchesCustomer && matchesMonth && matchesYear && matchesAmount;
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
      filterPayment !== "all" ||
      filterCustomer !== "" ||
      filterMonth !== "all" ||
      filterYear !== "all" ||
      filterMinAmount !== "" ||
      filterMaxAmount !== ""
    );
  }, [filterStatus, filterPayment, filterCustomer, filterMonth, filterYear, filterMinAmount, filterMaxAmount]);

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPayment("all");
    setFilterCustomer("");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterMinAmount("");
    setFilterMaxAmount("");
  };

  // Get unique years from sales and services
  const getAvailableYears = () => {
    const salesYears = sales.map((sale) => 
      sale.date instanceof Date ? sale.date.getFullYear() : new Date(sale.date).getFullYear()
    );
    const serviceYears = servicesOffered.map((service) => 
      service.date instanceof Date ? service.date.getFullYear() : new Date(service.date).getFullYear()
    );
    const years = new Set([...salesYears, ...serviceYears]);
    return Array.from(years).sort((a, b) => b - a);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (activeTab === "sales") {
      const headers = ["Date", "Time", "Item Name", "Items", "Total Amount", "Payment", "Status", "Customer", "COGS", "Gross Profit"];
      const csvContent = [
        headers.join(","),
        ...filteredSales.map((sale) =>
          [
            sale.date.toISOString().split('T')[0],
            sale.time,
            sale.itemName,
            sale.items,
            sale.totalAmount,
            sale.payment,
            sale.status,
            sale.customer || "",
            sale.cogs || "",
            sale.grossProfit || "",
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
    } else {
      const headers = ["Date", "Time", "Service Name", "Total Amount", "Payment", "Status", "Customer"];
      const csvContent = [
        headers.join(","),
        ...filteredServicesOffered.map((service) =>
          [
            service.date.toISOString().split('T')[0],
            service.time,
            service.serviceName,
            service.totalAmount,
            service.payment,
            service.status,
            service.customer || "",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `services_offered_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // View sale details
  const viewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

  // Edit sale
  const editSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };

  // View service offered details
  const viewServiceOffered = (service: ServiceOffered) => {
    setSelectedServiceOffered(service);
    setIsViewServiceOfferedDialogOpen(true);
  };

  // Edit service offered
  const editServiceOffered = (service: ServiceOffered) => {
    setSelectedServiceOffered(service);
    setIsEditServiceOfferedDialogOpen(true);
  };

  return (
    <ERPLayout title="Sales" subtitle="Track and manage all sales transactions">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {activeTab === "sales" ? (
          <>
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completed Sales</p>
                <p className="text-2xl font-bold">{completedSales}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Sales</p>
                <p className="text-2xl font-bold">{pendingSales}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-red">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Cancelled Sales</p>
                <p className="text-2xl font-bold">{cancelledSales}</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-erp-blue">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Services Sold</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-green">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completed Services</p>
                <p className="text-2xl font-bold">{completedServices}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-erp-orange">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Services</p>
                <p className="text-2xl font-bold">{pendingServices}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">
            Sales Transactions
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payment methods" />
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

              {/* Customer Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Input
                  placeholder="Search customer..."
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
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

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range (KSh)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="services">Services Offered</TabsTrigger>
            </TabsList>
            
            {/* Sales Tab */}
            <TabsContent value="sales" className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading sales...</p>
              ) : filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No sales found</p>
                  <Button onClick={() => setIsNewSaleDialogOpen(true)}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create your first sale
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
                        <TableHead>Items</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Customer</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {sale.time}
                            </div>
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
                          <TableCell className="hidden md:table-cell">
                            {sale.customer || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewSale(sale)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editSale(sale)}
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
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsNewSaleDialogOpen(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </div>
            </TabsContent>
            
            {/* Services Offered Tab */}
            <TabsContent value="services" className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading services offered...</p>
              ) : filteredServicesOffered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No services offered found</p>
                  <Button onClick={() => setIsNewServiceOfferedDialogOpen(true)}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Record your first service offered
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Customer</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServicesOffered.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.date instanceof Date
                              ? service.date.toLocaleDateString()
                              : new Date(service.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {service.time}
                            </div>
                          </TableCell>
                          <TableCell>{service.serviceName}</TableCell>
                          <TableCell>KSh {service.totalAmount.toLocaleString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {service.payment}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                service.status === "completed" ? "default" : "secondary"
                              }
                              className={
                                service.status === "completed"
                                  ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                                  : service.status === "pending"
                                  ? "bg-erp-yellow/10 text-erp-yellow hover:bg-erp-yellow/20"
                                  : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                              }
                            >
                              {service.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {service.customer || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewServiceOffered(service)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editServiceOffered(service)}
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
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsNewServiceOfferedDialogOpen(true)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  New Service Offered
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <NewSaleDialog
        isOpen={isNewSaleDialogOpen}
        onClose={() => {
          setIsNewSaleDialogOpen(false);
          setProductFromFinishedProducts(null);
        }}
        onSaleAdded={fetchData}
        finishedProductData={productFromFinishedProducts}
      />

      {/* Edit Sale Dialog */}
      <EditSaleDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSaleUpdated={fetchData}
        sale={selectedSale}
      />

      {/* New Service Offered Dialog */}
      <NewServiceOfferedDialog
        isOpen={isNewServiceOfferedDialogOpen}
        onClose={() => setIsNewServiceOfferedDialogOpen(false)}
        onServiceOfferedAdded={fetchData}
      />

      {/* Edit Service Offered Dialog */}
      <EditServiceOfferedDialog
        isOpen={isEditServiceOfferedDialogOpen}
        onClose={() => setIsEditServiceOfferedDialogOpen(false)}
        onServiceOfferedUpdated={fetchData}
        serviceOffered={selectedServiceOffered}
      />

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
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{selectedSale.time}</span>
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
              {selectedSale.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedSale.customer}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">COGS:</span>
                <span className="font-medium">
                  KSh {(selectedSale.cogs ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Profit:</span>
                <span className="font-medium">
                  KSh {(selectedSale.grossProfit ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Service Offered Dialog */}
      <Dialog open={isViewServiceOfferedDialogOpen} onOpenChange={setIsViewServiceOfferedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Service Offered Details</DialogTitle>
          </DialogHeader>
          {selectedServiceOffered && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {selectedServiceOffered.date instanceof Date
                    ? selectedServiceOffered.date.toLocaleDateString()
                    : new Date(selectedServiceOffered.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{selectedServiceOffered.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Name:</span>
                <span className="font-medium">{selectedServiceOffered.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  KSh {selectedServiceOffered.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{selectedServiceOffered.payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    selectedServiceOffered.status === "completed" ? "default" : "secondary"
                  }
                  className={
                    selectedServiceOffered.status === "completed"
                      ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                      : selectedServiceOffered.status === "pending"
                      ? "bg-erp-yellow/10 text-erp-yellow hover:bg-erp-yellow/20"
                      : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                  }
                >
                  {selectedServiceOffered.status}
                </Badge>
              </div>
              {selectedServiceOffered.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedServiceOffered.customer}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewServiceOfferedDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERPLayout>
  );
}
