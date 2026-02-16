import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import {
  getCategories,
  addCategory,
  deleteCategory,
} from "@/services/categoryService";
import { Category } from "@/types/category";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryChange?: () => void;
}

export default function CategoryDialog({
  open,
  onOpenChange,
  onCategoryChange,
}: CategoryDialogProps) {
  const [goodsCategories, setGoodsCategories] = useState<Category[]>([]);
  const [servicesCategories, setServicesCategories] = useState<Category[]>([]);
  const [newGoodsCategory, setNewGoodsCategory] = useState("");
  const [newServicesCategory, setNewServicesCategory] = useState("");
  const [activeTab, setActiveTab] = useState<"goods" | "services">("goods");

  const fetchCategories = async () => {
    try {
      const [goodsList, servicesList] = await Promise.all([
        getCategories("goods"),
        getCategories("services"),
      ]);
      setGoodsCategories(goodsList);
      setServicesCategories(servicesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleAddGoodsCategory = async () => {
    if (!newGoodsCategory.trim()) return;
    await addCategory(newGoodsCategory, "goods");
    setNewGoodsCategory("");
    fetchCategories();
    onCategoryChange?.();
  };

  const handleAddServicesCategory = async () => {
    if (!newServicesCategory.trim()) return;
    await addCategory(newServicesCategory, "services");
    setNewServicesCategory("");
    fetchCategories();
    onCategoryChange?.();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    fetchCategories();
    onCategoryChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: "goods" | "services") => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goods">Product Categories</TabsTrigger>
            <TabsTrigger value="services">Service Categories</TabsTrigger>
          </TabsList>

          {/* Goods Categories Tab */}
          <TabsContent value="goods" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New product category name"
                  value={newGoodsCategory}
                  onChange={(e) => setNewGoodsCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddGoodsCategory();
                  }}
                />
                <Button onClick={handleAddGoodsCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goodsCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No product categories yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      goodsCategories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Services Categories Tab */}
          <TabsContent value="services" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New service category name"
                  value={newServicesCategory}
                  onChange={(e) => setNewServicesCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddServicesCategory();
                  }}
                />
                <Button onClick={handleAddServicesCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicesCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No service categories yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      servicesCategories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
