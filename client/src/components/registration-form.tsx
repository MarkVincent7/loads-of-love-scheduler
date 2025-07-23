import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type TimeSlot } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  notifications: z.boolean().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  timeSlot: TimeSlot;
  onSuccess: () => void;
}

export default function RegistrationForm({ timeSlot, onSuccess }: RegistrationFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      notifications: true,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await apiRequest("POST", "/api/register", {
        ...data,
        eventId: timeSlot.eventId,
        timeSlotId: timeSlot.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowSuccess(true);
      toast({
        title: "Registration Successful!",
        description: data.message,
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  if (showSuccess) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Registration Confirmed!</h3>
          <p className="text-gray-600 mb-6">
            Your spot has been reserved. Check your email for confirmation details and cancellation link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Complete Your Reservation
      </h3>
      
      {/* Selected Time Slot Summary */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-sm font-medium text-primary-600 mb-1">Selected Time Slot</div>
          <div className="text-lg font-semibold text-primary-900">
            {format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="text-primary-700">
            {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter your full name"
              className={cn(
                form.formState.errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="your.email@example.com"
              className={cn(
                form.formState.errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            placeholder="(555) 123-4567"
            className={cn(
              form.formState.errors.phone && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
          )}
        </div>
        
        {/* Terms and Notifications */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifications"
              {...form.register("notifications")}
              defaultChecked
            />
            <Label htmlFor="notifications" className="text-sm text-gray-700">
              Send me SMS and email reminders about my reservation
            </Label>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full py-4 text-lg font-semibold"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Reserving..." : "Reserve My Spot"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By registering, you agree to receive confirmations and reminders. 
          You can cancel anytime using the link in your confirmation email.
        </p>
      </form>
    </div>
  );
}
