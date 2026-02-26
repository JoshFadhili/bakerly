import { getSales, filterSalesByDateRange } from "./salesService";
import { getExpenses, filterExpensesByDateRange } from "./expenseService";
import { getPurchases, filterPurchasesByDateRange } from "./purchaseService";
import { getServicesOffered, filterServicesOfferedByDateRange } from "./serviceOfferedService";
import { getBakingSupplyPurchases, filterBakingSupplyPurchasesByDateRange } from "./bakingSupplyPurchaseService";

// Types for financial data
export interface FinancialSummary {
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface DailyFinancialData {
  date: Date;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface MonthlyFinancialData {
  date: Date; // First day of the month
  month: number;
  year: number;
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface RevenueTrendData {
  date: string;
  revenue: number;
}

export interface RevenueVsExpensesData {
  date: string;
  revenue: number;
  expenses: number;
}

export interface ExpenseBreakdownData {
  category: string;
  amount: number;
}

// Calculate COGS using FIFO approach
const calculateCOGSForSale = async (
  sale: any,
  allPurchases: any[]
): Promise<number> => {
  try {
    // Skip COGS calculation for baking supply sales - they are handled separately
    if (sale.itemType === "bakingSupply") {
      return 0;
    }
    
    // Get purchases for this product, sorted by date (oldest first for FIFO)
    const productPurchases = allPurchases
      .filter(p => 
        p.itemName?.trim().toLowerCase() === sale.itemName?.trim().toLowerCase() &&
        p.status === "received"
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingQuantity = sale.items;
    let totalCOGS = 0;

    for (const purchase of productPurchases) {
      if (remainingQuantity <= 0) break;

      const itemsAvailable = purchase.itemsRemaining !== undefined 
        ? purchase.itemsRemaining 
        : purchase.items;

      if (itemsAvailable > 0) {
        const quantityFromThisBatch = Math.min(remainingQuantity, itemsAvailable);
        const costPerItem = purchase.itemPrice || (purchase.totalCost / purchase.items);
        totalCOGS += quantityFromThisBatch * costPerItem;
        remainingQuantity -= quantityFromThisBatch;
      }
    }

    return totalCOGS;
  } catch (error) {
    console.error("Error calculating COGS for sale:", error);
    return 0;
  }
};

// Calculate COGS from baking supply purchases
const calculateBakingSupplyCOGS = (
  bakingSupplyPurchases: any[],
  startDate?: Date,
  endDate?: Date
): number => {
  return bakingSupplyPurchases
    .filter(p => {
      // Only include received purchases
      if (p.status !== "received") return false;
      // Filter by date range if provided
      if (startDate && endDate) {
        const purchaseDate = new Date(p.date);
        return purchaseDate >= startDate && purchaseDate <= endDate;
      }
      return true;
    })
    .reduce((sum, purchase) => {
      // Calculate cost of all purchases in this period
      return sum + (purchase.totalCost || (purchase.quantity * purchase.unitPrice));
    }, 0);
};

// Get overall financial summary since the start of business
export const getOverallFinancialSummary = async (): Promise<FinancialSummary> => {
  try {
    const sales = await getSales();
    const expenses = await getExpenses();
    const purchases = await getPurchases();
    const servicesOffered = await getServicesOffered();
    const bakingSupplyPurchases = await getBakingSupplyPurchases();

    // Calculate total revenue from completed sales (includes both products and baking supplies)
    const salesRevenue = sales
      .filter(sale => sale.status === "completed")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Calculate total revenue from completed services
    const servicesRevenue = servicesOffered
      .filter(service => service.status === "completed")
      .reduce((sum, service) => sum + service.totalAmount, 0);

    const revenue = salesRevenue + servicesRevenue;

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate COGS for product sales using FIFO
    let totalProductCOGS = 0;
    for (const sale of sales.filter(s => s.status === "completed")) {
      const cogs = await calculateCOGSForSale(sale, purchases);
      totalProductCOGS += cogs;
    }

    // Calculate COGS from baking supply purchases
    const totalBakingSupplyCOGS = calculateBakingSupplyCOGS(bakingSupplyPurchases);
    const totalCOGS = totalProductCOGS + totalBakingSupplyCOGS;

    // Calculate profits
    const grossProfit = revenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue,
      cogs: totalCOGS,
      expenses: totalExpenses,
      grossProfit,
      netProfit,
    };
  } catch (error) {
    console.error("Error calculating overall financial summary:", error);
    throw new Error("Failed to calculate financial summary");
  }
};

// Get financial summary for a specific date range
export const getFinancialSummaryForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<FinancialSummary> => {
  try {
    const sales = await filterSalesByDateRange(startDate, endDate);
    const expenses = await filterExpensesByDateRange(startDate, endDate);
    const purchases = await filterPurchasesByDateRange(startDate, endDate);
    const servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);
    const bakingSupplyPurchases = await filterBakingSupplyPurchasesByDateRange(startDate, endDate);

    // Calculate total revenue from completed sales (includes both products and baking supplies)
    const salesRevenue = sales
      .filter(sale => sale.status === "completed")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Calculate total revenue from completed services
    const servicesRevenue = servicesOffered
      .filter(service => service.status === "completed")
      .reduce((sum, service) => sum + service.totalAmount, 0);

    const revenue = salesRevenue + servicesRevenue;

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate COGS for product sales using FIFO
    let totalProductCOGS = 0;
    for (const sale of sales.filter(s => s.status === "completed")) {
      const cogs = await calculateCOGSForSale(sale, purchases);
      totalProductCOGS += cogs;
    }

    // Calculate COGS from baking supply purchases for this period
    const totalBakingSupplyCOGS = calculateBakingSupplyCOGS(bakingSupplyPurchases, startDate, endDate);
    const totalCOGS = totalProductCOGS + totalBakingSupplyCOGS;

    // Calculate profits
    const grossProfit = revenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue,
      cogs: totalCOGS,
      expenses: totalExpenses,
      grossProfit,
      netProfit,
    };
  } catch (error) {
    console.error("Error calculating financial summary for date range:", error);
    throw new Error("Failed to calculate financial summary");
  }
};

// Get daily financial data for a date range
export const getDailyFinancialData = async (
  startDate: Date,
  endDate: Date
): Promise<DailyFinancialData[]> => {
  try {
    const sales = await filterSalesByDateRange(startDate, endDate);
    const expenses = await filterExpensesByDateRange(startDate, endDate);
    const purchases = await filterPurchasesByDateRange(startDate, endDate);
    const servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);
    const bakingSupplyPurchases = await filterBakingSupplyPurchasesByDateRange(startDate, endDate);

    // Create a map to aggregate data by date
    const dailyDataMap = new Map<string, DailyFinancialData>();

    // Process sales
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const dateKey = sale.date.toISOString().split('T')[0];
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);

      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, {
          date: saleDate,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        });
      }

      const dayData = dailyDataMap.get(dateKey)!;
      dayData.revenue += sale.totalAmount;

      // Calculate COGS for this sale (excludes baking supply sales)
      const cogs = await calculateCOGSForSale(sale, purchases);
      dayData.cogs += cogs;
    }

    // Process services offered
    for (const service of servicesOffered) {
      if (service.status !== "completed") continue;

      const dateKey = service.date.toISOString().split('T')[0];
      const serviceDate = new Date(service.date);
      serviceDate.setHours(0, 0, 0, 0);

      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, {
          date: serviceDate,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        });
      }

      const dayData = dailyDataMap.get(dateKey)!;
      dayData.revenue += service.totalAmount;
      // Services have COGS = 0
    }

    // Process expenses
    for (const expense of expenses) {
      const dateKey = expense.date.toISOString().split('T')[0];
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);

      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, {
          date: expenseDate,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        });
      }

      const dayData = dailyDataMap.get(dateKey)!;
      dayData.expenses += expense.amount;
    }

    // Process baking supply purchases (add to COGS)
    for (const purchase of bakingSupplyPurchases) {
      if (purchase.status !== "received") continue;

      const dateKey = purchase.date.toISOString().split('T')[0];
      const purchaseDate = new Date(purchase.date);
      purchaseDate.setHours(0, 0, 0, 0);

      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, {
          date: purchaseDate,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        });
      }

      const dayData = dailyDataMap.get(dateKey)!;
      // Add baking supply purchase cost to COGS
      const purchaseCost = purchase.totalCost || (purchase.quantity * purchase.unitPrice);
      dayData.cogs += purchaseCost;
    }

    // Calculate profits for each day
    for (const [dateKey, dayData] of dailyDataMap) {
      dayData.grossProfit = dayData.revenue - dayData.cogs;
      dayData.netProfit = dayData.grossProfit - dayData.expenses;
    }

    // Convert map to array and sort by date
    return Array.from(dailyDataMap.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
  } catch (error) {
    console.error("Error getting daily financial data:", error);
    throw new Error("Failed to get daily financial data");
  }
};

