import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserSettings,
  updateProfileSettings,
  updateBusinessInfo,
  updateNotificationPreferences,
  updateSecuritySettings,
  detectLocation,
  getBusinessName,
} from '@/services/settingsService';
import type { Settings, UserProfile, BusinessInfo, NotificationPreferences, SecuritySettings } from '@/types/settings';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  businessName: string;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateBusiness: (business: Partial<BusinessInfo>) => Promise<void>;
  updateNotifications: (notifications: Partial<NotificationPreferences>) => Promise<void>;
  updateSecurity: (security: Partial<SecuritySettings>) => Promise<void>;
  detectUserLocation: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('Your Business');

  // Fetch settings when user changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setSettings(null);
        setLoading(false);
        setBusinessName('Your Business');
        return;
      }

      try {
        setLoading(true);
        const userSettings = await getUserSettings(user.uid);
        setSettings(userSettings);
        
        // Update business name
        const name = await getBusinessName(user.uid);
        setBusinessName(name);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateProfileSettings(user.uid, profile);
      await refreshSettings();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateBusiness = async (business: Partial<BusinessInfo>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateBusinessInfo(user.uid, business);
      await refreshSettings();
      
      // Update business name if name was changed
      if (business.name) {
        setBusinessName(business.name);
      }
    } catch (error) {
      console.error('Error updating business info:', error);
      throw error;
    }
  };

  const updateNotifications = async (notifications: Partial<NotificationPreferences>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateNotificationPreferences(user.uid, notifications);
      await refreshSettings();
    } catch (error) {
      console.error('Error updating notifications:', error);
      throw error;
    }
  };

  const updateSecurity = async (security: Partial<SecuritySettings>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateSecuritySettings(user.uid, security);
      await refreshSettings();
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  };

  const detectUserLocation = async () => {
    try {
      const { address, timezone } = await detectLocation();
      if (address || timezone) {
        await updateBusinessInfo(user!.uid, { address, timezone });
        await refreshSettings();
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        businessName,
        updateProfile,
        updateBusiness,
        updateNotifications,
        updateSecurity,
        detectUserLocation,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
