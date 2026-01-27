import { useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye } from "lucide-react";

const salesData = [
  {
    id: "INV-001",
    date: "2024-01-26",
    receipt: "R-420001",
    amount: 3500,
    items: 5,
    payment: "Cash",
    status: "completed",
  },
  {
    id: "INV-002",
    date: "2024-01-26",
    receipt: "R-420002",
    amount: 14500,
    items: 12,
    payment: "M-Pesa",
    status: "completed",
  },
  {
    id: "INV-003",
    date: "2024-01-26",
    receipt: "R-420003",
    amount: 8200,
    items: 8,
    payment: "Cash",
    status: "completed",
  },
  {
    id: "INV-004",
    date: "2024-01-25",
    receipt: "R-420004",
    amount: 6800,
    items: 4,
    payment: "Card",
    status: "completed",
  },
  {
    id: "INV-005",
    date: "2024-01-25",
    receipt: "R-420005",
    amount: 2200,
    items: 2,
    payment: "M-Pesa",
    status: "pending",
  },
];

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSales = salesData.filter(
    (sale) =>
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.receipt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ERPLayout title="Sales" subtitle="Track and manage all sales transactions">
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">
            Sales Transactions
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Items</TableHead>
                  <TableHead className="hidden md:table-cell">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.date}</TableCell>
                    <TableCell>{sale.receipt}</TableCell>
                    <TableCell>KSh {sale.amount.toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {sale.items} Items
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {sale.payment}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.status === "completed" ? "default" : "secondary"
                        }
                        className={
                          sale.status === "completed"
                            ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                            : ""
                        }
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ERPLayout>
  );
}
