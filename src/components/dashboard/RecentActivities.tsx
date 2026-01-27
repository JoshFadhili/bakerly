import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Truck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "sale" | "purchase" | "expense";

interface Activity {
  type: ActivityType;
  description: string;
  amount: string;
}

const activities: Activity[] = [
  { type: "sale", description: "2 Screen Protectors sold", amount: "KSh 1,000" },
  { type: "purchase", description: "30 Phone Batteries added", amount: "" },
  { type: "expense", description: "Shop Rent Paid", amount: "KSh 8,000" },
  { type: "sale", description: "5 Type-C Chargers sold", amount: "KSh 2,500" },
  { type: "purchase", description: "20 Wireless Earbuds added", amount: "" },
];

const activityConfig: Record<ActivityType, { icon: typeof ShoppingCart; color: string; label: string }> = {
  sale: { icon: ShoppingCart, color: "text-erp-blue bg-erp-blue/10", label: "Sale" },
  purchase: { icon: Truck, color: "text-erp-green bg-erp-green/10", label: "Purchase" },
  expense: { icon: Receipt, color: "text-erp-orange bg-erp-orange/10", label: "Expense" },
};

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 text-sm">
                <span className="font-medium">{config.label}:</span>{" "}
                <span className="text-muted-foreground">{activity.description}</span>
                {activity.amount && (
                  <span className="font-semibold"> – {activity.amount}</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
