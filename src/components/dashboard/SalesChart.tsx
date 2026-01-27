import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dailyData = [
  { name: "Mon", sales: 65000, revenue: 72000 },
  { name: "Tue", sales: 59000, revenue: 68000 },
  { name: "Wed", sales: 80000, revenue: 78000 },
  { name: "Thu", sales: 81000, revenue: 75000 },
  { name: "Fri", sales: 56000, revenue: 65000 },
  { name: "Sat", sales: 55000, revenue: 70000 },
  { name: "Sun", sales: 70000, revenue: 78000 },
];

const monthlyData = [
  { name: "Jan", sales: 450000, revenue: 520000 },
  { name: "Feb", sales: 380000, revenue: 420000 },
  { name: "Mar", sales: 520000, revenue: 580000 },
  { name: "Apr", sales: 490000, revenue: 550000 },
  { name: "May", sales: 610000, revenue: 680000 },
  { name: "Jun", sales: 580000, revenue: 640000 },
];

const yearlyData = [
  { name: "2020", sales: 4500000, revenue: 5200000 },
  { name: "2021", sales: 5200000, revenue: 5800000 },
  { name: "2022", sales: 6100000, revenue: 6800000 },
  { name: "2023", sales: 7200000, revenue: 7900000 },
  { name: "2024", sales: 8500000, revenue: 9200000 },
];

type Period = "daily" | "monthly" | "yearly";

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("daily");

  const data =
    period === "daily"
      ? dailyData
      : period === "monthly"
      ? monthlyData
      : yearlyData;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Sales & Revenue</CardTitle>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["daily", "monthly", "yearly"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="xs"
              onClick={() => setPeriod(p)}
              className={cn(
                "capitalize",
                period === p && "shadow-none"
              )}
            >
              {p === "daily" ? "Daily" : p === "monthly" ? "Monthly" : "Yearly"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}K`}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`KSh ${value.toLocaleString()}`, ""]}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="hsl(var(--erp-blue))"
                radius={[4, 4, 0, 0]}
                name="Sales"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--erp-orange))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--erp-orange))", strokeWidth: 0, r: 4 }}
                name="Revenue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
