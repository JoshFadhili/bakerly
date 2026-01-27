import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Plus } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const topProducts = [
  { name: "Type-C Chargers", sold: "60 Sold", revenue: "KSh 27,000" },
  { name: "Wireless Earbuds", sold: "45 Sold", revenue: "KSh 67,500" },
  { name: "Screen Protectors", sold: "120 Sold", revenue: "KSh 18,000" },
  { name: "Phone Batteries", sold: "35 Sold", revenue: "KSh 21,000" },
  { name: "Power Banks", sold: "25 Sold", revenue: "KSh 27,500" },
];

const expenseBreakdown = [
  { name: "Rent", value: 25000, color: "hsl(var(--erp-blue))" },
  { name: "Utilities", value: 7500, color: "hsl(var(--erp-green))" },
  { name: "Salaries", value: 27000, color: "hsl(var(--erp-orange))" },
  { name: "Supplies", value: 2500, color: "hsl(var(--erp-teal))" },
  { name: "Other", value: 5000, color: "hsl(var(--erp-purple))" },
];

export default function Reports() {
  return (
    <ERPLayout
      title="Sales Reports"
      subtitle="Analyze sales performance and generate reports"
    >
      {/* Tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Product Progress</TabsTrigger>
            <TabsTrigger value="sales">Sales by Momunns</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Card Gadzoots
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4" />
            Reviews w/ Suspense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">KSh 320,500</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Sale Value</p>
            <p className="text-2xl font-bold">KSh 410</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-orange">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Matched, Clustering</p>
            <p className="text-2xl font-bold">1.3 → 1.2.3</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-teal">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Calesic Revenue</p>
            <p className="text-2xl font-bold">60% Net</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Top Selling Products
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sold}</TableCell>
                    <TableCell className="text-right">{product.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="h-48 w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `KSh ${value.toLocaleString()}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 lg:w-1/2">
                {expenseBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(
                        (item.value /
                          expenseBreakdown.reduce((a, b) => a + b.value, 0)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ERPLayout>
  );
}
