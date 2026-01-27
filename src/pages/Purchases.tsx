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
import { Search, Plus, Eye } from "lucide-react";

const purchasesData = [
  {
    id: "PO-001",
    date: "2024-01-26",
    supplier: "PhoneSpot Limited",
    items: 4,
    total: 45000,
    status: "received",
  },
  {
    id: "PO-002",
    date: "2024-01-25",
    supplier: "Sony Enterprises",
    items: 6,
    total: 125000,
    status: "received",
  },
  {
    id: "PO-003",
    date: "2024-01-24",
    supplier: "TechHub Distributors",
    items: 8,
    total: 78000,
    status: "pending",
  },
  {
    id: "PO-004",
    date: "2024-01-23",
    supplier: "MobiParts Kenya",
    items: 3,
    total: 32000,
    status: "received",
  },
  {
    id: "PO-005",
    date: "2024-01-22",
    supplier: "Wireless Imports",
    items: 5,
    total: 89000,
    status: "cancelled",
  },
];

export default function Purchases() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPurchases = purchasesData.filter(
    (purchase) =>
      purchase.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-erp-green/10 text-erp-green hover:bg-erp-green/20";
      case "pending":
        return "bg-erp-orange/10 text-erp-orange hover:bg-erp-orange/20";
      case "cancelled":
        return "bg-erp-red/10 text-erp-red hover:bg-erp-red/20";
      default:
        return "";
    }
  };

  return (
    <ERPLayout title="Purchases" subtitle="Track purchases and supplier orders">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Purchases</p>
            <p className="text-2xl font-bold">
              KSh {purchasesData.reduce((acc, p) => acc + p.total, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Received Orders</p>
            <p className="text-2xl font-bold">
              {purchasesData.filter((p) => p.status === "received").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-orange">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-2xl font-bold">
              {purchasesData.filter((p) => p.status === "pending").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Purchase Orders</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="success" size="sm">
              <Plus className="h-4 w-4" />
              New Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell className="font-medium">{purchase.id}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {purchase.supplier}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {purchase.items} Items
                    </TableCell>
                    <TableCell>KSh {purchase.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(purchase.status)}>
                        {purchase.status}
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
