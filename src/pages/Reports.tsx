import { useState, useEffect } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Search, Filter, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getReportItems,
  getReportSummary,
  getSalesGrowthData,
  getRevenueByProductData,
  getRevenueByCategoryData,
  getBestPerformingProductsData,
  getAvailableCategories,
  exportReportItemsToCSV,
  type ReportItem,
  type ReportSummary,
  type SalesGrowthData,
  type RevenueByProductData,
  type RevenueByCategoryData,
  type BestPerformingProductsData,
} from "@/services/reportsService";

const COLORS = [
  "hsl(var(--erp-blue))",
  "hsl(var(--erp-green))",
  "hsl(var(--erp-orange))",
  "hsl(var(--erp-teal))",
  "hsl(var(--erp-purple))",
  "hsl(var(--erp-red))",
  "hsl(var(--erp-yellow))",
  "hsl(var(--erp-pink))",
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [filteredReportItems, setFilteredReportItems] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProfitLoss, setSelectedProfitLoss] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Chart data states
  const [salesGrowthData, setSalesGrowthData] = useState<SalesGrowthData[]>([]);
  const [revenueByProductData, setRevenueByProductData] = useState<RevenueByProductData[]>([]);
  const [revenueByCategoryData, setRevenueByCategoryData] = useState<RevenueByCategoryData[]>([]);
  const [bestPerformingProductsData, setBestPerformingProductsData] = useState<BestPerformingProductsData[]>([]);

  // Chart filter states
  const [salesGrowthPeriod, setSalesGrowthPeriod] = useState<string>("this_month_vs_last_month");
  const [revenueByProductPeriod, setRevenueByProductPeriod] = useState<string>("this_month_vs_last_month");
  const [bestProductsPeriod, setBestProductsPeriod] = useState<string>("all_time");

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Get categories
      const cats = await getAvailableCategories();
      setCategories(cats);

      // Calculate date range
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (dateFilter === "custom" && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === "this_month") {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === "last_month") {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === "this_year") {
        const now = new Date();
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === "last_year") {
        const now = new Date();
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        endDate.setHours(23, 59, 59, 999);
      }

      // Get report items with filters
      const items = await getReportItems(
        startDate,
        endDate,
        selectedCategory !== "all" ? selectedCategory : undefined,
        minAmount ? parseFloat(minAmount) : undefined,
        maxAmount ? parseFloat(maxAmount) : undefined,
        selectedProfitLoss !== "all" ? (selectedProfitLoss as "profit" | "loss") : undefined,
        selectedType !== "all" ? (selectedType as "goods" | "service") : undefined,
        searchTerm || undefined
      );

      setReportItems(items);
      setFilteredReportItems(items);

      // Get summary
      const sum = await getReportSummary(startDate, endDate);
      setSummary(sum);

      // Get chart data
      const salesGrowth = await getSalesGrowthData(startDate, endDate);
      setSalesGrowthData(salesGrowth);

      const revenueByProduct = await getRevenueByProductData(startDate, endDate);
      setRevenueByProductData(revenueByProduct);

      const revenueByCat = await getRevenueByCategoryData(startDate, endDate);
      setRevenueByCategoryData(revenueByCat);

      const bestProducts = await getBestPerformingProductsData(startDate, endDate);
      setBestPerformingProductsData(bestProducts);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);

        // Calculate date range
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (dateFilter === "custom" && customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else if (dateFilter === "this_month") {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (dateFilter === "last_month") {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (dateFilter === "this_year") {
          const now = new Date();
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
        } else if (dateFilter === "last_year") {
          const now = new Date();
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          endDate.setHours(23, 59, 59, 999);
        }

        // Get filtered report items
        const items = await getReportItems(
          startDate,
          endDate,
          selectedCategory !== "all" ? selectedCategory : undefined,
          minAmount ? parseFloat(minAmount) : undefined,
          maxAmount ? parseFloat(maxAmount) : undefined,
          selectedProfitLoss !== "all" ? (selectedProfitLoss as "profit" | "loss") : undefined,
          selectedType !== "all" ? (selectedType as "goods" | "service") : undefined,
          searchTerm || undefined
        );

        setFilteredReportItems(items);

        // Update summary
        const sum = await getReportSummary(startDate, endDate);
        setSummary(sum);

        // Update chart data
        const salesGrowth = await getSalesGrowthData(startDate, endDate);
        setSalesGrowthData(salesGrowth);

        const revenueByProduct = await getRevenueByProductData(startDate, endDate);
        setRevenueByProductData(revenueByProduct);

        const revenueByCat = await getRevenueByCategoryData(startDate, endDate);
        setRevenueByCategoryData(revenueByCat);

        const bestProducts = await getBestPerformingProductsData(startDate, endDate);
        setBestPerformingProductsData(bestProducts);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        setLoading(false);
      }
    };

    applyFilters();
  }, [searchTerm, selectedCategory, selectedType, selectedProfitLoss, minAmount, maxAmount, dateFilter, customStartDate, customEndDate]);

  // Export to CSV
  const handleExport = () => {
    const csv = exportReportItemsToCSV(filteredReportItems);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get filtered chart data based on period
  const getFilteredSalesGrowthData = () => {
    if (salesGrowthPeriod === "this_month_vs_last_month") {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      const lastMonth = `${now.getFullYear()}-${(now.getMonth()).toString().padStart(2, "0")}`;
      return salesGrowthData.filter(d => d.period === thisMonth || d.period === lastMonth);
    } else if (salesGrowthPeriod === "this_year") {
      const now = new Date();
      return salesGrowthData.filter(d => d.period.startsWith(`${now.getFullYear()}-`));
    } else if (salesGrowthPeriod === "last_year") {
      const now = new Date();
      return salesGrowthData.filter(d => d.period.startsWith(`${now.getFullYear() - 1}-`));
    }
    return salesGrowthData;
  };

  const getFilteredRevenueByProductData = () => {
    if (revenueByProductPeriod === "this_month_vs_last_month") {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      const lastMonth = `${now.getFullYear()}-${(now.getMonth()).toString().padStart(2, "0")}`;
      return revenueByProductData.filter(d => d.period === thisMonth || d.period === lastMonth);
    } else if (revenueByProductPeriod === "this_year") {
      const now = new Date();
      return revenueByProductData.filter(d => d.period.startsWith(`${now.getFullYear()}-`));
    } else if (revenueByProductPeriod === "last_year") {
      const now = new Date();
      return revenueByProductData.filter(d => d.period.startsWith(`${now.getFullYear() - 1}-`));
    }
    return revenueByProductData;
  };

  const getFilteredBestProductsData = () => {
    if (bestProductsPeriod === "this_month") {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      // Need to filter sales by date first, then aggregate
      return bestPerformingProductsData; // Simplified for now
    } else if (bestProductsPeriod === "this_year") {
      const now = new Date();
      // Need to filter sales by date first, then aggregate
      return bestPerformingProductsData; // Simplified for now
    }
    return bestPerformingProductsData;
  };

  return (
    <ERPLayout
      title="Reports"
      subtitle="Analyze sales performance and generate detailed reports"
    >
      <Tabs defaultValue="table" className="w-full">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <TabsContent value="table" className="space-y-6">
          {/* Summary Bar */}
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-erp-green">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Gross Profit/Loss</p>
                  <p className={`text-2xl font-bold ${summary.totalGrossProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(summary.totalGrossProfitLoss)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-erp-blue">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Sales Count</p>
                  <p className="text-2xl font-bold">{summary.totalSalesCount}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-erp-orange">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-erp-teal">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Best Performing Product</p>
                  <p className="text-lg font-bold truncate">{summary.bestPerformingProduct}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search products, categories..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All Categories" />
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

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="goods">Goods</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profit/Loss Filter */}
                <div className="space-y-2">
                  <Label htmlFor="profitLoss">Profit/Loss</Label>
                  <Select value={selectedProfitLoss} onValueChange={setSelectedProfitLoss}>
                    <SelectTrigger id="profitLoss">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="profit">Profit Only</SelectItem>
                      <SelectItem value="loss">Loss Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label htmlFor="dateFilter">Time Period</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="dateFilter">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range */}
                {dateFilter === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="No limit"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Table */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : filteredReportItems.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <p className="text-muted-foreground">No data found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>Product/Service</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>COG</TableHead>
                        <TableHead>Gross Profit/Loss</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReportItems.map((item) => (
                        <TableRow key={item.reportId}>
                          <TableCell className="font-medium">{item.reportId}</TableCell>
                          <TableCell>{item.productService}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.amount}</TableCell>
                          <TableCell>{formatCurrency(item.revenue)}</TableCell>
                          <TableCell>{formatCurrency(item.cog)}</TableCell>
                          <TableCell className={item.grossProfitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(item.grossProfitLoss)}
                          </TableCell>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              item.type === "goods" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {item.type}
                            </span>
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

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Growth Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Sales Growth
                  </CardTitle>
                  <Select value={salesGrowthPeriod} onValueChange={setSalesGrowthPeriod}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_month_vs_last_month">This Month vs Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="all_time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getFilteredSalesGrowthData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="sales" fill="hsl(var(--erp-blue))" name="Total Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Product Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Revenue by Product
                  </CardTitle>
                  <Select value={revenueByProductPeriod} onValueChange={setRevenueByProductPeriod}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_month_vs_last_month">This Month vs Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="all_time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getFilteredRevenueByProductData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--erp-green))" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Category Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-4 w-4" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={revenueByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.category} (${Math.round((entry.revenue / revenueByCategoryData.reduce((sum, d) => sum + d.revenue, 0)) * 100)}%)`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {revenueByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Best Performing Products Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Best Performing Products
                  </CardTitle>
                  <Select value={bestProductsPeriod} onValueChange={setBestProductsPeriod}>
                    <SelectTrigger className="w-[130px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_time">All Time</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bestPerformingProductsData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="product" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--erp-teal))" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </ERPLayout>
  );
}
