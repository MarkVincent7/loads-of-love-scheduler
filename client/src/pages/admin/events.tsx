import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import CreateEventDialog from "@/components/create-event-dialog";
import EditEventDialog from "@/components/edit-event-dialog";
import ViewEventDialog from "@/components/view-event-dialog";
import CloneEventDialog from "@/components/clone-event-dialog";
import DeleteEventDialog from "@/components/delete-event-dialog";
import { useAuthStore } from "@/lib/auth";
import { useAllEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, endOfDay } from "date-fns";

export default function AdminEvents() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { data: events, isLoading } = useAllEvents();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, setLocation]);

  // Separate events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [] };
    
    const now = new Date();
    const upcoming = events.filter(event => {
      // Check if the latest time slot has passed
      const latestSlot = event.timeSlots.reduce((latest, slot) => {
        const slotEnd = new Date(slot.endTime);
        return slotEnd > latest ? slotEnd : latest;
      }, new Date(0));
      
      return latestSlot > now;
    });
    
    const past = events.filter(event => {
      const latestSlot = event.timeSlots.reduce((latest, slot) => {
        const slotEnd = new Date(slot.endTime);
        return slotEnd > latest ? slotEnd : latest;
      }, new Date(0));
      
      return latestSlot <= now;
    });
    
    return { upcomingEvents: upcoming, pastEvents: past.reverse() }; // Most recent past events first
  }, [events]);

  if (!isAuthenticated()) {
    return null;
  }

  const renderEventList = (eventsList: typeof events, emptyMessage: string) => {
    if (!eventsList || eventsList.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {eventsList.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{event.title}</CardTitle>
                <Badge variant="outline">
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </Badge>
              </div>
              <p className="text-gray-600">{event.location}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {event.timeSlots.length} time slot{event.timeSlots.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center space-x-2">
                  <EditEventDialog event={event}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </EditEventDialog>
                  <ViewEventDialog event={event}>
                    <Button variant="outline" size="sm">View</Button>
                  </ViewEventDialog>
                  <CloneEventDialog event={event}>
                    <Button variant="outline" size="sm">Duplicate</Button>
                  </CloneEventDialog>
                  <DeleteEventDialog event={event}>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </DeleteEventDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage your events and time slots</p>
          </div>
          <CreateEventDialog>
            <Button>Create New Event</Button>
          </CreateEventDialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="upcoming" data-testid="tab-upcoming-events">
                Upcoming Events ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" data-testid="tab-past-events">
                Past Events ({pastEvents.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-6" data-testid="content-upcoming-events">
              {renderEventList(upcomingEvents, "No upcoming events. Create your first event to get started!")}
            </TabsContent>
            
            <TabsContent value="past" className="mt-6" data-testid="content-past-events">
              {renderEventList(pastEvents, "No past events yet.")}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
