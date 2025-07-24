import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCloneEvent } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { Event, TimeSlot } from "@shared/schema";

const cloneSchema = z.object({
  date: z.string().min(1, "Date is required"),
});

type CloneFormData = z.infer<typeof cloneSchema>;

interface CloneEventDialogProps {
  children: React.ReactNode;
  event: Event & { timeSlots: TimeSlot[] };
}

export default function CloneEventDialog({ children, event }: CloneEventDialogProps) {
  const [open, setOpen] = useState(false);
  const cloneEventMutation = useCloneEvent();

  const form = useForm<CloneFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      date: "",
    },
  });

  const onSubmit = (data: CloneFormData) => {
    cloneEventMutation.mutate({
      eventId: event.id,
      newDate: data.date,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Event</DialogTitle>
          <DialogDescription>
            Create a copy of this event with the same time slots on a different date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Original Event Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Cloning Event:</h4>
            <p className="text-sm text-gray-600">{event.title}</p>
            <p className="text-xs text-gray-500">
              Original Date: {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-500">
              {event.timeSlots.length} time slot{event.timeSlots.length !== 1 ? 's' : ''} will be copied
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="date">New Event Date *</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={cloneEventMutation.isPending}>
                {cloneEventMutation.isPending ? "Cloning..." : "Clone Event"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}