import { getSales, filterSalesByDateRange } from "./salesService";
import { getExpenses, filterExpensesByDateRange } from "./expenseService";
import { getPurchases, filterPurchasesByDateRange } from "./purchaseService";
import { getLowStockItems } from "./inventoryService";
import { getServicesOffered, filterServicesOfferedByDateRange } from "./serviceOfferedService";
import { collection, onSnapshot, query, orderBy, limit, Timestamp, Unsubscribe } from "firebase/firestore";
import { db } from "../lib/firebase";

// Types for dashboard data
export interface DashboardKPI {
  todaySales: number;
  todayTransactions: number;
  monthlyRevenue: number;
  monthlyNetProfit: number;
  lowStockCount: number;
}

export interface SalesChartData {
  name: string;
  sales: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  sold: number;
}

export interface Activity {
  type: "sale" | "purchase" | "expense" | "service";
  description: string;
  amount?: string;
  date: Date;
}

// Helper function to get today's date range
const getTodayRange = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// Helper function to get current month's date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startOfMonth, endOfMonth };
};

// Get dashboard KPI data
export const getDashboardKPI = async (): Promise<DashboardKPI> => {
  try {
    const { startOfDay, endOfDay } = getTodayRange();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    // Get today's sales
    const todaySales = await filterSalesByDateRange(startOfDay, endOfDay);
    const todayServices = await filterServicesOfferedByDateRange(startOfDay, endOfDay);
    
    const todaySalesAmount = todaySales
      .filter(sale => sale.status === "completed")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const todayServicesAmount = todayServices
      .filter(service => service.status === "completed")
      .reduce((sum, service) => sum + service.totalAmount, 0);
    
    const todayTotalSales = todaySalesAmount + todayServicesAmount;
    const todayTransactions = todaySales.filter(sale => sale.status === "completed").length + 
                            todayServices.filter(service => service.status === "completed").length;

    // Get monthly revenue
    const monthlySales = await filterSalesByDateRange(startOfMonth, endOfMonth);
    const monthlyServices = await filterServicesOfferedByDateRange(startOfMonth, endOfMonth);
    
    const monthlyRevenue = monthlySales
      .filter(sale => sale.status === "completed")
      .reduce((sum, sale) => sum + sale.totalAmount, 0) +
      monthlyServices
      .filter(service => service.status === "completed")
      .reduce((sum, service) => sum + service.totalAmount, 0);

    // Get monthly expenses
    const monthlyExpenses = await filterExpensesByDateRange(startOfMonth, endOfMonth);
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate COGS for monthly sales
    const purchases = await getPurchases();
    const calculateCOGSForSale = async (sale: any): Promise<number> => {
      const productPurchases = purchases
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
    };

    let totalCOGS = 0;
    for (const sale of monthlySales.filter(s => s.status === "completed")) {
      const cogs = await calculateCOGSForSale(sale);
      totalCOGS += cogs;
    }

    const monthlyGrossProfit = monthlyRevenue - totalCOGS;
    const monthlyNetProfit = monthlyGrossProfit - totalMonthlyExpenses;

    // Get low stock items
    const lowStockItems = await getLowStockItems();

    return {
      todaySales: todayTotalSales,
      todayTransactions,
      monthlyRevenue,
      monthlyNetProfit,
      lowStockCount: lowStockItems.length,
    };
  } catch (error) {
    console.error("Error fetching dashboard KPI:", error);
    throw new Error("Failed to fetch dashboard KPI");
  }
};

// Get daily sales chart data for the last 7 days
export const getDailySalesChartData = async (): Promise<SalesChartData[]> => {
  try {
    const days = 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));

    const sales = await filterSalesByDateRange(startDate, endDate);
    const services = await filterServicesOfferedByDateRange(startDate, endDate);

    // Create map for each day
    const dayMap = new Map<string, { sales: number; revenue: number }>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayName = dayNames[date.getDay()];
      dayMap.set(dayName, { sales: 0, revenue: 0 });
    }

    // Aggregate sales by day
    for (const sale of sales) {
      if (sale.status !== "completed") continue;
      const dayName = dayNames[sale.date.getDay()];
      if (dayMap.has(dayName)) {
        const data = dayMap.get(dayName)!;
        data.sales += sale.items;
        data.revenue += sale.totalAmount;
      }
    }

    // Aggregate services by day
    for (const service of services) {
      if (service.status !== "completed") continue;
      const dayName = dayNames[service.date.getDay()];
      if (dayMap.has(dayName)) {
        const data = dayMap.get(dayName)!;
        data.revenue += service.totalAmount;
      }
    }

    return Array.from(dayMap.entries()).map(([name, data]) => ({
      name,
      sales: data.sales,
      revenue: data.revenue,
    }));
  } catch (error) {
    console.error("Error fetching daily sales chart data:", error);
    throw new Error("Failed to fetch daily sales chart data");
  }
};

