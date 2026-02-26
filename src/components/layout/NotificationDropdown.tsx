import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, X, Check, Package, ShoppingCart, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'low_stock':
      return <AlertTriangle className="h-4 w-4 text-erp-red" />;
    case 'low_stock_baking_supply':
      return <AlertTriangle className="h-4 w-4 text-erp-orange" />;
    case 'new_order':
      return <ShoppingCart className="h-4 w-4 text-erp-blue" />;
    case 'daily_sales_summary':
      return <TrendingUp className="h-4 w-4 text-erp-green" />;
    case 'expense_reminder':
      return <Package className="h-4 w-4 text-erp-orange" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationTypeLabel = (type: Notification['type']) => {
  switch (type) {
    case 'low_stock':
      return 'Low Stock (Product)';
    case 'low_stock_baking_supply':
      return 'Low Stock (Supply)';
    case 'new_order':
      return 'New Order';
    case 'daily_sales_summary':
      return 'Sales Summary';
    case 'expense_reminder':
      return 'Expense Reminder';
    default:
      return 'Notification';
  }
};

export function NotificationDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotificationItem, deleteAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log('NotificationDropdown - notifications:', notifications, 'unreadCount:', unreadCount);

  const handleNotificationClick = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotificationItem(notificationId);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllConfirm = async () => {
    try {
      await deleteAllNotifications();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-erp-red text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground mt-3">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => handleNotificationClick(e, notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="h-1.5 w-1.5 p-0 rounded-full bg-erp-red" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-auto">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 -mr-1 -mt-1"
                        onClick={(e) => handleDelete(e, notification.id)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllClick}
              className="w-full text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}
