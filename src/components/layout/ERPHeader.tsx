import { HelpCircle, ShoppingCart, Wrench, Moon, Sun } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useHelpDialog } from "@/contexts/HelpDialogContext";
import { toast } from "sonner";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

interface ERPHeaderProps {
  title: string;
  subtitle?: string;
}

export function ERPHeader({ title, subtitle }: ERPHeaderProps) {
  const navigate = useNavigate();
  const { openNewSaleDialog } = useSaleDialog();
  const { openNewServiceOfferedDialog } = useServiceOfferedDialog();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openHelpDialog } = useHelpDialog();

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

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      toast.error(errorMessage);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
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
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => openHelpDialog()}
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <NotificationDropdown />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} alt="User" />
                  <AvatarFallback className="bg-erp-blue text-primary-foreground text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  {user?.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
