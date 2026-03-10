import { useState, useEffect, useRef } from "react";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, User, Bell, Shield, MapPin, Clock, Loader2, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { commonTimezones } from "@/services/settingsService";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  verifyAdminPassword,
  deleteAllSales,
  deleteAllServicesOffered,
  deleteAllProducts,
  deleteAllServices,
  deleteAllInventory,
  deleteAllPurchases,
  deleteAllFinishedProducts,
  deleteAllBatches,
  deleteAllStockAdjustments,
  deleteAllExpenses,
  deleteAllBakingSupplies,
  deleteAllBakingSupplyPurchases,
  deleteAllCategories,
  deleteAllRecipes,
  deleteAllRecipeUsageLogs,
  deleteAllSettings,
  deleteAllNotifications,
  deleteDepletedBatches,
  deleteAll,
  deleteUserAccount,
} from "@/services/adminService";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings, loading, updateProfile, updateBusiness, updateNotifications, detectUserLocation } = useSettings();
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Business state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("");
  const [timezone, setTimezone] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  // Notifications state
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [finishedProductThreshold, setFinishedProductThreshold] = useState(5);
  const [bakingSupplyThreshold, setBakingSupplyThreshold] = useState(10);
  const [dailySalesSummary, setDailySalesSummary] = useState(true);
  const [newOrderNotifications, setNewOrderNotifications] = useState(false);
  const [expenseReminders, setExpenseReminders] = useState(true);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Admin Controls state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref for timezone dropdown
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize state from settings
  useEffect(() => {
    if (settings) {
      setFirstName(settings.profile?.firstName || "");
      setLastName(settings.profile?.lastName || "");
      setEmail(settings.profile?.email || user?.email || "");
      setPhone(settings.profile?.phone || "");

      setBusinessName(settings.business?.name || "");
      setBusinessType(settings.business?.type || "");
      setAddress(settings.business?.address || "");
      setCurrency(settings.business?.currency || "KSh (Kenyan Shilling)");
      setTimezone(settings.business?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

      setLowStockAlerts(settings.notifications?.lowStockAlerts ?? true);
      setLowStockThreshold(settings.notifications?.lowStockThreshold ?? 5);
      setFinishedProductThreshold(settings.notifications?.finishedProductThreshold ?? 
        settings.notifications?.lowStockThreshold ?? 5);
      setBakingSupplyThreshold(settings.notifications?.bakingSupplyThreshold ?? 10);
      setDailySalesSummary(settings.notifications?.dailySalesSummary ?? true);
      setNewOrderNotifications(settings.notifications?.newOrderNotifications ?? false);
      setExpenseReminders(settings.notifications?.expenseReminders ?? true);

      setTwoFactorEnabled(settings.security?.twoFactorEnabled ?? false);
    } else if (user) {
      setEmail(user.email || "");
    }
  }, [settings, user]);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle profile save
  const handleProfileSave = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle business info save
  const handleBusinessSave = async () => {
    if (!businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    try {
      setSaving(true);
      await updateBusiness({
        name: businessName.trim(),
        type: businessType.trim(),
        address: address.trim(),
        currency: currency.trim(),
        timezone: timezone.trim(),
      });
      toast.success("Business information updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update business information");
    } finally {
      setSaving(false);
    }
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    try {
      setDetectingLocation(true);
      await detectUserLocation();
      toast.success("Location detected successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to detect location");
    } finally {
      setDetectingLocation(false);
    }
  };

  // Handle notifications save
  const handleNotificationsSave = async () => {
    try {
      setSaving(true);
      await updateNotifications({
        lowStockAlerts,
        lowStockThreshold,
        finishedProductThreshold,
        bakingSupplyThreshold,
        dailySalesSummary,
        newOrderNotifications,
        expenseReminders,
      });
      toast.success("Notification preferences updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update notification preferences");
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setSaving(true);

      // Reauthenticate user
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // Handle admin deletion action
  const handleAdminAction = (action: string) => {
    setSelectedAction(action);
    setAdminDialogOpen(true);
  };

  // Confirm deletion with password
  const handleConfirmDelete = async () => {
    if (!selectedAction || !adminPassword.trim()) {
      toast.error("Password is required");
      return;
    }

    try {
      setIsDeleting(true);

      // Verify password first
      await verifyAdminPassword(adminPassword);

      // Execute the selected action
      let deletedCount = 0;
      let successMessage = "";

      switch (selectedAction) {
        case "all":
          const results = await deleteAll();
          const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);
          successMessage = `Deleted all data: ${totalDeleted} total records (${results.sales} sales, ${results.products} products, ${results.services} services, ${results.inventory} inventory, ${results.finishedProducts} finished products, ${results.batches} batches, ${results.stockAdjustments} stock adjustments, ${results.expenses} expenses, ${results.servicesOffered} services offered, ${results.bakingSupplies} baking supplies, ${results.bakingSupplyPurchases} baking supply purchases, ${results.categories} categories, ${results.recipes} recipes, ${results.recipeUsageLogs} recipe usage logs, ${results.settings} settings, ${results.notifications} notifications)`;
          break;
        case "depletedBatches":
          deletedCount = await deleteDepletedBatches();
          successMessage = `Hidden ${deletedCount} depleted batch(es) from batch details view`;
          break;
        case "sales":
          deletedCount = await deleteAllSales();
          successMessage = `Deleted ${deletedCount} sale(s)`;
          break;
        case "servicesOffered":
          deletedCount = await deleteAllServicesOffered();
          successMessage = `Deleted ${deletedCount} service offered record(s)`;
          break;
        case "products":
          deletedCount = await deleteAllProducts();
          successMessage = `Deleted ${deletedCount} product(s)`;
          break;
        case "services":
          deletedCount = await deleteAllServices();
          successMessage = `Deleted ${deletedCount} service(s)`;
          break;
        case "inventory":
          deletedCount = await deleteAllInventory();
          successMessage = `Deleted ${deletedCount} inventory record(s)`;
          break;
        case "finishedProducts":
          deletedCount = await deleteAllFinishedProducts();
          successMessage = `Deleted ${deletedCount} finished product(s)`;
          break;
        case "batches":
          deletedCount = await deleteAllBatches();
          successMessage = `Deleted ${deletedCount} batch(es)`;
          break;
        case "stockAdjustments":
          deletedCount = await deleteAllStockAdjustments();
          successMessage = `Deleted ${deletedCount} stock adjustment(s)`;
          break;
        case "expenses":
          deletedCount = await deleteAllExpenses();
          successMessage = `Deleted ${deletedCount} expense(s)`;
          break;
        case "bakingSupplies":
          deletedCount = await deleteAllBakingSupplies();
          successMessage = `Deleted ${deletedCount} baking supply record(s)`;
          break;
        case "bakingSupplyPurchases":
          deletedCount = await deleteAllBakingSupplyPurchases();
          successMessage = `Deleted ${deletedCount} baking supply purchase(s)`;
          break;
        case "categories":
          deletedCount = await deleteAllCategories();
          successMessage = `Deleted ${deletedCount} category(ies)`;
          break;
        case "recipes":
          deletedCount = await deleteAllRecipes();
          successMessage = `Deleted ${deletedCount} recipe(s)`;
          break;
        case "recipeUsageLogs":
          deletedCount = await deleteAllRecipeUsageLogs();
          successMessage = `Deleted ${deletedCount} recipe usage log(s)`;
          break;
        case "settings":
          deletedCount = await deleteAllSettings();
          successMessage = `Deleted ${deletedCount} settings record(s)`;
          break;
        case "notifications":
          deletedCount = await deleteAllNotifications();
          successMessage = `Deleted ${deletedCount} notification(s)`;
          break;
        case "deleteAccount":
          await deleteUserAccount();
          successMessage = "Account deleted successfully. You will be redirected to the login page.";
          // After successful account deletion, redirect to login
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          break;
        default:
          throw new Error("Invalid action");
      }

      toast.success(successMessage);
      setAdminDialogOpen(false);
      setAdminPassword("");
      setSelectedAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete records");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setAdminDialogOpen(false);
    setAdminPassword("");
    setSelectedAction(null);
  };

  // Filter timezones based on search
  const filteredTimezones = commonTimezones.filter((tz) =>
    tz.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  // Get user initials for avatar
  const getUserInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      const email = user.email;
      const name = email.split("@")[0];
      return name.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <ERPLayout title="Settings" subtitle="Manage your account and preferences">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-erp-blue" />
        </div>
      </ERPLayout>
    );
  }

  return (
    <ERPLayout title="Settings" subtitle="Manage your account and preferences">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Shield className="h-4 w-4" />
            Admin Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="bg-erp-blue text-primary-foreground text-xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {firstName} {lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profile photo from your Google account
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="Enter business type"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="h-6 px-2 text-xs"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-1 h-3 w-3" />
                          Auto-detect
                        </>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address or use auto-detect"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="Enter currency"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="relative" ref={timezoneDropdownRef}>
                    <div className="flex items-center gap-2">
                      <Input
                        id="timezone"
                        value={timezone}
                        onChange={(e) => {
                          setTimezone(e.target.value);
                          setTimezoneSearch(e.target.value);
                          setShowTimezoneDropdown(true);
                        }}
                        onFocus={() => setShowTimezoneDropdown(true)}
                        placeholder="Select timezone"
                      />
                      <Clock className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {showTimezoneDropdown && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                        {filteredTimezones.length > 0 ? (
                          filteredTimezones.map((tz) => (
                            <button
                              key={tz}
                              type="button"
                              className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setTimezone(tz);
                                setShowTimezoneDropdown(false);
                              }}
                            >
                              {tz}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No timezones found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBusinessSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are running low
                    </p>
                  </div>
                  <Switch
                    checked={lowStockAlerts}
                    onCheckedChange={setLowStockAlerts}
                  />
                </div>
                {lowStockAlerts && (
                  <div className="space-y-3 pl-4">
                    <div>
                      <Label htmlFor="finishedProductThreshold">Finished Products Threshold</Label>
                      <Input
                        id="finishedProductThreshold"
                        type="number"
                        min="1"
                        value={finishedProductThreshold}
                        onChange={(e) => setFinishedProductThreshold(Number(e.target.value))}
                        placeholder="Enter threshold (e.g., 5)"
                        className="max-w-xs mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert when finished product stock falls below this number
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="bakingSupplyThreshold">Baking Supplies Threshold</Label>
                      <Input
                        id="bakingSupplyThreshold"
                        type="number"
                        min="1"
                        value={bakingSupplyThreshold}
                        onChange={(e) => setBakingSupplyThreshold(Number(e.target.value))}
                        placeholder="Enter threshold (e.g., 10)"
                        className="max-w-xs mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert when baking supply quantity falls below this number
                      </p>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Order Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get alerted for every new sale
                    </p>
                  </div>
                  <Switch
                    checked={newOrderNotifications}
                    onCheckedChange={setNewOrderNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Sales Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Receive daily sales reports via email
                    </p>
                  </div>
                  <Switch
                    checked={dailySalesSummary}
                    onCheckedChange={setDailySalesSummary}
                    disabled
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expense Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Reminders for recurring expenses
                    </p>
                  </div>
                  <Switch
                    checked={expenseReminders}
                    onCheckedChange={setExpenseReminders}
                    disabled
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationsSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                  disabled
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePasswordChange} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Warning: These actions are irreversible and will permanently delete data.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  You must provide your password to perform these actions.
                </p>
              </div>

              {/* Delete Account Button - Most dangerous action */}
              <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete My Account
                </h3>
                <p className="text-sm text-red-400 mt-2">
                  This will permanently delete your account, remove you from Firebase authentication, 
                  and delete ALL your data including sales, products, services, inventory, purchases, 
                  recipes, and more. This action CANNOT be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("deleteAccount")}
                  className="w-full justify-center gap-2 mt-4 bg-red-700 hover:bg-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete My Account
                </Button>
              </div>

              {/* Delete Everything Button - spans both columns with extra highlighting */}
              <div className="sm:col-span-2">
                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("all")}
                  className="w-full justify-center gap-2 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Everything
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This will delete ALL data in the system. Use with extreme caution.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("depletedBatches")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Depleted Batches
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("sales")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Sales
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("servicesOffered")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Services Offered
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("products")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Products
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("services")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Services
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("inventory")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Inventory Records
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("finishedProducts")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Finished Products
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("batches")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Batches
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("stockAdjustments")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Stock Adjustments
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("expenses")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Expenses
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("bakingSupplies")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Baking Supplies
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("bakingSupplyPurchases")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Baking Supply Purchases
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("categories")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Categories
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("recipes")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Recipes
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("recipeUsageLogs")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Recipe Usage Logs
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("settings")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Settings
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("notifications")}
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Notifications
                </Button>
              </div>

              {/* Password Confirmation Dialog */}
              <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      {selectedAction === "deleteAccount" ? "Confirm Account Deletion" : selectedAction === "all" ? "Confirm Delete All Data" : "Confirm Deletion"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedAction === "deleteAccount" 
                        ? "⚠️ WARNING: This will PERMANENTLY DELETE your entire account and ALL your data including sales, products, services, inventory, purchases, recipes, settings, and more. You will be removed from Bakerly App and will not be able to log in again. This action CANNOT be undone. Please enter your password to confirm you understand this is irreversible."
                        : selectedAction === "all" 
                        ? "This will permanently delete ALL data from the system including sales, products, services, inventory, purchases, batches, stock adjustments, expenses, services offered, baking supplies, baking supply purchases, categories, recipes, recipe usage logs, settings, and notifications. This action cannot be undone. Please enter your password to confirm."
                        : "This action cannot be undone. Please enter your password to confirm."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Password</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isDeleting}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleConfirmDelete();
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        You must provide your password to perform this action.
                      </p>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelete}
                      disabled={isDeleting || !adminPassword.trim()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Confirm Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ERPLayout>
  );
}