// Get monthly financial data for a date range
export const getMonthlyFinancialData = async (
  startDate: Date,
  endDate: Date
): Promise<MonthlyFinancialData[]> => {
  try {
    const sales = await filterSalesByDateRange(startDate, endDate);
    const expenses = await filterExpensesByDateRange(startDate, endDate);
    const purchases = await filterPurchasesByDateRange(startDate, endDate);
    const servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);
    const bakingSupplyPurchases = await filterBakingSupplyPurchasesByDateRange(startDate, endDate);

    // Create a map to aggregate data by month
    const monthlyDataMap = new Map<string, MonthlyFinancialData>();

    // Process sales
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const saleDate = new Date(sale.date);
      const month = saleDate.getMonth() + 1;
      const year = saleDate.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyDataMap.has(monthKey)) {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        monthlyDataMap.set(monthKey, {
          date: firstDayOfMonth,
          month,
          year,
          revenue: 0,
          cogs: 0,
          expenses: 0,
          grossProfit: 0,
          netProfit: 0,
        });
      }

      const monthData = monthlyDataMap.get(monthKey)!;
      monthData.revenue += sale.totalAmount;

      // Calculate COGS for this sale (excludes baking supply sales)
      const cogs = await calculateCOGSForSale(sale, purchases);
      monthData.cogs += cogs;
    }

    // Process services offered
    for (const service of servicesOffered) {
      if (service.status !== "completed") continue;

      const serviceDate = new Date(service.date);
      const month = serviceDate.getMonth() + 1;
      const year = serviceDate.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyDataMap.has(monthKey)) {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        monthlyDataMap.set(monthKey, {
          date: firstDayOfMonth,
          month,
          year,
          revenue: 0,
          cogs: 0,
          expenses: 0,
          grossProfit: 0,
          netProfit: 0,
        });
      }

      const monthData = monthlyDataMap.get(monthKey)!;
      monthData.revenue += service.totalAmount;
      // Services have COGS = 0
    }

    // Process expenses
    for (const expense of expenses) {
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyDataMap.has(monthKey)) {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        monthlyDataMap.set(monthKey, {
          date: firstDayOfMonth,
          month,
          year,
          revenue: 0,
          cogs: 0,
          expenses: 0,
          grossProfit: 0,
          netProfit: 0,
        });
      }

      const monthData = monthlyDataMap.get(monthKey)!;
      monthData.expenses += expense.amount;
    }

    // Process baking supply purchases (add to COGS)
    for (const purchase of bakingSupplyPurchases) {
      if (purchase.status !== "received") continue;

      const purchaseDate = new Date(purchase.date);
      const month = purchaseDate.getMonth() + 1;
      const year = purchaseDate.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyDataMap.has(monthKey)) {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        monthlyDataMap.set(monthKey, {
          date: firstDayOfMonth,
          month,
          year,
          revenue: 0,
          cogs: 0,
          expenses: 0,
          grossProfit: 0,
          netProfit: 0,
        });
      }

      const monthData = monthlyDataMap.get(monthKey)!;
      // Add baking supply purchase cost to COGS
      const purchaseCost = purchase.totalCost || (purchase.quantity * purchase.unitPrice);
      monthData.cogs += purchaseCost;
    }

    // Calculate profits for each month
    for (const [monthKey, monthData] of monthlyDataMap) {
      monthData.grossProfit = monthData.revenue - monthData.cogs;
      monthData.netProfit = monthData.grossProfit - monthData.expenses;
    }

    // Convert map to array and sort by date
    return Array.from(monthlyDataMap.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
  } catch (error) {
    console.error("Error getting monthly financial data:", error);
    throw new Error("Failed to get monthly financial data");
  }
};

