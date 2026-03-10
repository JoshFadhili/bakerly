import { useState, useEffect } from "react";
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
import {
  getDailySalesChartData,
  getMonthlySalesChartData,
  getYearlySalesChartData,
  SalesChartData,
} from "@/services/dashboardService";

type Period = "daily" | "monthly" | "yearly";

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<SalesChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let chartData: SalesChartData[];
        
        switch (period) {
          case "daily":
            chartData = await getDailySalesChartData();
            break;
          case "monthly":
            chartData = await getMonthlySalesChartData();
            break;
          case "yearly":
            chartData = await getYearlySalesChartData();
            break;
          default:
            chartData = [];
        }
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales chart data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

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
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
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
                  formatter={(value: number, name: string) => {
                    if (name === "Revenue") {
                      return [`KSh ${value.toLocaleString()}`, "Revenue"];
                    }
                    return [value.toLocaleString(), "Sales"];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
