export type NotificationType = 'low_stock' | 'new_order' | 'daily_sales_summary' | 'expense_reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: {
    productName?: string;
    stockLevel?: number;
    threshold?: number;
    orderId?: string;
    amount?: number;
    [key: string]: any;
  };
}
