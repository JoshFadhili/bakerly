import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type {
  UserProfile,
  BusinessInfo,
  NotificationPreferences,
  SecuritySettings,
  Settings,
} from '@/types/settings';

const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';

// Get user settings document reference
function getUserSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

// Get user document reference
function getUserDocRef(userId: string) {
  return doc(db, USERS_COLLECTION, userId);
}

// Get default settings
function getDefaultSettings(userId: string) {
  return {
    userId,
    profile: {
      firstName: '',
      lastName: '',
      email: auth.currentUser?.email || '',
      phone: '',
    },
    business: {
      name: "Your Business",
      type: '',
      address: '',
      currency: 'KSh (Kenyan Shilling)',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    notifications: {
      lowStockAlerts: true,
      lowStockThreshold: 5, // Legacy - kept for backward compatibility
      finishedProductThreshold: 5, // Threshold for finished products (inventory)
      bakingSupplyThreshold: 10, // Threshold for baking supplies (usually need more buffer)
      dailySalesSummary: true,
      newOrderNotifications: false,
      expenseReminders: true,
    },
    security: {
      twoFactorEnabled: false,
    },
  };
}

// Get all settings for a user
export async function getUserSettings(userId: string) {
  try {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return settingsDoc.data() as Settings;
    }

    // Create default settings if they don't exist
    const defaultSettings = getDefaultSettings(userId);
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings as Settings;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw new Error('Failed to fetch user settings');
  }
}

// Update profile settings
export async function updateProfileSettings(
  userId: string,
  profile: Partial<UserProfile>
) {
  try {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        profile: { ...settingsDoc.data().profile, ...profile },
      });
    } else {
      const defaultSettings = getDefaultSettings(userId);
      await setDoc(settingsRef, {
        ...defaultSettings,
        profile: { ...defaultSettings.profile, ...profile },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating profile settings:', error);
    throw new Error('Failed to update profile settings');
  }
}

// Update business information
export async function updateBusinessInfo(
  userId: string,
  business: Partial<BusinessInfo>
) {
  try {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        business: { ...settingsDoc.data().business, ...business },
      });
    } else {
      const defaultSettings = getDefaultSettings(userId);
      await setDoc(settingsRef, {
        ...defaultSettings,
        business: { ...defaultSettings.business, ...business },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating business info:', error);
    throw new Error('Failed to update business information');
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  notifications: Partial<NotificationPreferences>
) {
  try {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        notifications: { ...settingsDoc.data().notifications, ...notifications },
      });
    } else {
      const defaultSettings = getDefaultSettings(userId);
      await setDoc(settingsRef, {
        ...defaultSettings,
        notifications: { ...defaultSettings.notifications, ...notifications },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw new Error('Failed to update notification preferences');
  }
}

// Update security settings
export async function updateSecuritySettings(
  userId: string,
  security: Partial<SecuritySettings>
) {
  try {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        security: { ...settingsDoc.data().security, ...security },
      });
    } else {
      const defaultSettings = getDefaultSettings(userId);
      await setDoc(settingsRef, {
        ...defaultSettings,
        security: { ...defaultSettings.security, ...security },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw new Error('Failed to update security settings');
  }
}

// Get business name for display
export async function getBusinessName(userId: string): Promise<string> {
  try {
    const settings = await getUserSettings(userId);
    return settings.business?.name || 'Your Business';
  } catch (error) {
    console.error('Error fetching business name:', error);
    return 'Your Business';
  }
}

// Detect user timezone
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Detect user location (requires user permission)
export async function detectLocation(): Promise<{
  address: string;
  timezone: string;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding API (using OpenStreetMap Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const address = data.display_name || '';
          const timezone = detectTimezone();
          
          resolve({ address, timezone });
        } catch (error) {
          console.error('Error getting address from coordinates:', error);
          resolve({ address: '', timezone: detectTimezone() });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Return default timezone if geolocation fails
        resolve({ address: '', timezone: detectTimezone() });
      },
      { timeout: 10000 }
    );
  });
}

// Common timezones for dropdown
export const commonTimezones = [
  'Africa/Nairobi',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];
