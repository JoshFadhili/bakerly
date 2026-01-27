import { ERPLayout } from "@/components/layout/ERPLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivities } from "@/components/dashboard/RecentActivities";

export default function Dashboard() {
  return (
    <ERPLayout
      title="Welcome to Your Business Dashboard"
      subtitle="Overview of your shop's performance"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Sales"
          value="KSh 15,800"
          subtitle="32 Transactions"
          variant="sales"
        />
        <KPICard
          title="Monthly Revenue"
          value="KSh 320,500"
          subtitle="This Month"
          variant="revenue"
        />
        <KPICard
          title="Net Profit"
          value="KSh 85,200"
          subtitle="This Month"
          variant="profit"
        />
        <KPICard
          title="Low Stock Alerts"
          value="5 Items"
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
        <QuickActions />
        <RecentActivities />
      </div>
    </ERPLayout>
  );
}
