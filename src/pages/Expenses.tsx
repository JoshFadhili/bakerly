import { useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, TrendingDown, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const expensesData = [
  { id: 1, date: "2024-01-26", description: "Shop Rent", category: "Rent", amount: 25000 },
  { id: 2, date: "2024-01-25", description: "Electricity Bill", category: "Utilities", amount: 4500 },
  { id: 3, date: "2024-01-24", description: "Staff Salary - John", category: "Salaries", amount: 15000 },
  { id: 4, date: "2024-01-24", description: "Staff Salary - Jane", category: "Salaries", amount: 12000 },
  { id: 5, date: "2024-01-23", description: "Internet Service", category: "Utilities", amount: 3000 },
  { id: 6, date: "2024-01-22", description: "Shop Supplies", category: "Supplies", amount: 2500 },
];

const chartData = [
  { name: "Tue", value: 3500 },
  { name: "Mon", value: 27000 },
  { name: "Tue", value: 4500 },
  { name: "Wed", value: 0 },
  { name: "Thu", value: 2500 },
  { name: "Fri", value: 1500 },
  { name: "Sat", value: 0 },
];

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExpenses = expensesData.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expensesData.reduce((acc, e) => acc + e.amount, 0);

  return (
    <ERPLayout title="Expenses" subtitle="Track and manage business expenses">
      {/* Summary Section */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Profit & Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Sales Revenue</p>
                <p className="text-2xl font-bold text-erp-green">KSh 320,500</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add/Gross:</p>
                <p className="text-2xl font-bold">KSh 38,060</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-erp-green" />
                <span className="text-sm">Purchase Cost: KSh 780</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-erp-red" />
                <span className="text-sm">Kumamwinja Sales: KSh 4110</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dependency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">New Socks:</p>
            <p className="text-xl font-bold">80K</p>
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--erp-teal))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Tabs defaultValue="customers">
              <TabsList>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="expenses">Sales Expenses</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="expense" size="sm">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      KSh {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-erp-red">
                KSh {totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ERPLayout>
  );
}
