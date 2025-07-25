import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateEvent } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, TimeSlot } from "@shared/schema";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  timeSlots: z.array(z.object({
    id: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    capacity: z.number().min(1, "Capacity must be at least 1"),
  })).min(1, "At least one time slot is required"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EditEventDialogProps {
  children: React.ReactNode;
  event: Event & { timeSlots: TimeSlot[] };
}

export default function EditEventDialog({ children, event }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const updateEventMutation = useUpdateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
      location: event.location,
      timeSlots: event.timeSlots.map(slot => ({
        id: slot.id,
        startTime: new Date(slot.startTime).toTimeString().slice(0, 5),
        endTime: new Date(slot.endTime).toTimeString().slice(0, 5),
        capacity: slot.capacity,
      })),
    },
  });

  const timeSlots = form.watch("timeSlots");

  // Reset form when event changes
  useEffect(() => {
    form.reset({
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
      location: event.location,
      timeSlots: event.timeSlots.map(slot => ({
        id: slot.id,
        startTime: new Date(slot.startTime).toTimeString().slice(0, 5),
        endTime: new Date(slot.endTime).toTimeString().slice(0, 5),
        capacity: slot.capacity,
      })),
    });
  }, [event, form]);

  const addTimeSlot = () => {
    const currentSlots = form.getValues("timeSlots");
    form.setValue("timeSlots", [...currentSlots, { startTime: "", endTime: "", capacity: 10 }]);
  };

  const removeTimeSlot = (index: number) => {
    const currentSlots = form.getValues("timeSlots");
    if (currentSlots.length > 1) {
      form.setValue("timeSlots", currentSlots.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data: EventFormData) => {
    // Parse date as local date without timezone conversion
    const [year, month, day] = data.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const formattedTimeSlots = data.timeSlots.map(slot => {
      const [startHour, startMinute] = slot.startTime.split(':');
      const [endHour, endMinute] = slot.endTime.split(':');
      
      // Create datetime objects using the same date
      const startTime = new Date(year, month - 1, day, parseInt(startHour), parseInt(startMinute));
      const endTime = new Date(year, month - 1, day, parseInt(endHour), parseInt(endMinute));
      
      return {
        id: slot.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: slot.capacity,
      };
    });

    updateEventMutation.mutate({
      id: event.id,
      eventData: {
        title: data.title,
        description: data.description || "",
        date: eventDate.toISOString(),
        location: data.location,
        timeSlots: formattedTimeSlots,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update all details for this event including location and time slots.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Loads of Love - Community Laundry"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...form.register("location")}
              placeholder="123 Main St, City, State"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="date">Event Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Optional event description..."
              rows={3}
            />
          </div>

          {/* Time Slots Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Time Slots *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeSlot}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Time Slot
              </Button>
            </div>
            
            {timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded-lg">
                <div>
                  <Label htmlFor={`timeSlots.${index}.startTime`} className="text-sm">Start Time</Label>
                  <Input
                    id={`timeSlots.${index}.startTime`}
                    type="time"
                    {...form.register(`timeSlots.${index}.startTime`)}
                  />
                  {form.formState.errors.timeSlots?.[index]?.startTime && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.timeSlots[index]?.startTime?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`timeSlots.${index}.endTime`} className="text-sm">End Time</Label>
                  <Input
                    id={`timeSlots.${index}.endTime`}
                    type="time"
                    {...form.register(`timeSlots.${index}.endTime`)}
                  />
                  {form.formState.errors.timeSlots?.[index]?.endTime && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.timeSlots[index]?.endTime?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`timeSlots.${index}.capacity`} className="text-sm">Capacity</Label>
                  <Input
                    id={`timeSlots.${index}.capacity`}
                    type="number"
                    min="1"
                    {...form.register(`timeSlots.${index}.capacity`, { 
                      valueAsNumber: true 
                    })}
                  />
                  {form.formState.errors.timeSlots?.[index]?.capacity && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.timeSlots[index]?.capacity?.message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                    disabled={timeSlots.length === 1}
                    className={cn(
                      "w-full",
                      timeSlots.length === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {form.formState.errors.timeSlots && (
              <p className="text-sm text-red-600">
                {form.formState.errors.timeSlots.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}