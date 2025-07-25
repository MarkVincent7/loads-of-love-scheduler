import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Mail, User, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Event, TimeSlot } from "@shared/schema";

const waitlistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  event: Event;
  timeSlot: TimeSlot;
  open: boolean;
  onClose: () => void;
}

export default function WaitlistForm({ event, timeSlot, open, onClose }: WaitlistFormProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: async (data: WaitlistFormData) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          eventId: event.id,
          timeSlotId: timeSlot.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join waitlist');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsSubmitted(true);
      toast({
        title: "Added to Waitlist!",
        description: "We'll notify you if a spot opens up for this time slot.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    waitlistMutation.mutate(data);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    form.reset();
    onClose();
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <DialogTitle>You're on the Waitlist!</DialogTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>What happens next?</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                If someone cancels their registration, we'll send you an email with a link to sign up for this time slot. 
                You'll need to act quickly since other people on the waitlist will get the same notification!
              </p>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Join Waitlist</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            This time slot is currently full. Join the waitlist and we'll notify you if a spot opens up.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {event.title}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                {format(new Date(timeSlot.startTime), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Enter your email address"
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> We'll email you if a spot opens up with a link to complete your registration. 
                  No phone number or address needed now - you'll provide those details if you get a spot.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={waitlistMutation.isPending}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  {waitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}