// Get monthly sales chart data for the last 6 months
export const getMonthlySalesChartData = async (): Promise<SalesChartData[]> => {
  try {
    const months = 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);

    const sales = await filterSalesByDateRange(startDate, endDate);
    const services = await filterServicesOfferedByDateRange(startDate, endDate);

    // Create map for each month
    const monthMap = new Map<string, { sales: number; revenue: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthName = monthNames[date.getMonth()];
      monthMap.set(monthName, { sales: 0, revenue: 0 });
    }

    // Aggregate sales by month
    for (const sale of sales) {
      if (sale.status !== "completed") continue;
      const monthName = monthNames[sale.date.getMonth()];
      if (monthMap.has(monthName)) {
        const data = monthMap.get(monthName)!;
        data.sales += sale.items;
        data.revenue += sale.totalAmount;
      }
    }

    // Aggregate services by month
    for (const service of services) {
      if (service.status !== "completed") continue;
      const monthName = monthNames[service.date.getMonth()];
      if (monthMap.has(monthName)) {
        const data = monthMap.get(monthName)!;
        data.revenue += service.totalAmount;
      }
    }

    return Array.from(monthMap.entries()).map(([name, data]) => ({
      name,
      sales: data.sales,
      revenue: data.revenue,
    }));
  } catch (error) {
    console.error("Error fetching monthly sales chart data:", error);
    throw new Error("Failed to fetch monthly sales chart data");
  }
};

// Get yearly sales chart data for the last 5 years
export const getYearlySalesChartData = async (): Promise<SalesChartData[]> => {
  try {
    const years = 5;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - (years - 1));
    startDate.setMonth(0, 1);

    const sales = await filterSalesByDateRange(startDate, endDate);
    const services = await filterServicesOfferedByDateRange(startDate, endDate);

    // Create map for each year
    const yearMap = new Map<string, { sales: number; revenue: number }>();

    for (let i = 0; i < years; i++) {
      const date = new Date(startDate);
      date.setFullYear(date.getFullYear() + i);
      const yearName = date.getFullYear().toString();
      yearMap.set(yearName, { sales: 0, revenue: 0 });
    }

    // Aggregate sales by year
    for (const sale of sales) {
      if (sale.status !== "completed") continue;
      const yearName = sale.date.getFullYear().toString();
      if (yearMap.has(yearName)) {
        const data = yearMap.get(yearName)!;
        data.sales += sale.items;
        data.revenue += sale.totalAmount;
      }
    }

    // Aggregate services by year
    for (const service of services) {
      if (service.status !== "completed") continue;
      const yearName = service.date.getFullYear().toString();
      if (yearMap.has(yearName)) {
        const data = yearMap.get(yearName)!;
        data.revenue += service.totalAmount;
      }
    }

    return Array.from(yearMap.entries()).map(([name, data]) => ({
      name,
      sales: data.sales,
      revenue: data.revenue,
    }));
  } catch (error) {
    console.error("Error fetching yearly sales chart data:", error);
    throw new Error("Failed to fetch yearly sales chart data");
  }
};

// Get top selling products
export const getTopProducts = async (limit: number = 5): Promise<TopProduct[]> => {
  try {
    const sales = await getSales();
    const productSales = new Map<string, number>();

    // Aggregate sales by product
    for (const sale of sales) {
      if (sale.status !== "completed") continue;
      const productName = sale.itemName;
      const currentQuantity = productSales.get(productName) || 0;
      productSales.set(productName, currentQuantity + sale.items);
    }

    // Convert to array and sort by quantity sold
    const sortedProducts = Array.from(productSales.entries())
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit);

    return sortedProducts;
  } catch (error) {
    console.error("Error fetching top products:", error);
    throw new Error("Failed to fetch top products");
  }
};

// Get recent activities (sales, purchases, expenses, services)
export const getRecentActivities = async (limit: number = 5): Promise<Activity[]> => {
  try {
    const sales = await getSales();
    const purchases = await getPurchases();
    const expenses = await getExpenses();
    const services = await getServicesOffered();

    const activities: Activity[] = [];

    // Add sales as activities
    for (const sale of sales) {
      activities.push({
        type: "sale",
        description: `${sale.items} ${sale.itemName} sold`,
        amount: `KSh ${sale.totalAmount.toLocaleString()}`,
        date: sale.date,
      });
    }

    // Add purchases as activities
    for (const purchase of purchases) {
      activities.push({
        type: "purchase",
        description: `${purchase.items} ${purchase.itemName} added`,
        date: purchase.date,
      });
    }

    // Add expenses as activities
    for (const expense of expenses) {
      activities.push({
        type: "expense",
        description: expense.description,
        amount: `KSh ${expense.amount.toLocaleString()}`,
        date: expense.date,
      });
    }

    // Add services as activities
    for (const service of services) {
      activities.push({
        type: "service",
        description: `${service.serviceName}${service.customer ? ` for ${service.customer}` : ''}`,
        amount: `KSh ${service.totalAmount.toLocaleString()}`,
        date: service.date,
      });
    }

    // Sort by date descending and take the latest
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw new Error("Failed to fetch recent activities");
  }
};

