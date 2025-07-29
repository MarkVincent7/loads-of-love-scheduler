import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import EditRegistrationDialog from "@/components/edit-registration-dialog";
import CancelRegistrationDialog from "@/components/cancel-registration-dialog";
import DeleteRegistrationDialog from "@/components/delete-registration-dialog";
import { useAuthStore } from "@/lib/auth";
import { useEvents } from "@/hooks/use-events";
import { useRegistrations, useMarkAsNoShow, useUpdateRegistration } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Search, Calendar, Clock, User, Phone, Mail, Trash2, UserX, ChevronDown, ChevronRight, Check, Printer } from "lucide-react";
import type { Registration } from "@shared/schema";

interface EventRegistrationsTableProps {
  eventId: string;
  searchTerm: string;
  statusFilter: string;
  onMarkAsNoShow: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  setSelectedRegistration: (registration: Registration | null) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

function EventRegistrationsTable({ 
  eventId, 
  searchTerm, 
  statusFilter, 
  onMarkAsNoShow,
  onStatusChange,
  setSelectedRegistration,
  setDeleteDialogOpen 
}: EventRegistrationsTableProps) {
  const { data: registrations = [], isLoading } = useRegistrations(eventId);
  const typedRegistrations = registrations as any[];

  const filteredRegistrations = Array.isArray(typedRegistrations) ? typedRegistrations.filter((registration: any) => {
    const matchesSearch = !searchTerm || 
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (filteredRegistrations.length === 0) {
    return (
      <div className="p-4 text-center">
        <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {typedRegistrations.length === 0 ? "No registrations for this event" : "No registrations match your filters"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRegistrations.map((registration: any) => {
            const timeSlot = registration.timeSlot || {};
            
            return (
              <TableRow key={registration.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{registration.name}</p>
                    <p className="text-sm text-gray-500">{registration.address}, {registration.city}, {registration.state}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-3 h-3" />
                      <a 
                        href={`mailto:${registration.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title={`Send email to ${registration.email}`}
                      >
                        {registration.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-3 h-3" />
                      <a 
                        href={`tel:${registration.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title={`Call ${registration.phone}`}
                      >
                        {registration.phone}
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {timeSlot.startTime && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`cursor-pointer ${
                          registration.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' :
                          registration.status === 'waitlist' ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' :
                          registration.status === 'no_show' ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {registration.status === 'no_show' ? 'No-Show' : 
                         registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        <ChevronDown className="ml-2 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(registration.id, 'confirmed')}
                        className={registration.status === 'confirmed' ? 'bg-green-50' : ''}
                      >
                        {registration.status === 'confirmed' && <Check className="mr-2 h-4 w-4" />}
                        <span className={registration.status !== 'confirmed' ? 'ml-6' : ''}>Confirmed</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(registration.id, 'waitlist')}
                        className={registration.status === 'waitlist' ? 'bg-orange-50' : ''}
                      >
                        {registration.status === 'waitlist' && <Check className="mr-2 h-4 w-4" />}
                        <span className={registration.status !== 'waitlist' ? 'ml-6' : ''}>Waitlist</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(registration.id, 'no_show')}
                        className={registration.status === 'no_show' ? 'bg-red-50' : ''}
                      >
                        {registration.status === 'no_show' && <Check className="mr-2 h-4 w-4" />}
                        <span className={registration.status !== 'no_show' ? 'ml-6' : ''}>No-Show</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(registration.id, 'cancelled')}
                        className={registration.status === 'cancelled' ? 'bg-gray-50' : ''}
                      >
                        {registration.status === 'cancelled' && <Check className="mr-2 h-4 w-4" />}
                        <span className={registration.status !== 'cancelled' ? 'ml-6' : ''}>Cancelled</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {format(new Date(registration.createdAt), 'MMM d, h:mm a')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <EditRegistrationDialog registration={registration}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </EditRegistrationDialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminRegistrations() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: registrations = [], isLoading: registrationsLoading } = useRegistrations(selectedEventId);
  const markAsNoShowMutation = useMarkAsNoShow();
  const updateRegistrationMutation = useUpdateRegistration();
  
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

  // Sort events by date (ascending)
  const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = sortedEvents.filter(event => {
    // Check if any time slot is still in the future
    return event.timeSlots.some(slot => new Date(slot.endTime) > now);
  });
  
  const pastEvents = sortedEvents.filter(event => {
    // All time slots have ended
    return event.timeSlots.every(slot => new Date(slot.endTime) <= now);
  });

  // Filter registrations based on search and status
  const filteredRegistrations = Array.isArray(typedRegistrations) ? typedRegistrations.filter((registration: any) => {
    const matchesSearch = !searchTerm || 
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleMarkAsNoShow = (registrationId: string) => {
    markAsNoShowMutation.mutate(registrationId);
  };

  const handleStatusChange = (registrationId: string, newStatus: string) => {
    if (newStatus === 'no_show') {
      // Use the special no-show endpoint for blacklist functionality
      markAsNoShowMutation.mutate(registrationId);
    } else {
      // Use regular status update for other statuses
      updateRegistrationMutation.mutate({
        id: registrationId,
        registrationData: { status: newStatus }
      });
    }
  };

  const handlePrintRegistrations = async () => {
    // Get all confirmed registrations from all events
    const allConfirmedRegistrations: any[] = [];
    
    // We need to fetch registrations for each event since the current hook only gets one event
    for (const event of events) {
      try {
        const response = await fetch(`/api/events/${event.id}/registrations`);
        if (response.ok) {
          const eventRegistrations = await response.json();
          
          event.timeSlots.forEach(timeSlot => {
            const timeSlotRegistrations = eventRegistrations.filter((reg: any) => 
              reg.timeSlotId === timeSlot.id && reg.status === 'confirmed'
            );
            
            timeSlotRegistrations.forEach((registration: any) => {
              allConfirmedRegistrations.push({
                ...registration,
                eventTitle: event.title,
                eventDate: event.date,
                eventLocation: event.location,
                timeSlotStart: timeSlot.startTime,
                timeSlotEnd: timeSlot.endTime,
                laundromat_name: event.laundromat_name,
                laundromat_address: event.laundromat_address
              });
            });
          });
        }
      } catch (error) {
        console.error(`Failed to fetch registrations for event ${event.id}:`, error);
      }
    }

    // Sort by event date and time
    allConfirmedRegistrations.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return new Date(a.timeSlotStart).getTime() - new Date(b.timeSlotStart).getTime();
    });

    // Create print window with formatted content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Confirmed Registrations - Christ's Loving Hands</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.4;
          }
          h1 { 
            text-align: center; 
            color: #059669; 
            margin-bottom: 10px;
            font-size: 24px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .event-section {
            margin-bottom: 40px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .event-section:last-child {
            border-bottom: none;
          }
          .event-header {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #059669;
          }
          .event-title {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
          }
          .event-details {
            font-size: 14px;
            color: #6b7280;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f9fafb; 
            font-weight: bold;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .time-slot-header {
            background: #e5e7eb;
            font-weight: bold;
            text-align: center;
            color: #374151;
          }
          .print-date {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
          @media print {
            body { margin: 0; }
            .event-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Christ's Loving Hands - Loads of Love</h1>
        <div class="subtitle">Confirmed Registrations Report</div>
        
        ${allConfirmedRegistrations.length === 0 ? `
          <div style="text-align: center; color: #6b7280; margin-top: 50px;">
            <p>No confirmed registrations found.</p>
          </div>
        ` : (() => {
          // Group registrations by event and time slot
          const groupedRegistrations: { [key: string]: any[] } = {};
          
          allConfirmedRegistrations.forEach(reg => {
            const key = `${reg.eventTitle}-${reg.eventDate}-${reg.timeSlotStart}`;
            if (!groupedRegistrations[key]) {
              groupedRegistrations[key] = [];
            }
            groupedRegistrations[key].push(reg);
          });

          return Object.keys(groupedRegistrations).map(key => {
            const regs = groupedRegistrations[key];
            const firstReg = regs[0];
            
            return `
              <div class="event-section">
                <div class="event-header">
                  <div class="event-title">${firstReg.eventTitle}</div>
                  <div class="event-details">
                    <strong>Date:</strong> ${format(new Date(firstReg.eventDate), 'EEEE, MMMM d, yyyy')} | 
                    <strong>Time:</strong> ${format(new Date(firstReg.timeSlotStart), 'h:mm a')} - ${format(new Date(firstReg.timeSlotEnd), 'h:mm a')} | 
                    <strong>Location:</strong> ${firstReg.laundromat_name || firstReg.eventLocation}
                    ${firstReg.laundromat_address ? `<br><strong>Address:</strong> ${firstReg.laundromat_address}` : ''}
                  </div>
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25%;">Name</th>
                      <th style="width: 30%;">Email</th>
                      <th style="width: 20%;">Phone</th>
                      <th style="width: 25%;">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${regs.map(reg => `
                      <tr>
                        <td>${reg.name}</td>
                        <td>${reg.email}</td>
                        <td>${reg.phone}</td>
                        <td>${reg.address}, ${reg.city}, ${reg.state} ${reg.zipCode}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div style="text-align: right; font-size: 12px; color: #6b7280; margin-top: 10px;">
                  <strong>Total Confirmed: ${regs.length}</strong>
                </div>
              </div>
            `;
          }).join('');
        })()}
        
        <div class="print-date">
          Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Auto-print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registration Management</h1>
            <p className="text-gray-600">View event registrations organized by date and manage attendance</p>
          </div>
          <Button 
            onClick={handlePrintRegistrations}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Confirmed
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="no_show">No-Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events by Date with Tabs */}
        {eventsLoading ? (
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
        ) : sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No events found</p>
              <p className="text-sm text-gray-400">Create your first event to see registrations here</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                Upcoming Events ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Events ({pastEvents.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-6">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No upcoming events</p>
                    <p className="text-sm text-gray-400">All events have concluded</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
              const isExpanded = expandedEvents.has(event.id);
              const eventRegistrations = event.timeSlots.reduce((total, slot) => total + slot.registrationCount, 0);
              const totalCapacity = event.timeSlots.reduce((total, slot) => total + slot.capacity, 0);
              
              return (
                <Card key={event.id}>
                  <CardContent className="p-0">
                    {/* Event Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleEventExpansion(event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {eventRegistrations} / {totalCapacity} registered
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registrations Table */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50/50">
                        <EventRegistrationsTable 
                          eventId={event.id}
                          searchTerm={searchTerm}
                          statusFilter={statusFilter}
                          onMarkAsNoShow={handleMarkAsNoShow}
                          onStatusChange={handleStatusChange}
                          setSelectedRegistration={setSelectedRegistration}
                          setDeleteDialogOpen={setDeleteDialogOpen}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-6">
                {pastEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No past events</p>
                      <p className="text-sm text-gray-400">Events will appear here after they conclude</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastEvents.map((event) => {
                      const isExpanded = expandedEvents.has(event.id);
                      const eventRegistrations = event.timeSlots.reduce((total, slot) => total + slot.registrationCount, 0);
                      const totalCapacity = event.timeSlots.reduce((total, slot) => total + slot.capacity, 0);
                      
                      return (
                        <Card key={event.id}>
                          <CardContent className="p-0">
                            {/* Event Header */}
                            <div 
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleEventExpansion(event.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    {isExpanded ? (
                                      <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <span className="text-sm text-gray-600 flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {format(new Date(event.date), 'EEE, MMM d')}
                                      </span>
                                      <span className="text-sm text-gray-600 flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {event.timeSlots.length} time slot{event.timeSlots.length !== 1 ? 's' : ''}
                                      </span>
                                      <span className="text-sm text-gray-600 flex items-center">
                                        <User className="w-4 h-4 mr-1" />
                                        {eventRegistrations} registered
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                      {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {eventRegistrations} / {totalCapacity} registered
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Registrations Table */}
                            {isExpanded && (
                              <div className="border-t bg-gray-50/50">
                                <EventRegistrationsTable 
                                  eventId={event.id}
                                  searchTerm={searchTerm}
                                  statusFilter={statusFilter}
                                  onMarkAsNoShow={handleMarkAsNoShow}
                                  onStatusChange={handleStatusChange}
                                  setSelectedRegistration={setSelectedRegistration}
                                  setDeleteDialogOpen={setDeleteDialogOpen}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
      </div>

      <DeleteRegistrationDialog
        registration={selectedRegistration}
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedRegistration(null);
        }}
      />
    </AdminLayout>
  );
}