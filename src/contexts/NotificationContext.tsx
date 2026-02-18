import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '@/types/notification';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications as deleteAllNotificationsService,
  subscribeToNotifications,
  subscribeToUnreadCount,
} from '@/services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationItem: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Subscribe to notifications when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to notifications
    const unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
      console.log('NotificationContext - received notifications:', notificationsData);
      setNotifications(notificationsData);
      setLoading(false);
    });

    // Subscribe to unread count
    const unsubscribeUnreadCount = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      // The real-time subscription will update the state
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      // The real-time subscription will update the state
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotificationItem = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      // The real-time subscription will update the state
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;

    try {
      await deleteAllNotificationsService(user.uid);
      // The real-time subscription will update the state
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;

    try {
      const notificationsData = await getUserNotifications(user.uid);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotificationItem,
        deleteAllNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
