import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Truck, Receipt, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeToRecentActivities, Activity } from "@/services/dashboardService";

type ActivityType = "sale" | "purchase" | "expense" | "service";

const activityConfig: Record<ActivityType, { icon: typeof ShoppingCart; color: string; label: string }> = {
  sale: { icon: ShoppingCart, color: "text-erp-blue bg-erp-blue/10", label: "Sale" },
  purchase: { icon: Truck, color: "text-erp-green bg-erp-green/10", label: "Purchase" },
  expense: { icon: Receipt, color: "text-erp-orange bg-erp-orange/10", label: "Expense" },
  service: { icon: Wrench, color: "text-purple-600 bg-purple-100", label: "Service" },
};

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Set a timeout to ensure loading state is cleared even if data doesn't load
    const timeoutId = setTimeout(() => {
      if (isMounted.current && loading) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Subscribe to real-time updates for recent activities
    const unsubscribe = subscribeToRecentActivities(5, (data) => {
      if (isMounted.current) {
        setActivities(data);
        setLoading(false);
        setError(null);
        clearTimeout(timeoutId);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted.current = false;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - only run on mount

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading activities...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No recent activities
          </div>
        ) : (
          activities.map((activity, index) => {
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
          })
        )}
      </CardContent>
    </Card>
  );
}
