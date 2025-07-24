import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import EditRegistrationDialog from "@/components/edit-registration-dialog";
import CancelRegistrationDialog from "@/components/cancel-registration-dialog";
import { useAuthStore } from "@/lib/auth";
import { useEvents } from "@/hooks/use-events";
import { useRegistrations } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Search, Calendar, Clock, User, Phone, Mail } from "lucide-react";
import type { Registration } from "@shared/schema";

export default function AdminRegistrations() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: registrations = [], isLoading: registrationsLoading } = useRegistrations(selectedEventId);
  
  // Type assertion for registrations since the hook returns unknown
  const typedRegistrations = registrations as Registration[];

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  // Filter registrations based on search and status
  const filteredRegistrations = typedRegistrations.filter((registration: Registration) => {
    const matchesSearch = !searchTerm || 
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Management</h1>
          <p className="text-gray-600">View, edit, and cancel event registrations</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Selection */}
              <div>
                <Label htmlFor="event-select">Select Event</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger id="event-select">
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {format(new Date(event.date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div>
                <Label htmlFor="search">Search Registrations</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="waitlist">Waitlisted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        {!selectedEventId ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Select an event to view registrations</p>
              <p className="text-sm text-gray-400">Choose an event from the dropdown above</p>
            </CardContent>
          </Card>
        ) : registrationsLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {typedRegistrations.length === 0 ? "No registrations found" : "No registrations match your filters"}
              </p>
              <p className="text-sm text-gray-400">
                {typedRegistrations.length === 0 
                  ? "Registrations will appear here once people sign up"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredRegistrations.length}
                  </p>
                  <p className="text-xs text-blue-700">Showing</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredRegistrations.filter((r: Registration) => r.status === 'confirmed').length}
                  </p>
                  <p className="text-xs text-green-700">Confirmed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredRegistrations.filter((r: Registration) => r.status === 'waitlist').length}
                  </p>
                  <p className="text-xs text-orange-700">Waitlisted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredRegistrations.filter((r: Registration) => r.status === 'cancelled').length}
                  </p>
                  <p className="text-xs text-red-700">Cancelled</p>
                </div>
              </div>
            </div>

            {/* Registration Cards */}
            <div className="grid gap-4">
              {filteredRegistrations.map((registration: Registration) => {
                const timeSlot = events
                  .find(e => e.id === selectedEventId)
                  ?.timeSlots.find(ts => ts.id === registration.timeSlotId);

                return (
                  <Card key={registration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h3 className="font-medium text-gray-900">{registration.name}</h3>
                                <Badge 
                                  variant={
                                    registration.status === 'confirmed' ? 'default' :
                                    registration.status === 'waitlist' ? 'secondary' : 'outline'
                                  }
                                  className={
                                    registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    registration.status === 'waitlist' ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <EditRegistrationDialog registration={registration}>
                                <Button variant="outline" size="sm">Edit</Button>
                              </EditRegistrationDialog>
                              {registration.status !== 'cancelled' && (
                                <CancelRegistrationDialog registration={registration}>
                                  <Button variant="destructive" size="sm">Cancel</Button>
                                </CancelRegistrationDialog>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{registration.email}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{registration.phone}</span>
                            </div>

                            {timeSlot && (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500">
                            Registered: {format(new Date(registration.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}