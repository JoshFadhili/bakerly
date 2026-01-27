import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

const salesTrendData = [
  { name: "Mon", value: 65000 },
  { name: "Tue", value: 78000 },
  { name: "Wed", value: 92000 },
  { name: "Thu", value: 85000 },
  { name: "Fri", value: 110000 },
  { name: "Sat", value: 125000 },
  { name: "Sun", value: 98000 },
];

export default function Finance() {
  return (
    <ERPLayout title="Finance" subtitle="Financial overview and cash flow management">
      {/* Tabs */}
      <Tabs defaultValue="today" className="mb-6">
        <TabsList>
          <TabsTrigger value="today">Today Reports</TabsTrigger>
          <TabsTrigger value="cash">Cash Inventory</TabsTrigger>
          <TabsTrigger value="records">Records in Borrowers</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-erp-green/10">
              <TrendingUp className="h-6 w-6 text-erp-green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Revenue</p>
              <p className="text-xl font-bold">KSh 320,500</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-red">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-erp-red/10">
              <TrendingDown className="h-6 w-6 text-erp-red" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Changes</p>
              <p className="text-xl font-bold">TSh</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-erp-blue/10">
              <Wallet className="h-6 w-6 text-erp-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transfer Earnings</p>
              <p className="text-xl font-bold">KSh 4,50,660</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-purple">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-erp-purple/10">
              <CreditCard className="h-6 w-6 text-erp-purple" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Void Phone</p>
              <p className="text-xl font-bold">0 M Firm</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit & Loss + Sales Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profit & Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-medium">Northnaps</span>
                <span className="text-lg font-bold text-erp-green">
                  KSh 320,500
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-medium">Amd Exports</span>
                <span className="text-lg font-bold">KSh 85,200</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-medium">Annewarn</span>
                <span className="text-lg font-bold text-erp-red">-KSh 12,500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sales Trend</CardTitle>
            <div className="flex gap-2">
              <Tabs defaultValue="daily">
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v / 1000}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `KSh ${value.toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--erp-blue))"
                    fill="hsl(var(--erp-blue) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </ERPLayout>
  );
}
