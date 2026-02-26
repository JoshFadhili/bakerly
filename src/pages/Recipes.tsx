import { useEffect, useState } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, ChefHat, DollarSign, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Recipe, RecipeIngredient } from "@/types/recipe";
import { Product } from "@/types/product";
import { BakingSupply } from "@/types/bakingSupply";
import { getProducts } from "@/services/productService";
import { getBakingSupplies } from "@/services/bakingSupplyService";
import { calculateAverageUnitPriceFromBatches } from "@/services/bakingSupplyPurchaseService";
import {
  getRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeByProductId,
  calculateProductionCost,
} from "@/services/recipeService";
import { sortByDateTimeDesc } from "@/lib/sortingUtils";

export default function Recipes() {
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bakingSupplies, setBakingSupplies] = useState<BakingSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    productId: string;
    productName: string;
    ingredients: RecipeIngredient[];
    yieldQuantity: number;
    yieldUnit: string;
    notes: string;
  }>({
    productId: "",
    productName: "",
    ingredients: [],
    yieldQuantity: 1,
    yieldUnit: "pieces",
    notes: "",
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipesData, productsData, bakingSuppliesData] = await Promise.all([
        getRecipes(),
        getProducts(),
        getBakingSupplies(),
      ]);
      setRecipes(recipesData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      }));
      setProducts(productsData);
      setBakingSupplies(bakingSuppliesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get products without recipes
  const productsWithoutRecipes = products.filter(
    (product) => !recipes.some((recipe) => recipe.productId === product.id)
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: "",
      productName: "",
      ingredients: [],
      yieldQuantity: 1,
      yieldUnit: "pieces",
      notes: "",
    });
  };

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        productName: product.name,
      });
    }
  };

  // Add ingredient to form
  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          bakingSupplyId: "",
          bakingSupplyName: "",
          quantity: 0,
          unit: "",
          unitCost: 0,
          totalCost: 0,
        },
      ],
    });
  };

  // Remove ingredient from form
  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      ingredients: newIngredients,
    });
  };

  // Update ingredient
  const updateIngredient = async (index: number, field: keyof RecipeIngredient, value: any) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };

    // If baking supply is selected, populate name, unit, and cost
    if (field === "bakingSupplyId") {
      const supply = bakingSupplies.find((s) => s.id === value);
      if (supply) {
        newIngredients[index].bakingSupplyName = supply.name;
        newIngredients[index].unit = supply.unit;
        
        // Use average unit price from batches (more accurate than salePrice)
        try {
          const avgUnitPrice = await calculateAverageUnitPriceFromBatches(supply.name);
          newIngredients[index].unitCost = avgUnitPrice > 0 ? avgUnitPrice : (supply.salePrice || 0);
        } catch (error) {
          console.error("Error fetching average unit price:", error);
          // Fallback to salePrice if there's an error
          newIngredients[index].unitCost = supply.salePrice || 0;
        }
      }
    }

    // Calculate total cost
    newIngredients[index].totalCost =
      newIngredients[index].quantity * newIngredients[index].unitCost;

    setFormData({
      ...formData,
      ingredients: newIngredients,
    });
  };

  // Calculate total production cost
  const totalProductionCost = calculateProductionCost(formData.ingredients);

  // Handle add recipe
  const handleAddRecipe = async () => {
    try {
      if (!formData.productId) {
        toast.error("Please select a product");
        return;
      }
      if (formData.ingredients.length === 0) {
        toast.error("Please add at least one ingredient");
        return;
      }
      if (formData.ingredients.some((ing) => !ing.bakingSupplyId || ing.quantity <= 0)) {
        toast.error("Please fill in all ingredient details");
        return;
      }

      const recipe: Omit<Recipe, "id"> = {
        productId: formData.productId,
        productName: formData.productName,
        ingredients: formData.ingredients,
        totalProductionCost,
        yieldQuantity: formData.yieldQuantity,
        yieldUnit: formData.yieldUnit,
        notes: formData.notes,
        createdAt: new Date(),
      };

      await addRecipe(recipe);
      toast.success("Recipe added successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error("Failed to add recipe");
    }
  };

  // Handle edit recipe
  const handleEditRecipe = async () => {
    try {
      if (!selectedRecipe?.id) return;
      if (formData.ingredients.length === 0) {
        toast.error("Please add at least one ingredient");
        return;
      }
      if (formData.ingredients.some((ing) => !ing.bakingSupplyId || ing.quantity <= 0)) {
        toast.error("Please fill in all ingredient details");
        return;
      }

      const updatedRecipe: Partial<Recipe> = {
        ingredients: formData.ingredients,
        totalProductionCost,
        yieldQuantity: formData.yieldQuantity,
        yieldUnit: formData.yieldUnit,
        notes: formData.notes,
      };

      await updateRecipe(selectedRecipe.id, updatedRecipe);
      toast.success("Recipe updated successfully");
      setIsEditDialogOpen(false);
      setSelectedRecipe(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error("Failed to update recipe");
    }
  };

  // Handle delete recipe
  const handleDeleteRecipe = async () => {
    try {
      if (!selectedRecipe?.id) return;
      await deleteRecipe(selectedRecipe.id);
      toast.success("Recipe deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedRecipe(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  // Open edit dialog
  const openEditDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      productId: recipe.productId,
      productName: recipe.productName,
      ingredients: recipe.ingredients,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
      notes: recipe.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsViewDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  // Summary stats
  const totalRecipes = recipes.length;
  const productsWithRecipes = recipes.length;
  const avgProductionCost = recipes.length > 0
    ? recipes.reduce((acc, r) => acc + r.totalProductionCost, 0) / recipes.length
    : 0;

  return (
    <ERPLayout title="Recipe Details" subtitle="Manage recipes and production costs for your products">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-erp-blue">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-erp-blue" />
              <p className="text-sm text-muted-foreground">Total Recipes</p>
            </div>
            <p className="text-2xl font-bold">{totalRecipes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-green">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-erp-green" />
              <p className="text-sm text-muted-foreground">Products with Recipes</p>
            </div>
            <p className="text-2xl font-bold">{productsWithRecipes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-erp-orange">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-erp-orange" />
              <p className="text-sm text-muted-foreground">Avg. Production Cost</p>
            </div>
            <p className="text-2xl font-bold">KSh {avgProductionCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-muted-foreground">Products without Recipes</p>
            </div>
            <p className="text-2xl font-bold">{productsWithoutRecipes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Recipes</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="success" size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Recipe</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recipes found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Create your first recipe to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead>Yield</TableHead>
                    <TableHead>Production Cost</TableHead>
                    <TableHead>Cost per Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.productName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{recipe.ingredients.length} items</Badge>
                      </TableCell>
                      <TableCell>
                        {recipe.yieldQuantity} {recipe.yieldUnit}
                      </TableCell>
                      <TableCell>KSh {recipe.totalProductionCost.toFixed(2)}</TableCell>
                      <TableCell>
                        KSh {(recipe.totalProductionCost / recipe.yieldQuantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(recipe)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(recipe)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(recipe)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Recipe Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {productsWithoutRecipes.map((product) => (
                    <SelectItem key={product.id} value={product.id!}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productsWithoutRecipes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All products already have recipes
                </p>
              )}
            </div>

            {/* Yield */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Yield Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.yieldQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, yieldQuantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Yield Unit *</Label>
                <Select
                  value={formData.yieldUnit}
                  onValueChange={(value) => setFormData({ ...formData, yieldUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="cakes">Cakes</SelectItem>
                    <SelectItem value="dozens">Dozens</SelectItem>
                    <SelectItem value="batches">Batches</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              {formData.ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No ingredients added. Click "Add Ingredient" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-lg">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-xs">Supply</Label>
                        <Select
                          value={ingredient.bakingSupplyId}
                          onValueChange={(value) =>
                            updateIngredient(index, "bakingSupplyId", value)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {bakingSupplies.map((supply) => (
                              <SelectItem key={supply.id} value={supply.id!}>
                                {supply.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8"
                          value={ingredient.quantity || ""}
                          onChange={(e) =>
                            updateIngredient(index, "quantity", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Input
                          className="h-8"
                          value={ingredient.unit}
                          disabled
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Cost/Unit</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8"
                          value={ingredient.unitCost || ""}
                          onChange={(e) =>
                            updateIngredient(index, "unitCost", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">Total</Label>
                        <p className="text-sm font-medium h-8 flex items-center">
                          {ingredient.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Production Cost:</span>
              <span className="text-xl font-bold">KSh {totalProductionCost.toFixed(2)}</span>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes or instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipe}>Add Recipe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe: {selectedRecipe?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Yield */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Yield Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.yieldQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, yieldQuantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Yield Unit *</Label>
                <Select
                  value={formData.yieldUnit}
                  onValueChange={(value) => setFormData({ ...formData, yieldUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="cakes">Cakes</SelectItem>
                    <SelectItem value="dozens">Dozens</SelectItem>
                    <SelectItem value="batches">Batches</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              {formData.ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No ingredients added. Click "Add Ingredient" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-lg">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-xs">Supply</Label>
                        <Select
                          value={ingredient.bakingSupplyId}
                          onValueChange={(value) =>
                            updateIngredient(index, "bakingSupplyId", value)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {bakingSupplies.map((supply) => (
                              <SelectItem key={supply.id} value={supply.id!}>
                                {supply.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8"
                          value={ingredient.quantity || ""}
                          onChange={(e) =>
                            updateIngredient(index, "quantity", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Input
                          className="h-8"
                          value={ingredient.unit}
                          disabled
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Cost/Unit</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8"
                          value={ingredient.unitCost || ""}
                          onChange={(e) =>
                            updateIngredient(index, "unitCost", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">Total</Label>
                        <p className="text-sm font-medium h-8 flex items-center">
                          {ingredient.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Production Cost:</span>
              <span className="text-xl font-bold">KSh {totalProductionCost.toFixed(2)}</span>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes or instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRecipe}>Update Recipe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Recipe Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recipe Details: {selectedRecipe?.productName}</DialogTitle>
          </DialogHeader>
          {selectedRecipe && (
            <div className="space-y-4 py-4">
              {/* Yield Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Yield</p>
                  <p className="font-medium">
                    {selectedRecipe.yieldQuantity} {selectedRecipe.yieldUnit}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Cost per Unit</p>
                  <p className="font-medium">
                    KSh {(selectedRecipe.totalProductionCost / selectedRecipe.yieldQuantity).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supply</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <TableRow key={index}>
                        <TableCell>{ingredient.bakingSupplyName}</TableCell>
                        <TableCell>{ingredient.quantity} {ingredient.unit}</TableCell>
                        <TableCell>KSh {ingredient.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          KSh {ingredient.totalCost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">
                        Total Production Cost
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        KSh {selectedRecipe.totalProductionCost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {selectedRecipe.notes && (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedRecipe.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedRecipe) openEditDialog(selectedRecipe);
            }}>
              Edit Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the recipe for "{selectedRecipe?.productName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecipe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ERPLayout>
  );
}
