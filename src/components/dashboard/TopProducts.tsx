import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cable, Headphones, BatteryFull, Smartphone, Monitor } from "lucide-react";

const products = [
  { name: "Type-C Charger", sold: 120, icon: Cable },
  { name: "Wireless Earbuds", sold: 85, icon: Headphones },
  { name: "Phone Batteries", sold: 60, icon: BatteryFull },
  { name: "Screen Protectors", sold: 55, icon: Smartphone },
  { name: "Power Banks", sold: 42, icon: Monitor },
];

export function TopProducts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <product.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">{product.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{product.sold}</span> Sold
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
