import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Search, Calendar, Download } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getOverallFinancialSummary,
  getFinancialSummaryForDateRange,
  getDailyFinancialData,
  getMonthlyFinancialData,
  getRevenueTrendData,
  getRevenueVsExpensesData,
  getMonthlyProfitTrendData,
  getExpenseBreakdownData,
  searchFinancialData,
  type FinancialSummary,
  type DailyFinancialData,
  type MonthlyFinancialData,
} from "@/services/financeService";

// Colors for charts
const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// Format currency
const formatCurrency = (amount: number): string => {
  return `KSh ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <Card className={`border-l-4 border-l-${color}`}>
    <CardContent className="flex items-center gap-4 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-${color}/10`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-bold">{formatCurrency(value)}</p>
      </div>
    </CardContent>
  </Card>
);

export default function Finance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Overview tab state
  const [overallSummary, setOverallSummary] = useState<FinancialSummary | null>(null);
  const [revenueTrendPeriod, setRevenueTrendPeriod] = useState<"7d" | "30d" | "4m" | "12m">("30d");
  const [revenueVsExpensesPeriod, setRevenueVsExpensesPeriod] = useState<"7d" | "30d" | "4m" | "12m">("30d");
  const [revenueTrendData, setRevenueTrendData] = useState<any[]>([]);
  const [revenueVsExpensesData, setRevenueVsExpensesData] = useState<any[]>([]);
  const [monthlyProfitTrendData, setMonthlyProfitTrendData] = useState<any[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<any[]>([]);

  // Monthly tab state
  const [monthlySummary, setMonthlySummary] = useState<FinancialSummary | null>(null);
  const [monthlyStartDate, setMonthlyStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [monthlyEndDate, setMonthlyEndDate] = useState<Date>(new Date());
  const [dailyFinancialData, setDailyFinancialData] = useState<DailyFinancialData[]>([]);

  // Annual tab state
  const [annualSummary, setAnnualSummary] = useState<FinancialSummary | null>(null);
  const [annualYear, setAnnualYear] = useState<number>(new Date().getFullYear());
  const [annualFinancialData, setAnnualFinancialData] = useState<MonthlyFinancialData[]>([]);

  // Fetch overall financial summary
  useEffect(() => {
    const fetchOverallSummary = async () => {
      try {
        setLoading(true);
        const summary = await getOverallFinancialSummary();
        setOverallSummary(summary);
      } catch (error) {
        console.error("Error fetching overall summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverallSummary();
  }, []);

  // Fetch overview chart data
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        
        // Revenue trend data
        let days = 30;
        if (revenueTrendPeriod === "7d") days = 7;
        else if (revenueTrendPeriod === "4m") days = 120;
        else if (revenueTrendPeriod === "12m") days = 365;
        
        const revenueTrend = await getRevenueTrendData(days);
        setRevenueTrendData(revenueTrend);

        // Revenue vs expenses data
        let days2 = 30;
        if (revenueVsExpensesPeriod === "7d") days2 = 7;
        else if (revenueVsExpensesPeriod === "4m") days2 = 120;
        else if (revenueVsExpensesPeriod === "12m") days2 = 365;
        
        const revenueVsExpenses = await getRevenueVsExpensesData(days2);
        setRevenueVsExpensesData(revenueVsExpenses);

        // Monthly profit trend data
        const monthlyProfit = await getMonthlyProfitTrendData(12);
        setMonthlyProfitTrendData(monthlyProfit);

        // Expense breakdown data
        const expenseBreakdown = await getExpenseBreakdownData();
        setExpenseBreakdownData(expenseBreakdown);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, [revenueTrendPeriod, revenueVsExpensesPeriod]);

  // Fetch monthly financial data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        
        const summary = await getFinancialSummaryForDateRange(monthlyStartDate, monthlyEndDate);
        setMonthlySummary(summary);

        const dailyData = await getDailyFinancialData(monthlyStartDate, monthlyEndDate);
        setDailyFinancialData(dailyData);
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthlyData();
  }, [monthlyStartDate, monthlyEndDate]);

  // Fetch annual financial data
  useEffect(() => {
    const fetchAnnualData = async () => {
      try {
        setLoading(true);
        
        const startDate = new Date(annualYear, 0, 1);
        const endDate = new Date(annualYear, 11, 31);
        
        const summary = await getFinancialSummaryForDateRange(startDate, endDate);
        setAnnualSummary(summary);

        const monthlyData = await getMonthlyFinancialData(startDate, endDate);
        setAnnualFinancialData(monthlyData);
      } catch (error) {
        console.error("Error fetching annual data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnualData();
  }, [annualYear]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await searchFinancialData(undefined, undefined, searchQuery);
      console.log("Search results:", results);
      // You can display search results in a modal or separate section
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  // Calculate totals for tables
  const calculateDailyTotals = () => {
    return dailyFinancialData.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.revenue,
        cogs: acc.cogs + day.cogs,
        grossProfit: acc.grossProfit + day.grossProfit,
        expenses: acc.expenses + day.expenses,
        netProfit: acc.netProfit + day.netProfit,
      }),
      { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 }
    );
  };

  const calculateAnnualTotals = () => {
    return annualFinancialData.reduce(
      (acc, month) => ({
        revenue: acc.revenue + month.revenue,
        cogs: acc.cogs + month.cogs,
        expenses: acc.expenses + month.expenses,
        grossProfit: acc.grossProfit + month.grossProfit,
        netProfit: acc.netProfit + month.netProfit,
      }),
      { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 }
    );
  };

  return (
    <ERPLayout title="Finance" subtitle="Financial overview and cash flow management">
      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sales, expenses, or purchases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Financial Trend/Data</TabsTrigger>
          <TabsTrigger value="annual">Annual Financial Trend/Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Bar - Overall Financial Data */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              title="Revenue"
              value={overallSummary?.revenue || 0}
              icon={TrendingUp}
              color="erp-green"
            />
            <SummaryCard
              title="COGS"
              value={overallSummary?.cogs || 0}
              icon={Wallet}
              color="erp-blue"
            />
            <SummaryCard
              title="Expenses"
              value={overallSummary?.expenses || 0}
              icon={CreditCard}
              color="erp-red"
            />
            <SummaryCard
              title="Gross Profit"
              value={overallSummary?.grossProfit || 0}
              icon={TrendingUp}
              color="erp-purple"
            />
            <SummaryCard
              title="Net Profit"
              value={overallSummary?.netProfit || 0}
              icon={TrendingDown}
              color={overallSummary?.netProfit >= 0 ? "erp-green" : "erp-red"}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                  <Select value={revenueTrendPeriod} onValueChange={(value: any) => setRevenueTrendPeriod(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="4m">Last 4 Months</SelectItem>
                      <SelectItem value="12m">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--erp-green))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Revenue vs Expenses</CardTitle>
                  <Select value={revenueVsExpensesPeriod} onValueChange={(value: any) => setRevenueVsExpensesPeriod(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="4m">Last 4 Months</SelectItem>
                      <SelectItem value="12m">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueVsExpensesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--erp-green))"
                        strokeWidth={2}
                        name="Revenue"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="hsl(var(--erp-red))"
                        strokeWidth={2}
                        name="Expenses"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Profit Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Monthly Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyProfitTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Net Profit"]}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netProfit"
                        stroke="hsl(var(--erp-blue))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Financial Trend/Data Tab */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Summary Bar - Current Month */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              title="Revenue"
              value={monthlySummary?.revenue || 0}
              icon={TrendingUp}
              color="erp-green"
            />
            <SummaryCard
              title="COGS"
              value={monthlySummary?.cogs || 0}
              icon={Wallet}
              color="erp-blue"
            />
            <SummaryCard
              title="Expenses"
              value={monthlySummary?.expenses || 0}
              icon={CreditCard}
              color="erp-red"
            />
            <SummaryCard
              title="Gross Profit"
              value={monthlySummary?.grossProfit || 0}
              icon={TrendingUp}
              color="erp-purple"
            />
            <SummaryCard
              title="Net Profit"
              value={monthlySummary?.netProfit || 0}
              icon={TrendingDown}
              color={monthlySummary?.netProfit >= 0 ? "erp-green" : "erp-red"}
            />
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Date Range Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={monthlyStartDate.toISOString().split('T')[0]}
                    onChange={(e) => setMonthlyStartDate(new Date(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={monthlyEndDate.toISOString().split('T')[0]}
                    onChange={(e) => setMonthlyEndDate(new Date(e.target.value))}
                  />
                </div>
                <Button onClick={() => {
                  setMonthlyStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                  setMonthlyEndDate(new Date());
                }}>Current Month</Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Financial Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Daily Financial Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyFinancialData.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(day.date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.cogs)}</TableCell>
                        <TableCell className={`text-right ${day.grossProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                          {formatCurrency(day.grossProfit)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(day.expenses)}</TableCell>
                        <TableCell className={`text-right ${day.netProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                          {formatCurrency(day.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="font-bold bg-muted">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateDailyTotals().revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateDailyTotals().cogs)}</TableCell>
                      <TableCell className={`text-right ${calculateDailyTotals().grossProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                        {formatCurrency(calculateDailyTotals().grossProfit)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateDailyTotals().expenses)}</TableCell>
                      <TableCell className={`text-right ${calculateDailyTotals().netProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                        {formatCurrency(calculateDailyTotals().netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Financial Trend/Data Tab */}
        <TabsContent value="annual" className="space-y-6">
          {/* Summary Bar - Current Year */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              title="Revenue"
              value={annualSummary?.revenue || 0}
              icon={TrendingUp}
              color="erp-green"
            />
            <SummaryCard
              title="COGS"
              value={annualSummary?.cogs || 0}
              icon={Wallet}
              color="erp-blue"
            />
            <SummaryCard
              title="Expenses"
              value={annualSummary?.expenses || 0}
              icon={CreditCard}
              color="erp-red"
            />
            <SummaryCard
              title="Gross Profit"
              value={annualSummary?.grossProfit || 0}
              icon={TrendingUp}
              color="erp-purple"
            />
            <SummaryCard
              title="Net Profit"
              value={annualSummary?.netProfit || 0}
              icon={TrendingDown}
              color={annualSummary?.netProfit >= 0 ? "erp-green" : "erp-red"}
            />
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Year Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Year</label>
                  <Select value={annualYear.toString()} onValueChange={(value) => setAnnualYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setAnnualYear(new Date().getFullYear())}>Current Year</Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Financial Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Financial Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annualFinancialData.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {month.date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(month.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.cogs)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.expenses)}</TableCell>
                        <TableCell className={`text-right ${month.grossProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                          {formatCurrency(month.grossProfit)}
                        </TableCell>
                        <TableCell className={`text-right ${month.netProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                          {formatCurrency(month.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="font-bold bg-muted">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateAnnualTotals().revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateAnnualTotals().cogs)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateAnnualTotals().expenses)}</TableCell>
                      <TableCell className={`text-right ${calculateAnnualTotals().grossProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                        {formatCurrency(calculateAnnualTotals().grossProfit)}
                      </TableCell>
                      <TableCell className={`text-right ${calculateAnnualTotals().netProfit >= 0 ? "text-erp-green" : "text-erp-red"}`}>
                        {formatCurrency(calculateAnnualTotals().netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ERPLayout>
  );
}
