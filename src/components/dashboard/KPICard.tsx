import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type KPIVariant = "sales" | "revenue" | "profit" | "alert";

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  variant: KPIVariant;
  icon?: LucideIcon;
}

const variantStyles: Record<KPIVariant, string> = {
  sales: "bg-gradient-to-br from-erp-blue to-erp-blue/80",
  revenue: "bg-gradient-to-br from-erp-green to-erp-green/80",
  profit: "bg-gradient-to-br from-erp-teal to-erp-teal/80",
  alert: "bg-gradient-to-br from-erp-red to-erp-red/80",
};

export function KPICard({ title, value, subtitle, variant }: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-5 text-primary-foreground shadow-md transition-transform hover:scale-[1.02]",
        variantStyles[variant]
      )}
    >
      <p className="text-sm font-medium opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm opacity-80">{subtitle}</p>
    </div>
  );
}
