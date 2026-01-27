import { useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

const productsData = [
  {
    id: 1,
    name: "Type-C Charger",
    category: "Chargers",
    costPrice: 250,
    salePrice: 450,
    stock: 150,
    status: "active",
  },
  {
    id: 2,
    name: "Wireless Earbuds",
    category: "Audio",
    costPrice: 800,
    salePrice: 1500,
    stock: 45,
    status: "active",
  },
  {
    id: 3,
    name: "Phone Batteries",
    category: "Batteries",
    costPrice: 350,
    salePrice: 600,
    stock: 8,
    status: "low",
  },
  {
    id: 4,
    name: "Screen Protector",
    category: "Accessories",
    costPrice: 50,
    salePrice: 150,
    stock: 200,
    status: "active",
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    category: "Audio",
    costPrice: 1200,
    salePrice: 2000,
    stock: 25,
    status: "active",
  },
  {
    id: 6,
    name: "Power Bank 10000mAh",
    category: "Power",
    costPrice: 600,
    salePrice: 1100,
    stock: 3,
    status: "low",
  },
];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = productsData.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ERPLayout
      title="Products & Services"
      subtitle="Manage your product catalog"
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="goods" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="goods">Goods</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="success" size="sm">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead className="hidden md:table-cell">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.category}
                    </TableCell>
                    <TableCell>KSh {product.costPrice.toLocaleString()}</TableCell>
                    <TableCell>KSh {product.salePrice.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.stock} Units
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status === "active"
                            ? "bg-erp-green/10 text-erp-green hover:bg-erp-green/20"
                            : "bg-erp-red/10 text-erp-red hover:bg-erp-red/20"
                        }
                      >
                        {product.status === "active" ? "Active" : "Low Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
