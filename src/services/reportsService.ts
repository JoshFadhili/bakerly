import { getSales, filterSalesByDateRange } from "./salesService";
import { getPurchases, filterPurchasesByDateRange } from "./purchaseService";
import { getProducts } from "./productService";

// Types for reports
export interface ReportItem {
  reportId: string;
  productService: string;
  description: string;
  category: string;
  amount: number;
  revenue: number;
  cog: number;
  grossProfitLoss: number;
  date: Date;
  type: "goods" | "service";
}

export interface ReportSummary {
  totalGrossProfitLoss: number;
  totalSalesCount: number;
  averageOrderValue: number;
  bestPerformingProduct: string;
}

export interface SalesGrowthData {
  period: string;
  sales: number;
}

export interface RevenueByProductData {
  product: string;
  revenue: number;
  period: string;
}

export interface RevenueByCategoryData {
  category: string;
  revenue: number;
}

export interface BestPerformingProductsData {
  product: string;
  quantitySold: number;
  revenue: number;
}

// Calculate COGS for a sale using FIFO
const calculateCOGSForSale = async (
  sale: any,
  allPurchases: any[]
): Promise<number> => {
  try {
    const productPurchases = allPurchases
      .filter((p) =>
        p.itemName?.trim().toLowerCase() === sale.itemName?.trim().toLowerCase() &&
        p.status === "received"
      )
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    let remainingQuantity = sale.items;
    let totalCOGS = 0;

    for (const purchase of productPurchases) {
      if (remainingQuantity <= 0) break;

      const itemsAvailable =
        purchase.itemsRemaining !== undefined
          ? purchase.itemsRemaining
          : purchase.items;

      if (itemsAvailable > 0) {
        const quantityFromThisBatch = Math.min(remainingQuantity, itemsAvailable);
        const costPerItem =
          purchase.itemPrice || purchase.totalCost / purchase.items;
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

// Generate report ID
const generateReportId = (index: number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${year}${month}${day}-${(index + 1).toString().padStart(4, "0")}-${random}`;
};

// Get all report items (sales)
export const getReportItems = async (
  startDate?: Date,
  endDate?: Date,
  category?: string,
  minAmount?: number,
  maxAmount?: number,
  profitLossType?: "profit" | "loss",
  type?: "goods" | "service",
  searchTerm?: string
): Promise<ReportItem[]> => {
  try {
    let sales: any[] = [];
    let purchases: any[] = [];

    // Get data based on date range
    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
      purchases = await filterPurchasesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
      purchases = await getPurchases();
    }

    const products = await getProducts();
    const productMap = new Map(
      products.map((p) => [p.name.toLowerCase(), p])
    );

    const reportItems: ReportItem[] = [];

    // Process sales
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const product = productMap.get(sale.itemName?.toLowerCase());
      const productCategory = product?.category || "Uncategorized";
      const productType = product ? "goods" : "service";

      // Filter by type
      if (type && productType !== type) continue;

      // Filter by category
      if (category && productCategory !== category) continue;

      // Calculate COGS
      const cogs = await calculateCOGSForSale(sale, purchases);
      const grossProfit = sale.totalAmount - cogs;

      // Filter by profit/loss type
      if (profitLossType === "profit" && grossProfit < 0) continue;
      if (profitLossType === "loss" && grossProfit >= 0) continue;

      // Filter by amount range
      if (minAmount !== undefined && sale.totalAmount < minAmount) continue;
      if (maxAmount !== undefined && sale.totalAmount > maxAmount) continue;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          sale.itemName?.toLowerCase().includes(searchLower) ||
          productCategory.toLowerCase().includes(searchLower) ||
          sale.totalAmount.toString().includes(searchLower);
        if (!matchesSearch) continue;
      }

      reportItems.push({
        reportId: generateReportId(reportItems.length),
        productService: sale.itemName,
        description: `Sale of ${sale.items} ${sale.itemName}`,
        category: productCategory,
        amount: sale.items,
        revenue: sale.totalAmount,
        cog: cogs,
        grossProfitLoss: grossProfit,
        date: sale.date,
        type: productType,
      });
    }

    // Sort by date descending
    return reportItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error("Error getting report items:", error);
    throw new Error("Failed to get report items");
  }
};

// Get report summary
export const getReportSummary = async (
  startDate?: Date,
  endDate?: Date
): Promise<ReportSummary> => {
  try {
    let sales: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
    }

    const completedSales = sales.filter((s) => s.status === "completed");
    const purchases = startDate && endDate
      ? await filterPurchasesByDateRange(startDate, endDate)
      : await getPurchases();

    // Calculate total gross profit/loss
    let totalGrossProfit = 0;
    const productRevenueMap = new Map<string, number>();

    for (const sale of completedSales) {
      const cogs = await calculateCOGSForSale(sale, purchases);
      const grossProfit = sale.totalAmount - cogs;
      totalGrossProfit += grossProfit;

      // Track revenue by product
      const currentRevenue = productRevenueMap.get(sale.itemName) || 0;
      productRevenueMap.set(sale.itemName, currentRevenue + sale.totalAmount);
    }

    // Find best performing product
    let bestPerformingProduct = "N/A";
    let maxRevenue = 0;
    for (const [product, revenue] of productRevenueMap.entries()) {
      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        bestPerformingProduct = product;
      }
    }

    // Calculate average order value
    const totalRevenue = completedSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const averageOrderValue =
      completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

    return {
      totalGrossProfitLoss: totalGrossProfit,
      totalSalesCount: completedSales.length,
      averageOrderValue,
      bestPerformingProduct,
    };
  } catch (error) {
    console.error("Error getting report summary:", error);
    throw new Error("Failed to get report summary");
  }
};

// Get sales growth data
export const getSalesGrowthData = async (
  startDate?: Date,
  endDate?: Date
): Promise<SalesGrowthData[]> => {
  try {
    let sales: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
    }

    const completedSales = sales.filter((s) => s.status === "completed");

    // Group by month
    const monthlyData = new Map<string, number>();

    for (const sale of completedSales) {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const currentSales = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, currentSales + sale.totalAmount);
    }

    // Convert to array and sort
    return Array.from(monthlyData.entries())
      .map(([period, sales]) => ({ period, sales }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error("Error getting sales growth data:", error);
    throw new Error("Failed to get sales growth data");
  }
};

// Get revenue by product data
export const getRevenueByProductData = async (
  startDate?: Date,
  endDate?: Date
): Promise<RevenueByProductData[]> => {
  try {
    let sales: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
    }

    const completedSales = sales.filter((s) => s.status === "completed");

    // Group by product and month
    const productData = new Map<string, Map<string, number>>();

    for (const sale of completedSales) {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!productData.has(sale.itemName)) {
        productData.set(sale.itemName, new Map());
      }

      const productMonthData = productData.get(sale.itemName)!;
      const currentRevenue = productMonthData.get(monthKey) || 0;
      productMonthData.set(monthKey, currentRevenue + sale.totalAmount);
    }

    // Convert to array
    const result: RevenueByProductData[] = [];
    for (const [product, monthData] of productData.entries()) {
      for (const [period, revenue] of monthData.entries()) {
        result.push({ product, revenue, period });
      }
    }

    return result.sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error("Error getting revenue by product data:", error);
    throw new Error("Failed to get revenue by product data");
  }
};

// Get revenue by category data
export const getRevenueByCategoryData = async (
  startDate?: Date,
  endDate?: Date
): Promise<RevenueByCategoryData[]> => {
  try {
    let sales: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
    }

    const completedSales = sales.filter((s) => s.status === "completed");
    const products = await getProducts();
    const productMap = new Map(
      products.map((p) => [p.name.toLowerCase(), p.category])
    );

    // Group by category
    const categoryData = new Map<string, number>();

    for (const sale of completedSales) {
      const category = productMap.get(sale.itemName?.toLowerCase()) || "Uncategorized";
      const currentRevenue = categoryData.get(category) || 0;
      categoryData.set(category, currentRevenue + sale.totalAmount);
    }

    // Convert to array and sort by revenue descending
    return Array.from(categoryData.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Error getting revenue by category data:", error);
    throw new Error("Failed to get revenue by category data");
  }
};

// Get best performing products data
export const getBestPerformingProductsData = async (
  startDate?: Date,
  endDate?: Date
): Promise<BestPerformingProductsData[]> => {
  try {
    let sales: any[] = [];

    if (startDate && endDate) {
      sales = await filterSalesByDateRange(startDate, endDate);
    } else {
      sales = await getSales();
    }

    const completedSales = sales.filter((s) => s.status === "completed");

    // Group by product
    const productData = new Map<string, { quantity: number; revenue: number }>();

    for (const sale of completedSales) {
      const currentData = productData.get(sale.itemName) || {
        quantity: 0,
        revenue: 0,
      };
      productData.set(sale.itemName, {
        quantity: currentData.quantity + sale.items,
        revenue: currentData.revenue + sale.totalAmount,
      });
    }

    // Convert to array and sort by revenue descending
    return Array.from(productData.entries())
      .map(([product, data]) => ({
        product,
        quantitySold: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Error getting best performing products data:", error);
    throw new Error("Failed to get best performing products data");
  }
};

// Get available categories
export const getAvailableCategories = async (): Promise<string[]> => {
  try {
    const products = await getProducts();
    const categories = new Set<string>();

    for (const product of products) {
      if (product.category) {
        categories.add(product.category);
      }
    }

    return Array.from(categories).sort();
  } catch (error) {
    console.error("Error getting available categories:", error);
    throw new Error("Failed to get available categories");
  }
};

// Export report items to CSV
export const exportReportItemsToCSV = (reportItems: ReportItem[]): string => {
  const headers = [
    "Report ID",
    "Product/Service",
    "Description",
    "Category",
    "Amount",
    "Revenue",
    "COG",
    "Gross Profit/Loss",
    "Date",
    "Type",
  ];

  const rows = reportItems.map((item) => [
    item.reportId,
    item.productService,
    item.description,
    item.category,
    item.amount,
    item.revenue,
    item.cog,
    item.grossProfitLoss,
    item.date.toISOString().split("T")[0],
    item.type,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
};
