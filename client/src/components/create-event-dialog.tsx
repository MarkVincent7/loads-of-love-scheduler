import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEvent } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  timeSlots: z.array(z.object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    capacity: z.number().min(1, "Capacity must be at least 1"),
  })).min(1, "At least one time slot is required"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  children: React.ReactNode;
}

export default function CreateEventDialog({ children }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const createEventMutation = useCreateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      location: "",
      timeSlots: [
        { startTime: "", endTime: "", capacity: 10 }
      ],
    },
  });

  const timeSlots = form.watch("timeSlots");

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
    // Convert date and times to proper DateTime objects - ensure we use the event date correctly
    const eventDate = new Date(data.date + 'T00:00:00'); // Parse as local date
    
    const formattedTimeSlots = data.timeSlots.map(slot => {
      const [startHour, startMinute] = slot.startTime.split(':');
      const [endHour, endMinute] = slot.endTime.split(':');
      
      // Create new Date objects for the specific event date
      const startTime = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const endTime = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      return {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: slot.capacity,
      };
    });

    createEventMutation.mutate({
      title: data.title,
      description: data.description || "",
      date: eventDate.toISOString().split('T')[0] + 'T00:00:00.000Z', // Ensure proper date format
      location: data.location,
      timeSlots: formattedTimeSlots,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
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
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a new laundry event with time slots for community members to register.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Time Slots *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
            
            <div className="space-y-4">
              {timeSlots.map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Time Slot {index + 1}</h4>
                    {timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`startTime-${index}`}>Start Time</Label>
                      <Input
                        id={`startTime-${index}`}
                        type="time"
                        {...form.register(`timeSlots.${index}.startTime`)}
                      />
                      {form.formState.errors.timeSlots?.[index]?.startTime && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.timeSlots[index]?.startTime?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor={`endTime-${index}`}>End Time</Label>
                      <Input
                        id={`endTime-${index}`}
                        type="time"
                        {...form.register(`timeSlots.${index}.endTime`)}
                      />
                      {form.formState.errors.timeSlots?.[index]?.endTime && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.timeSlots[index]?.endTime?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor={`capacity-${index}`}>Capacity</Label>
                      <Input
                        id={`capacity-${index}`}
                        type="number"
                        min="1"
                        {...form.register(`timeSlots.${index}.capacity`, { valueAsNumber: true })}
                      />
                      {form.formState.errors.timeSlots?.[index]?.capacity && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.timeSlots[index]?.capacity?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}