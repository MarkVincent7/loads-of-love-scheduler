import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EventWithSlots } from "@shared/schema";
import { VALID_ZIP_CODES } from "@shared/schema";

const addRegistrationSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  timeSlotId: z.string().min(1, "Time slot is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional().refine(
    (zip) => !zip || VALID_ZIP_CODES.includes(zip),
    { message: "Zip code out of service area" }
  ),
  status: z.enum(['auto', 'confirmed', 'waitlist']).optional(),
});

type AddRegistrationFormData = z.infer<typeof addRegistrationSchema>;

interface AddRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventWithSlots[];
}

export default function AddRegistrationDialog({ open, onOpenChange, events }: AddRegistrationDialogProps) {
  const { toast } = useToast();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => 
      event.timeSlots.some(slot => new Date(slot.endTime) >= now)
    );
  }, [events]);

  const form = useForm<AddRegistrationFormData>({
    resolver: zodResolver(addRegistrationSchema),
    defaultValues: {
      eventId: "",
      timeSlotId: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      status: "auto",
    },
  });

  const selectedEventId = form.watch("eventId");
  const selectedEvent = upcomingEvents.find(e => e.id === selectedEventId);

  const addMutation = useMutation({
    mutationFn: async (data: AddRegistrationFormData) => {
      // If status is 'auto', don't send it (let backend calculate)
      const payload = { ...data };
      if (payload.status === 'auto') {
        delete payload.status;
      }
      const response = await apiRequest('POST', '/api/admin/registrations', payload, true);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: "Registration added",
        description: "The registration has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddRegistrationFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Registration</DialogTitle>
          <DialogDescription>
            Create a new registration for an event time slot
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Event</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("timeSlotId", ""); // Reset time slot when event changes
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-event">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {upcomingEvents.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No upcoming events available
                          </div>
                        ) : (
                          upcomingEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} - {new Date(event.date).toLocaleDateString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlotId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Time Slot</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedEvent}>
                      <FormControl>
                        <SelectTrigger data-testid="select-timeslot">
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedEvent?.timeSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {' '}({slot.registrationCount || 0}/{slot.capacity} filled)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="auto">Auto (based on capacity)</SelectItem>
                        <SelectItem value="confirmed">Confirmed (force)</SelectItem>
                        <SelectItem value="waitlist">Waitlist (force)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose "Auto" to automatically assign status based on slot capacity, or manually set status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="555-123-4567" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Cincinnati" {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="OH" {...field} data-testid="input-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="45202" {...field} data-testid="input-zipcode" />
                    </FormControl>
                    <FormDescription>
                      Valid zip codes: {VALID_ZIP_CODES.join(", ")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addMutation.isPending}
                data-testid="button-submit"
              >
                {addMutation.isPending ? "Adding..." : "Add Registration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