// Subscribe to recent activities with real-time updates
export const subscribeToRecentActivities = (
  limitCount: number,
  callback: (activities: Activity[]) => void
): Unsubscribe => {
  // Create queries for each collection with limits for efficiency
  // Fetch more than needed (limitCount * 2) to ensure we get enough after filtering
  const queryLimit = Math.max(limitCount * 2, 20);
  const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(queryLimit));
  const purchasesQuery = query(collection(db, "purchases"), orderBy("date", "desc"), limit(queryLimit));
  const expensesQuery = query(collection(db, "expenses"), orderBy("date", "desc"), limit(queryLimit));
  const servicesQuery = query(collection(db, "servicesOffered"), orderBy("date", "desc"), limit(queryLimit));

  // Track all data from all collections
  let salesData: any[] = [];
  let purchasesData: any[] = [];
  let expensesData: any[] = [];
  let servicesData: any[] = [];
  
  // Track which collections have loaded their initial data
  let salesLoaded = false;
  let purchasesLoaded = false;
  let expensesLoaded = false;
  let servicesLoaded = false;
  
  // Track if initial load is complete
  let initialLoadComplete = false;

  // Function to combine and sort all activities
  const combineActivities = () => {
    const activities: Activity[] = [];

    // Add sales as activities
    for (const sale of salesData) {
      const date = sale.date instanceof Timestamp ? sale.date.toDate() : sale.date;
      activities.push({
        type: "sale",
        description: `${sale.items} ${sale.itemName} sold`,
        amount: `KSh ${sale.totalAmount.toLocaleString()}`,
        date: date,
      });
    }

    // Add purchases as activities
    for (const purchase of purchasesData) {
      const date = purchase.date instanceof Timestamp ? purchase.date.toDate() : purchase.date;
      activities.push({
        type: "purchase",
        description: `${purchase.items} ${purchase.itemName} added`,
        date: date,
      });
    }

    // Add expenses as activities
    for (const expense of expensesData) {
      const date = expense.date instanceof Timestamp ? expense.date.toDate() : expense.date;
      activities.push({
        type: "expense",
        description: expense.description,
        amount: `KSh ${expense.amount.toLocaleString()}`,
        date: date,
      });
    }

    // Add services as activities
    for (const service of servicesData) {
      const date = service.date instanceof Timestamp ? service.date.toDate() : service.date;
      activities.push({
        type: "service",
        description: `${service.serviceName}${service.customer ? ` for ${service.customer}` : ''}`,
        amount: `KSh ${service.totalAmount.toLocaleString()}`,
        date: date,
      });
    }

    // Sort by date descending and take the latest
    const sortedActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limitCount);

    callback(sortedActivities);
  };

  // Check if all collections have loaded and trigger initial combine
  const checkAllLoaded = () => {
    if (salesLoaded && purchasesLoaded && expensesLoaded && servicesLoaded) {
      if (!initialLoadComplete) {
        initialLoadComplete = true;
        console.log("Recent activities: Initial load complete");
      }
      combineActivities();
    }
  };

  // Subscribe to sales
  const unsubscribeSales = onSnapshot(
    salesQuery,
    (snapshot) => {
      salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      salesLoaded = true;
      checkAllLoaded();
    },
    (error) => {
      console.error("Error listening to sales:", error);
      salesLoaded = true; // Mark as loaded even on error to prevent hanging
      checkAllLoaded();
    }
  );

  // Subscribe to purchases
  const unsubscribePurchases = onSnapshot(
    purchasesQuery,
    (snapshot) => {
      purchasesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      purchasesLoaded = true;
      checkAllLoaded();
    },
    (error) => {
      console.error("Error listening to purchases:", error);
      purchasesLoaded = true; // Mark as loaded even on error to prevent hanging
      checkAllLoaded();
    }
  );

  // Subscribe to expenses
  const unsubscribeExpenses = onSnapshot(
    expensesQuery,
    (snapshot) => {
      expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      expensesLoaded = true;
      checkAllLoaded();
    },
    (error) => {
      console.error("Error listening to expenses:", error);
      expensesLoaded = true; // Mark as loaded even on error to prevent hanging
      checkAllLoaded();
    }
  );

  // Subscribe to services
  const unsubscribeServices = onSnapshot(
    servicesQuery,
    (snapshot) => {
      servicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      servicesLoaded = true;
      checkAllLoaded();
    },
    (error) => {
      console.error("Error listening to services:", error);
      servicesLoaded = true; // Mark as loaded even on error to prevent hanging
      checkAllLoaded();
    }
  );

  // Return a function to unsubscribe from all listeners
  return () => {
    unsubscribeSales();
    unsubscribePurchases();
    unsubscribeExpenses();
    unsubscribeServices();
  };
};
