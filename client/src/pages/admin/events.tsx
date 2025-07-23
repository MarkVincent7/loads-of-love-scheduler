import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import CreateEventDialog from "@/components/create-event-dialog";
import { useAuthStore } from "@/lib/auth";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminEvents() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { data: events, isLoading } = useEvents();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated()) {
    return null;
  }

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
        ) : events && events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((event) => (
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
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Clone</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No events found</p>
              <CreateEventDialog>
                <Button>Create Your First Event</Button>
              </CreateEventDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
