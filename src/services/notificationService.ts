import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Get user notifications reference
function getUserNotificationsRef(userId: string) {
  return collection(db, NOTIFICATIONS_COLLECTION);
}

// Add a notification
export async function addNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Notification['data']
): Promise<string> {
  try {
    console.log('Creating notification:', { userId, type, title, message, data });
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type,
      title,
      message,
      read: false,
      data: data || {},
      createdAt: Timestamp.now(),
    });
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw new Error('Failed to add notification');
  }
}

// Get all notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      } as Notification;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in JavaScript
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

// Get unread notifications count for a user
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((docSnap) =>
      updateDoc(doc(db, NOTIFICATIONS_COLLECTION, docSnap.id), { read: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, docSnap.id))
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw new Error('Failed to delete all notifications');
  }
}

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    console.log('Notifications snapshot received:', snapshot.size, 'documents');
    const notifications = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      console.log('Notification document:', docSnap.id, data);
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      } as Notification;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in JavaScript
    console.log('Processed notifications:', notifications);
    callback(notifications);
  });
}

// Subscribe to unread notifications count
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
}

// Helper function to check if notification should be created based on settings
export async function shouldCreateNotification(
  userId: string,
  type: Notification['type']
): Promise<boolean> {
  try {
    const { getUserSettings } = await import('./settingsService');
    const settings = await getUserSettings(userId);

    switch (type) {
      case 'low_stock':
        return settings.notifications?.lowStockAlerts ?? true;
      case 'new_order':
        return settings.notifications?.newOrderNotifications ?? false;
      case 'daily_sales_summary':
        return settings.notifications?.dailySalesSummary ?? true;
      case 'expense_reminder':
        return settings.notifications?.expenseReminders ?? true;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to true if settings check fails
  }
}
