import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Clock, Calendar, MapPin, User, Mail, Phone, Home, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Event, TimeSlot } from "@shared/schema";

const VALID_ZIP_CODES = [
  "45252", "45247", "45053", "45052", 
  "45033", "45030", "45013", "45002", 
  "47060", "47025"
];

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().refine(
    (zip) => VALID_ZIP_CODES.includes(zip),
    { message: "Zip code out of service area" }
  ),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function Register() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [checkedItems, setCheckedItems] = useState({
    noShow: false,
    transportation: false,
    appointmentTime: false,
    location: false,
    stayWithClothes: false,
  });
  
  // Get time slot ID from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const timeSlotId = urlParams.get('timeSlot');
  const eventId = urlParams.get('event');

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "OH",
      zipCode: "",
    },
  });

  // Fetch events data
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!eventId && !!timeSlotId,
  });

  const event = Array.isArray(events) ? events.find((e: any) => e.id === eventId) : null;
  const timeSlot = event?.timeSlots?.find((ts: TimeSlot) => ts.id === timeSlotId);

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          eventId,
          timeSlotId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate events cache to update availability
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      // Redirect to celebration page with registration details
      const params = new URLSearchParams({
        eventTitle: event?.title || '',
        eventLocation: event?.location || '',
        startTime: timeSlot?.startTime || '',
        endTime: timeSlot?.endTime || '',
        email: form.getValues('email'),
        status: data.status || 'confirmed'
      });
      
      setLocation(`/registration-success?${params.toString()}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Please try again or contact support.",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation('/');
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email', 'phone'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['address', 'city', 'state', 'zipCode'];
    }
    
    // Trigger validation for current step fields
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const allChecklistCompleted = Object.values(checkedItems).every(Boolean);

  const handleCheckboxChange = (key: keyof typeof checkedItems) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (!event || !timeSlot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Time Slot Not Found</h2>
          <p className="text-gray-600 mb-6">The selected time slot is no longer available.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Time Slots
          </Button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <p className="text-sm text-gray-600">We'll use this to confirm your appointment</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" onClick={nextStep} className="flex-1">
                Continue to Address
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">Address Information</h2>
              <p className="text-sm text-gray-600">Service available in select zip codes only</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="text-sm font-medium">Street Address *</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
                {form.formState.errors.address && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="City"
                    className="mt-1"
                  />
                  {form.formState.errors.city && (
                    <p className="text-xs text-red-600 mt-1">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    placeholder="OH"
                    className="mt-1"
                  />
                  {form.formState.errors.state && (
                    <p className="text-xs text-red-600 mt-1">{form.formState.errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium">Zip Code *</Label>
                <Input
                  id="zipCode"
                  {...form.register("zipCode")}
                  placeholder="45030"
                  className="mt-1"
                />
                {form.formState.errors.zipCode && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.zipCode.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button type="button" onClick={nextStep} className="flex-1">
                Continue to Confirmation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold mb-2">Confirm Your Appointment</h2>
              <p className="text-sm text-gray-600 mb-4">Please review and confirm you understand:</p>
            </div>

            {/* Appointment Details */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-3 mb-4">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">{format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                <span>{format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <span>{event.location}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="no-show"
                  checked={checkedItems.noShow}
                  onCheckedChange={() => handleCheckboxChange('noShow')}
                />
                <Label htmlFor="no-show" className="text-sm leading-5">
                  I understand that if I don't show up without canceling within 24 hours, I may not be able to participate in future events.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="transportation"
                  checked={checkedItems.transportation}
                  onCheckedChange={() => handleCheckboxChange('transportation')}
                />
                <Label htmlFor="transportation" className="text-sm leading-5">
                  I have or will arrange transportation to get to my appointment.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="appointment-time"
                  checked={checkedItems.appointmentTime}
                  onCheckedChange={() => handleCheckboxChange('appointmentTime')}
                />
                <Label htmlFor="appointment-time" className="text-sm leading-5">
                  I confirm my appointment day and time: {format(new Date(timeSlot.startTime), 'EEEE, MMMM d')} at {format(new Date(timeSlot.startTime), 'h:mm a')}
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="location"
                  checked={checkedItems.location}
                  onCheckedChange={() => handleCheckboxChange('location')}
                />
                <Label htmlFor="location" className="text-sm leading-5">
                  I know the location: {event.location}
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="stay-with-clothes"
                  checked={checkedItems.stayWithClothes}
                  onCheckedChange={() => handleCheckboxChange('stayWithClothes')}
                />
                <Label htmlFor="stay-with-clothes" className="text-sm leading-5">
                  <strong>I understand that I must stay with my clothes during the entire washing and drying process.</strong>
                </Label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={registerMutation.isPending || !allChecklistCompleted}
                onClick={form.handleSubmit(onSubmit)}
              >
                {registerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-sm mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-0 h-auto mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">
              {currentStep === 1 ? "Contact Information" : 
               currentStep === 2 ? "Address Information" : "Confirm Appointment"}
            </h1>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step ? "bg-primary" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <Card className="mb-4">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Step {currentStep} of 3 • You'll receive email confirmation
          </p>
        </div>
      </div>
    </div>
  );
}