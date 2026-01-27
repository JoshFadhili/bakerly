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
import { Search, Download, AlertTriangle, Plus } from "lucide-react";

const inventoryData = [
  {
    id: 1,
    name: "Type-C Charger",
    category: "Chargers",
    stockInHand: 150,
    minStock: 20,
    unit: "pcs",
    lastUpdated: "2024-01-26",
    value: 37500,
  },
  {
    id: 2,
    name: "Wireless Earbuds",
    category: "Audio",
    stockInHand: 45,
    minStock: 15,
    unit: "pcs",
    lastUpdated: "2024-01-25",
    value: 36000,
  },
  {
    id: 3,
    name: "Phone Batteries",
    category: "Batteries",
    stockInHand: 8,
    minStock: 25,
    unit: "pcs",
    lastUpdated: "2024-01-24",
    value: 2800,
  },
  {
    id: 4,
    name: "Screen Protector",
    category: "Accessories",
    stockInHand: 200,
    minStock: 50,
    unit: "pcs",
    lastUpdated: "2024-01-26",
    value: 10000,
  },
  {
    id: 5,
    name: "Power Bank",
    category: "Power",
    stockInHand: 3,
    minStock: 10,
    unit: "pcs",
    lastUpdated: "2024-01-20",
    value: 1800,
  },
  {
    id: 6,
    name: "USB Cables",
    category: "Cables",
    stockInHand: 5,
    minStock: 30,
    unit: "pcs",
    lastUpdated: "2024-01-22",
    value: 500,
  },
];

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredInventory = inventoryData.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (filter === "low") {
      return matchesSearch && item.stockInHand < item.minStock;
    }
    return matchesSearch;
  });

  const lowStockCount = inventoryData.filter(
    (item) => item.stockInHand < item.minStock
  ).length;

  return (
    <ERPLayout title="Inventory" subtitle="Track stock levels and manage inventory">
      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{inventoryData.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Stock Value</p>
            <p className="text-2xl font-bold">
              KSh {inventoryData.reduce((acc, item) => acc + item.value, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-orange">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold">
              {new Set(inventoryData.map((item) => item.category)).size}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-red">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="text-2xl font-bold text-erp-red">{lowStockCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="low" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low Stock
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="success" size="sm">
              <Plus className="h-4 w-4" />
              Stock Adjustment
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Stock In Hand</TableHead>
                  <TableHead className="hidden md:table-cell">Min Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.stockInHand < item.minStock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.category}
                      </TableCell>
                      <TableCell>
                        {item.stockInHand} {item.unit}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.minStock} {item.unit}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        KSh {item.value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isLowStock
                              ? "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                              : "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                          }
                        >
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ERPLayout>
  );
}