// Get revenue trend data for charts
export const getRevenueTrendData = async (
  days: number
): Promise<RevenueTrendData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await filterSalesByDateRange(startDate, endDate);
    const servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);
    const revenueMap = new Map<string, number>();

    // Initialize all dates with 0 revenue
    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      revenueMap.set(dateKey, 0);
    }

    // Aggregate revenue by date from sales
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const dateKey = sale.date.toISOString().split('T')[0];
      if (revenueMap.has(dateKey)) {
        revenueMap.set(dateKey, revenueMap.get(dateKey)! + sale.totalAmount);
      }
    }

    // Aggregate revenue by date from services offered
    for (const service of servicesOffered) {
      if (service.status !== "completed") continue;

      const dateKey = service.date.toISOString().split('T')[0];
      if (revenueMap.has(dateKey)) {
        revenueMap.set(dateKey, revenueMap.get(dateKey)! + service.totalAmount);
      }
    }

    // Convert map to array and sort by date
    return Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error getting revenue trend data:", error);
    throw new Error("Failed to get revenue trend data");
  }
};

// Get revenue vs expenses data for charts
export const getRevenueVsExpensesData = async (
  days: number
): Promise<RevenueVsExpensesData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await filterSalesByDateRange(startDate, endDate);
    const expenses = await filterExpensesByDateRange(startDate, endDate);
    const servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);

    const dataMap = new Map<string, { revenue: number; expenses: number }>();

    // Initialize all dates with 0 values
    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dataMap.set(dateKey, { revenue: 0, expenses: 0 });
    }

    // Aggregate revenue by date from sales
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const dateKey = sale.date.toISOString().split('T')[0];
      if (dataMap.has(dateKey)) {
        const data = dataMap.get(dateKey)!;
        data.revenue += sale.totalAmount;
      }
    }

    // Aggregate revenue by date from services offered
    for (const service of servicesOffered) {
      if (service.status !== "completed") continue;

      const dateKey = service.date.toISOString().split('T')[0];
      if (dataMap.has(dateKey)) {
        const data = dataMap.get(dateKey)!;
        data.revenue += service.totalAmount;
      }
    }

    // Aggregate expenses by date
    for (const expense of expenses) {
      const dateKey = expense.date.toISOString().split('T')[0];
      if (dataMap.has(dateKey)) {
        const data = dataMap.get(dateKey)!;
        data.expenses += expense.amount;
      }
    }

    // Convert map to array and sort by date
    return Array.from(dataMap.entries())
      .map(([date, { revenue, expenses }]) => ({ date, revenue, expenses }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error getting revenue vs expenses data:", error);
    throw new Error("Failed to get revenue vs expenses data");
  }
};

