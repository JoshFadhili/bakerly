import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServices } from "@/services/serviceService";
import { Service } from "@/types/service";
import { updateServiceOffered } from "@/services/serviceOfferedService";
import { ServiceOffered } from "@/types/serviceOffered";
import { Search, Calendar, Clock } from "lucide-react";

interface EditServiceOfferedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceOfferedUpdated: () => void;
  serviceOffered: ServiceOffered | null;
}

export default function EditServiceOfferedDialog({
  isOpen,
  onClose,
  onServiceOfferedUpdated,
  serviceOffered,
}: EditServiceOfferedDialogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    serviceName: "",
    totalAmount: "",
    payment: "Cash" as "Cash" | "M-Pesa" | "Card" | "Bank Transfer",
    status: "completed" as "completed" | "pending" | "cancelled",
    customer: "",
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesList = await getServices();
        setServices(servicesList);
        setFilteredServices(servicesList);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  // Initialize form with service offered data when serviceOffered changes
  useEffect(() => {
    if (serviceOffered) {
      const dateStr = serviceOffered.date instanceof Date 
        ? serviceOffered.date.toISOString().split('T')[0]
        : new Date(serviceOffered.date).toISOString().split('T')[0];
      
      setFormData({
        date: dateStr,
        time: serviceOffered.time,
        serviceName: serviceOffered.serviceName,
        totalAmount: serviceOffered.totalAmount.toString(),
        payment: serviceOffered.payment,
        status: serviceOffered.status,
        customer: serviceOffered.customer || "",
      });
      setSearchQuery(serviceOffered.serviceName);
      
      // Find the service
      const service = services.find(s => s.name === serviceOffered.serviceName);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [serviceOffered, services]);

  // Filter services based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter((service) =>
        service.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  // Auto-calculate total amount when service changes
  useEffect(() => {
    if (selectedService) {
      const calculatedAmount = selectedService.price ?? 0;
      setFormData((prev) => ({
        ...prev,
        totalAmount: calculatedAmount.toString(),
      }));
    }
  }, [selectedService]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData((prev) => ({
      ...prev,
      serviceName: service.name ?? "",
    }));
    setSearchQuery(service.name ?? "");
    setShowDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!serviceOffered || !serviceOffered.id) {
        throw new Error("Service Offered ID is required");
      }

      // Update the service offered
      const serviceData: any = {
        date: new Date(formData.date),
        time: formData.time,
        serviceName: formData.serviceName,
        totalAmount: Number(formData.totalAmount),
        payment: formData.payment,
        status: formData.status,
      };

      // Only include customer field if it's not empty
      if (formData.customer && formData.customer.trim() !== "") {
        serviceData.customer = formData.customer;
      }

      await updateServiceOffered(serviceOffered.id, serviceData);

      onClose();
      onServiceOfferedUpdated();
    } catch (error) {
      console.error("Error updating service offered:", error);
      alert("Failed to update service offered. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Offered</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Service Name with Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="serviceName">Service Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="serviceName"
                name="serviceName"
                type="text"
                placeholder="Search service..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
                required
              />
            </div>

            {/* Service Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="border rounded-md max-h-48 overflow-y-auto bg-background z-[100] shadow-lg absolute w-full"
              >
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.category} • KSh {(service.price ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No services found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (KSh)</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount}
              onChange={handleInputChange}
              required
            />
            {selectedService && (
              <p className="text-xs text-muted-foreground">
                Service Price: KSh {(selectedService.price ?? 0).toLocaleString()}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select
              value={formData.payment}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, payment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer (Optional)</Label>
            <Input
              id="customer"
              name="customer"
              type="text"
              placeholder="Enter customer name"
              value={formData.customer}
              onChange={handleInputChange}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Service Offered"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
