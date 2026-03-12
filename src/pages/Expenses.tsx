import { useState, useEffect } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, TrendingDown, TrendingUp, Filter } from "lucide-react";
import { getExpenses, deleteExpense, filterExpensesByCategory, filterExpensesByAmountRange, filterExpensesByMonthAndYear } from "@/services/expenseService";
import { Expense } from "@/types/expense";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";
import EditExpenseDialog from "@/components/expenses/EditExpenseDialog";
import { sortByDateTimeDesc } from "@/lib/sortingUtils";
import { useExpenseDialog } from "@/contexts/ExpenseDialogContext";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Supplies",
  "Marketing",
  "Transportation",
  "Insurance",
  "Maintenance",
  "Office Expenses",
  "Professional Services",
  "Other",
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { isAddExpenseDialogOpen: globalDialogOpen, closeAddExpenseDialog } = useExpenseDialog();

  // Sync with global dialog state
  useEffect(() => {
    if (globalDialogOpen) {
      setIsAddDialogOpen(true);
      closeAddExpenseDialog();
    }
  }, [globalDialogOpen, closeAddExpenseDialog]);

  // Fetch expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter expenses based on search and filters
  useEffect(() => {
    filterExpenses();
  }, [expenses, searchQuery, categoryFilter, monthFilter, yearFilter, amountMin, amountMax]);

  // Check if any active filters
  useEffect(() => {
    setHasActiveFilters(
      categoryFilter !== "all" ||
      monthFilter !== "all" ||
      yearFilter !== "all" ||
      amountMin !== "" ||
      amountMax !== ""
    );
  }, [categoryFilter, monthFilter, yearFilter, amountMin, amountMax]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(sortByDateTimeDesc(data));
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(lowerQuery) ||
          expense.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    // Month filter
    if (monthFilter !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === parseInt(monthFilter);
      });
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === parseInt(yearFilter);
      });
    }

    // Amount range filter
    if (amountMin !== "") {
      filtered = filtered.filter((expense) => expense.amount >= parseFloat(amountMin));
    }
    if (amountMax !== "") {
      filtered = filtered.filter((expense) => expense.amount <= parseFloat(amountMax));
    }

    setFilteredExpenses(sortByDateTimeDesc(filtered));
  };

  const handleAddExpense = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm(`Are you sure you want to delete this expense: ${expense.description}?`)) {
      return;
    }

    try {
      if (expense.id) {
        await deleteExpense(expense.id);
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    }
  };

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  const handleExpenseUpdated = () => {
    fetchExpenses();
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setAmountMin("");
    setAmountMax("");
    setSearchQuery("");
  };

  // Get unique years from expenses
  const getAvailableYears = () => {
    const years = new Set(
      expenses.map((expense) => new Date(expense.date).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <ERPLayout title="Expenses" subtitle="Track and manage business expenses">
      {/* Summary Section */}
      <div className="mb-6 grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-erp-red">
                  KSh {totalExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Expenses</p>
                <p className="text-2xl font-bold">{filteredExpenses.length}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-erp-green" />
                <span className="text-sm">Highest: KSh {filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)).toLocaleString() : 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-erp-red" />
                <span className="text-sm">Lowest: KSh {filteredExpenses.length > 0 ? Math.min(...filteredExpenses.map(e => e.amount)).toLocaleString() : 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.slice(0, 5).map((category) => {
                const categoryExpenses = filteredExpenses.filter(e => e.category === category);
                const categoryTotal = categoryExpenses.reduce((acc, e) => acc + e.amount, 0);
                if (categoryTotal === 0) return null;
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{category}</span>
                    <span className="text-sm font-semibold">KSh {categoryTotal.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Expense Records</CardTitle>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "border-erp-blue text-erp-blue" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-erp-blue" />
                )}
              </Button>
              <Button variant="expense" size="sm" onClick={handleAddExpense}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filters Section */}
        {showFilters && (
          <CardContent className="border-b">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {getAvailableYears().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range (KSh)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">No expenses found</p>
              <Button variant="expense" size="sm" onClick={handleAddExpense}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(expense.date)}</div>
                            <div className="text-xs text-muted-foreground">{expense.time}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          KSh {expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onExpenseUpdated={handleExpenseUpdated}
        expense={selectedExpense}
      />
    </ERPLayout>
  );
}
