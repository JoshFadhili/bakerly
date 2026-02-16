import { Bell, HelpCircle, ShoppingCart, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useSaleDialog } from "@/contexts/SaleDialogContext";
import { useServiceOfferedDialog } from "@/contexts/ServiceOfferedDialogContext";

interface ERPHeaderProps {
  title: string;
  subtitle?: string;
}

export function ERPHeader({ title, subtitle }: ERPHeaderProps) {
  const navigate = useNavigate();
  const { openNewSaleDialog } = useSaleDialog();
  const { openNewServiceOfferedDialog } = useServiceOfferedDialog();

  const handleNewSaleClick = () => {
    // Navigate to sales page
    navigate("/sales");
    // Open the dialog (will be handled by the Sales page)
    setTimeout(() => openNewSaleDialog(), 100);
  };

  const handleNewServiceOfferedClick = () => {
    // Navigate to sales page
    navigate("/sales");
    // Open the dialog (will be handled by the Sales page)
    setTimeout(() => openNewServiceOfferedDialog(), 100);
  };

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="pt-10 lg:pt-0">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="sale" size="sm" onClick={handleNewSaleClick}>
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">New Sale</span>
        </Button>
        <Button variant="success" size="sm" onClick={handleNewServiceOfferedClick}>
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">New Service Offered</span>
        </Button>

        <div className="ml-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-erp-red text-[10px] font-medium text-primary-foreground">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-erp-blue text-primary-foreground text-sm">
                    ND
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
