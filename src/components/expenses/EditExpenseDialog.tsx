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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateExpense } from "@/services/expenseService";
import { Expense } from "@/types/expense";
import { Calendar, Clock } from "lucide-react";

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated: () => void;
  expense: Expense | null;
}

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

export default function EditExpenseDialog({
  isOpen,
  onClose,
  onExpenseUpdated,
  expense,
}: EditExpenseDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    description: "",
    category: "",
    amount: "",
  });

  // Initialize form with expense data when expense changes
  useEffect(() => {
    if (expense) {
      const dateStr = expense.date instanceof Date
        ? expense.date.toISOString().split('T')[0]
        : new Date(expense.date).toISOString().split('T')[0];

      setFormData({
        date: dateStr,
        time: expense.time,
        description: expense.description,
        category: expense.category,
        amount: expense.amount.toString(),
      });
    }
  }, [expense]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!expense || !expense.id) {
        throw new Error("Expense ID is required");
      }

      await updateExpense(expense.id, {
        date: new Date(formData.date),
        time: formData.time,
        description: formData.description,
        category: formData.category,
        amount: Number(formData.amount),
      });

      onClose();
      onExpenseUpdated();
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Enter expense description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KSh)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
