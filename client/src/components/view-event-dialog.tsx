import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import type { Event, TimeSlot } from "@shared/schema";

interface ViewEventDialogProps {
  children: React.ReactNode;
  event: Event & { timeSlots: (TimeSlot & { registrationCount: number; waitlistCount: number })[] };
}

export default function ViewEventDialog({ children, event }: ViewEventDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            View event details and time slot information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{event.location}</span>
            </div>
          </div>

          {event.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          )}

          {/* Time Slots */}
          <div>
            <h4 className="font-medium mb-3">Time Slots ({event.timeSlots.length})</h4>
            <div className="space-y-3">
              {event.timeSlots.map((slot) => (
                <Card key={slot.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Capacity: {slot.capacity}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {slot.registrationCount || 0} registered
                        </Badge>
                        {(slot.waitlistCount || 0) > 0 && (
                          <Badge variant="outline">
                            {slot.waitlistCount} waitlisted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Event Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Event Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {event.timeSlots.reduce((sum, slot) => sum + (slot.registrationCount || 0), 0)}
                </p>
                <p className="text-xs text-gray-600">Total Registrations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {event.timeSlots.reduce((sum, slot) => sum + (slot.waitlistCount || 0), 0)}
                </p>
                <p className="text-xs text-gray-600">Total Waitlisted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {event.timeSlots.reduce((sum, slot) => sum + slot.capacity, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Capacity</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}