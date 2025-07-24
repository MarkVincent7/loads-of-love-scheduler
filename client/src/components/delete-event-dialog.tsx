import { useState } from "react";
import { useDeleteEvent } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Event, TimeSlot } from "@shared/schema";

interface DeleteEventDialogProps {
  children: React.ReactNode;
  event: Event & { timeSlots: (TimeSlot & { registrationCount: number })[] };
}

export default function DeleteEventDialog({ children, event }: DeleteEventDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteEventMutation = useDeleteEvent();

  const totalRegistrations = event.timeSlots.reduce((sum, slot) => sum + (slot.registrationCount || 0), 0);

  const handleDelete = () => {
    deleteEventMutation.mutate(event.id, {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Delete Event</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the event and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Event Info */}
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <h4 className="font-medium text-red-900 mb-1">{event.title}</h4>
            <p className="text-sm text-red-700 mb-2">{event.location}</p>
            <div className="text-xs text-red-600 space-y-1">
              <p>• {event.timeSlots.length} time slot{event.timeSlots.length !== 1 ? 's' : ''} will be deleted</p>
              {totalRegistrations > 0 && (
                <p>• {totalRegistrations} registration{totalRegistrations !== 1 ? 's' : ''} will be cancelled</p>
              )}
            </div>
          </div>

          {totalRegistrations > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This event has active registrations. 
                Users will not be automatically notified of the cancellation.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}