// Get monthly profit trend data
export const getMonthlyProfitTrendData = async (
  months: number
): Promise<MonthlyFinancialData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyData = await getMonthlyFinancialData(startDate, endDate);

    // Return the last N months of data
    return monthlyData.slice(-months);
  } catch (error) {
    console.error("Error getting monthly profit trend data:", error);
    throw new Error("Failed to get monthly profit trend data");
  }
};

// Get expense breakdown data for pie/donut chart
export const getExpenseBreakdownData = async (
  startDate?: Date,
  endDate?: Date
): Promise<ExpenseBreakdownData[]> => {
  try {
    let expenses: any[];
    
    if (startDate && endDate) {
      expenses = await filterExpensesByDateRange(startDate, endDate);
    } else {
      expenses = await getExpenses();
    }

    // Aggregate expenses by category
    const categoryMap = new Map<string, number>();

    for (const expense of expenses) {
      const category = expense.category || "Misc";
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    }

    // Convert map to array
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error("Error getting expense breakdown data:", error);
    throw new Error("Failed to get expense breakdown data");
  }
};

// Search financial data by date range or keyword
export const searchFinancialData = async (
  startDate?: Date,
  endDate?: Date,
  keyword?: string
): Promise<{
  sales: any[];
  expenses: any[];
  purchases: any[];
  servicesOffered: any[];
}> => {
  try {
    let sales: any[] = [];
    let expenses: any[] = [];
    let purchases: any[] = [];
    let servicesOffered: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
      expenses = await filterExpensesByDateRange(startDate, endDate);
      purchases = await filterPurchasesByDateRange(startDate, endDate);
      servicesOffered = await filterServicesOfferedByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
      expenses = await getExpenses();
      purchases = await getPurchases();
      servicesOffered = await getServicesOffered();
    }

    // Filter by keyword if provided
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      
      sales = sales.filter(sale =>
        sale.itemName?.toLowerCase().includes(lowerKeyword) ||
        sale.payment?.toLowerCase().includes(lowerKeyword) ||
        sale.status?.toLowerCase().includes(lowerKeyword)
      );

      expenses = expenses.filter(expense =>
        expense.description?.toLowerCase().includes(lowerKeyword) ||
        expense.category?.toLowerCase().includes(lowerKeyword)
      );

      purchases = purchases.filter(purchase =>
        purchase.itemName?.toLowerCase().includes(lowerKeyword) ||
        purchase.supplier?.toLowerCase().includes(lowerKeyword) ||
        purchase.status?.toLowerCase().includes(lowerKeyword)
      );

      servicesOffered = servicesOffered.filter(service =>
        service.serviceName?.toLowerCase().includes(lowerKeyword) ||
        service.payment?.toLowerCase().includes(lowerKeyword) ||
        service.status?.toLowerCase().includes(lowerKeyword) ||
        service.customer?.toLowerCase().includes(lowerKeyword)
      );
    }

    return { sales, expenses, purchases, servicesOffered };
  } catch (error) {
    console.error("Error searching financial data:", error);
    throw new Error("Failed to search financial data");
  }
};
