export interface ServiceOffered {
  id?: string;
  date: Date;
  time: string; // Time of service in HH:MM format
  serviceName: string; // Service name selected from services database
  totalAmount: number;
  payment: "Cash" | "M-Pesa" | "Card" | "Bank Transfer";
  status: "completed" | "pending" | "cancelled";
  customer?: string; // Optional customer name
  createdAt: Date;
  updatedAt?: Date;
}
