import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { getDashboardKPI } from "@/services/dashboardService";
import { DashboardKPI } from "@/services/dashboardService";
import { useSaleDialog } from "@/contexts/SaleDialogContext";
import { usePurchaseDialog } from "@/contexts/PurchaseDialogContext";
import { useExpenseDialog } from "@/contexts/ExpenseDialogContext";
import NewSaleDialog from "@/components/sales/NewSaleDialog";
import NewPurchaseDialog from "@/components/purchases/NewPurchaseDialog";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";

export default function Dashboard() {
  const [kpiData, setKpiData] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);

  // Context hooks
  const { isNewSaleDialogOpen: globalSaleDialogOpen, closeNewSaleDialog } = useSaleDialog();
  const { isNewPurchaseDialogOpen: globalPurchaseDialogOpen, closeNewPurchaseDialog } = usePurchaseDialog();
  const { isAddExpenseDialogOpen: globalExpenseDialogOpen, closeAddExpenseDialog } = useExpenseDialog();

  // Sync with global dialog states
  useEffect(() => {
    if (globalSaleDialogOpen) {
      setIsNewSaleDialogOpen(true);
      closeNewSaleDialog();
    }
  }, [globalSaleDialogOpen, closeNewSaleDialog]);

  useEffect(() => {
    if (globalPurchaseDialogOpen) {
      setIsNewPurchaseDialogOpen(true);
      closeNewPurchaseDialog();
    }
  }, [globalPurchaseDialogOpen, closeNewPurchaseDialog]);

  useEffect(() => {
    if (globalExpenseDialogOpen) {
      setIsAddExpenseDialogOpen(true);
      closeAddExpenseDialog();
    }
  }, [globalExpenseDialogOpen, closeAddExpenseDialog]);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const data = await getDashboardKPI();
        setKpiData(data);
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  return (
    <ERPLayout
      title="Welcome to Your Business Dashboard"
      subtitle="Overview of your shop's performance"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Sales"
          value={loading ? "Loading..." : `KSh ${kpiData?.todaySales.toLocaleString() || 0}`}
          subtitle={loading ? "..." : `${kpiData?.todayTransactions || 0} Transactions`}
          variant="sales"
        />
        <KPICard
          title="Monthly Revenue"
          value={loading ? "Loading..." : `KSh ${kpiData?.monthlyRevenue.toLocaleString() || 0}`}
          subtitle="This Month"
          variant="revenue"
        />
        <KPICard
          title="Net Profit"
          value={loading ? "Loading..." : `KSh ${kpiData?.monthlyNetProfit.toLocaleString() || 0}`}
          subtitle="This Month"
          variant="profit"
        />
        <KPICard
          title="Low Stock Alerts"
          value={loading ? "Loading..." : `${kpiData?.lowStockCount || 0} Items`}
          subtitle="Restock Needed"
          variant="alert"
        />
      </div>

      {/* Charts and Top Products */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SalesChart />
        <TopProducts />
      </div>

      {/* Quick Actions and Recent Activities */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <QuickActions
          onNewSaleClick={() => setIsNewSaleDialogOpen(true)}
          onAddPurchaseClick={() => setIsNewPurchaseDialogOpen(true)}
          onRecordExpenseClick={() => setIsAddExpenseDialogOpen(true)}
        />
        <RecentActivities />
      </div>

      {/* Dialogs */}
      <NewSaleDialog
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleAdded={() => {}}
      />
      <NewPurchaseDialog
        isOpen={isNewPurchaseDialogOpen}
        onClose={() => setIsNewPurchaseDialogOpen(false)}
        onPurchaseAdded={() => {}}
      />
      <AddExpenseDialog
        isOpen={isAddExpenseDialogOpen}
        onClose={() => setIsAddExpenseDialogOpen(false)}
        onExpenseAdded={() => {}}
      />
    </ERPLayout>
  );
}
