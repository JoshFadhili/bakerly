import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Receipt,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Box,
  Cake,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "Sales", path: "/sales" },
  { icon: Package, label: "Product, Services & Baking Supply details", path: "/products" },
  { icon: Warehouse, label: "Inventory", path: "/inventory" },
  { icon: Truck, label: "Baking supply purchases", path: "/purchases" },
  { icon: Cake, label: "Finished Products", path: "/finished-products" },
  { icon: ChefHat, label: "Recipes", path: "/recipes" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: BarChart3, label: "Finance", path: "/finance" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarContentProps {
  collapsed: boolean;
  onToggle?: () => void;
}

const SidebarContent = ({ collapsed, onToggle }: SidebarContentProps) => {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <img
          src="/Bakerly Logo.png"
          alt="Bakerly Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        {!collapsed && (
          <span className="text-lg font-semibold text-sidebar-foreground">
            Bakerly ERP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-orange-600 dark:hover:text-orange-400"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button (Desktop only) */}
      {onToggle && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export function ERPSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden text-gray-700 dark:text-gray-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Spacer for main content */}
      <div
        className={cn(
          "hidden transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      />
    </>
  );
}
