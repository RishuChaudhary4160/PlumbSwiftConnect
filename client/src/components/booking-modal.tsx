import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Droplets, Wrench, ClipboardCheck, AlertTriangle, Calendar, Clock, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";

const bookingSchema = z.object({
  category: z.string().min(1, "Please select a service category"),
  description: z.string().min(10, "Please provide at least 10 characters describing the issue"),
  address: z.string().min(5, "Please provide a complete address"),
  phone: z.string().min(10, "Please provide a valid phone number"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categoryIcons = {
  "Leak Repair": Droplets,
  "Installation": Wrench,
  "Maintenance": ClipboardCheck,
  "Emergency": AlertTriangle,
};

const timeSlots = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
];

export default function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      category: "",
      description: "",
      address: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/categories');
      return response.json() as Promise<Category[]>;
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingForm) => {
      const bookingData = {
        ...data,
        preferredDate: data.preferredDate && data.preferredTime 
          ? new Date(`${data.preferredDate}T${data.preferredTime === '8:00 AM - 10:00 AM' ? '08:00' : 
                      data.preferredTime === '10:00 AM - 12:00 PM' ? '10:00' :
                      data.preferredTime === '12:00 PM - 2:00 PM' ? '12:00' :
                      data.preferredTime === '2:00 PM - 4:00 PM' ? '14:00' :
                      data.preferredTime === '4:00 PM - 6:00 PM' ? '16:00' : '18:00'}:00`).toISOString()
          : undefined,
      };
      const response = await authenticatedApiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      form.reset();
      setSelectedCategory("");
      onSuccess();
      toast({
        title: "Booking Created Successfully!",
        description: data.assignedPlumber 
          ? "A plumber has been assigned and will contact you shortly."
          : "Your request has been submitted. We'll assign a plumber as soon as possible.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    form.setValue("category", categoryName);
  };

  const onSubmit = (data: BookingForm) => {
    createBookingMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createBookingMutation.isPending) {
      form.reset();
      setSelectedCategory("");
      onClose();
    }
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Book a Plumber</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              disabled={createBookingMutation.isPending}
              data-testid="button-close-booking-modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Category *</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.length > 0 ? categories.map((category) => {
                        const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Wrench;
                        return (
                          <Button
                            key={category.id}
                            type="button"
                            variant={selectedCategory === category.name ? "default" : "outline"}
                            className="p-4 h-auto flex flex-col space-y-2 text-left"
                            onClick={() => handleCategorySelect(category.name)}
                            data-testid={`button-category-${category.name.toLowerCase().replace(' ', '-')}`}
                          >
                            <IconComponent className="w-6 h-6" />
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs opacity-80">{category.description}</div>
                            )}
                          </Button>
                        );
                      }) : (
                        // Fallback categories if API fails
                        ["Leak Repair", "Installation", "Maintenance", "Emergency"].map((categoryName) => {
                          const IconComponent = categoryIcons[categoryName as keyof typeof categoryIcons];
                          return (
                            <Button
                              key={categoryName}
                              type="button"
                              variant={selectedCategory === categoryName ? "default" : "outline"}
                              className="p-4 h-auto flex flex-col space-y-2 text-left"
                              onClick={() => handleCategorySelect(categoryName)}
                              data-testid={`button-category-${categoryName.toLowerCase().replace(' ', '-')}`}
                            >
                              <IconComponent className="w-6 h-6" />
                              <div className="font-medium">{categoryName}</div>
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Address *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="123 Main St, Apt 4B, City, State"
                        className="pl-10"
                        data-testid="input-address"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-phone"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Date and Time */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          min={today}
                          className="pl-10"
                          data-testid="input-preferred-date"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-preferred-time">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select time slot" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Problem Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe the plumbing issue in detail. Include any symptoms, duration, and location of the problem..."
                      rows={4}
                      data-testid="textarea-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Information Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A certified plumber will be automatically assigned based on availability and location. 
                You will receive SMS/email notification once assigned.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={createBookingMutation.isPending}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createBookingMutation.isPending}
                data-testid="button-submit-booking"
              >
                {createBookingMutation.isPending ? "Creating Booking..." : "Book Now"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
