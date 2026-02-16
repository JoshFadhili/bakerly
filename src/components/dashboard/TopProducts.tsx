import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { getTopProducts, TopProduct } from "@/services/dashboardService";

export function TopProducts() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const data = await getTopProducts(5);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching top products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No sales data available
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{product.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{product.sold}</span> Sold
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
