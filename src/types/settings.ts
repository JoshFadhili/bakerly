export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BusinessInfo {
  name: string;
  type: string;
  address: string;
  currency: string;
  timezone: string;
}

export interface NotificationPreferences {
  lowStockAlerts: boolean;
  lowStockThreshold: number; // Legacy - kept for backward compatibility
  finishedProductThreshold: number; // Threshold for finished products (inventory)
  bakingSupplyThreshold: number; // Threshold for baking supplies
  dailySalesSummary: boolean;
  newOrderNotifications: boolean;
  expenseReminders: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

export interface Settings {
  profile: UserProfile;
  business: BusinessInfo;
  notifications: NotificationPreferences;
  security: SecuritySettings;
}
