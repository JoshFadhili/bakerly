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
  lowStockThreshold: number;
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
