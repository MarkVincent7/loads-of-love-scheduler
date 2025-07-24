import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertRegistrationSchema, insertEventSchema, insertTimeSlotSchema, insertBlacklistSchema } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { generateAuthToken, verifyPassword, hashPassword } from "./lib/auth";
import { checkBlacklistMiddleware } from "./lib/blacklist";
import { sendConfirmationEmail, sendReminderEmail } from "./lib/mailersend";
import { sendConfirmationSMS, sendReminderSMS } from "./lib/sms";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Public API Routes
  
  // Get active events with availability
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getActiveEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // Get specific event details
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  // Register for time slot or join waitlist
  app.post("/api/register", checkBlacklistMiddleware, async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      
      // Check for duplicate registration
      const isDuplicate = await storage.checkDuplicateRegistration(
        validatedData.email, 
        validatedData.phone, 
        validatedData.eventId
      );
      
      if (isDuplicate) {
        return res.status(400).json({ 
          message: "You are already registered for this event" 
        });
      }
      
      // Get time slot to check capacity
      const timeSlots = await storage.getTimeSlotsByEvent(validatedData.eventId);
      const targetSlot = timeSlots.find(slot => slot.id === validatedData.timeSlotId);
      
      if (!targetSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      
      // Get current registrations for this time slot
      const registrations = await storage.getRegistrationsByEvent(validatedData.eventId);
      const confirmedCount = registrations.filter(
        r => r.timeSlot.id === validatedData.timeSlotId && r.status === 'confirmed'
      ).length;
      
      // Determine if confirmed or waitlist
      const status = confirmedCount >= targetSlot.capacity ? 'waitlist' : 'confirmed';
      
      const registration = await storage.createRegistration({
        ...validatedData,
        status
      });
      
      // Send confirmation email and SMS
      try {
        // Get event details for email
        const event = await storage.getEvent(validatedData.eventId);
        if (event) {
          await sendConfirmationEmail({
            name: registration.name,
            email: registration.email,
            eventTitle: event.title,
            eventLocation: event.location,
            startTime: targetSlot.startTime.toISOString(),
            endTime: targetSlot.endTime.toISOString(),
            cancelToken: registration.uniqueCancelToken
          });
        }
        await sendConfirmationSMS(registration, targetSlot);
      } catch (emailError) {
        console.error("Error sending confirmation:", emailError);
        // Don't fail the registration if email/SMS fails
      }
      
      res.status(201).json({ 
        registration,
        status,
        message: status === 'waitlist' 
          ? "You've been added to the waitlist. We'll notify you if a spot opens up."
          : "Registration confirmed! Check your email for details."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: error.errors 
        });
      }
      console.error("Error creating registration:", error);
      res.status(500).json({ message: "Failed to create registration" });
    }
  });
  
  // Cancel registration using unique token
  app.post("/api/cancel/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const registration = await storage.getRegistrationByToken(token);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      if (registration.status === 'cancelled') {
        return res.status(400).json({ message: "Registration already cancelled" });
      }
      
      await storage.cancelRegistration(token);
      
      // TODO: Promote waitlist if this was a confirmed registration
      
      res.json({ message: "Registration cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });
  
  // Admin API Routes (Protected)
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await verifyPassword(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateAuthToken(admin.id);
      
      res.json({ 
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Create new event
  app.post("/api/admin/events", authMiddleware, async (req, res) => {
    try {
      const { timeSlots: timeSlotsData, ...eventData } = req.body;
      
      // Parse and validate event data (this will handle date conversion)
      const validatedEventData = insertEventSchema.parse({
        ...eventData,
        date: new Date(eventData.date) // Ensure proper date conversion
      });
      
      const event = await storage.createEvent(validatedEventData);
      
      // Create time slots if provided
      if (timeSlotsData && Array.isArray(timeSlotsData)) {
        for (const slotData of timeSlotsData) {
          const validatedSlotData = insertTimeSlotSchema.parse({
            ...slotData,
            eventId: event.id,
            startTime: new Date(slotData.startTime),
            endTime: new Date(slotData.endTime)
          });
          await storage.createTimeSlot(validatedSlotData);
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid event data",
          errors: error.errors 
        });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  // Update event
  app.put("/api/admin/events/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const eventData = insertEventSchema.partial().parse(req.body);
      
      const event = await storage.updateEvent(id, eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid event data",
          errors: error.errors 
        });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  // Delete event
  app.delete("/api/admin/events/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Clone event
  app.post("/api/admin/events/:id/clone", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "New date is required" });
      }
      
      const originalEvent = await storage.getEvent(id);
      if (!originalEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const timeSlots = await storage.getTimeSlotsByEvent(id);
      
      const newEvent = await storage.createEvent({
        title: originalEvent.title,
        description: originalEvent.description,
        date: new Date(date),
        location: originalEvent.location
      });
      
      // Clone time slots
      for (const slot of timeSlots) {
        const newStartTime = new Date(slot.startTime);
        const newEndTime = new Date(slot.endTime);
        
        // Update dates to match new event date
        const eventDate = new Date(date);
        newStartTime.setFullYear(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        newEndTime.setFullYear(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        await storage.createTimeSlot({
          eventId: newEvent.id,
          startTime: newStartTime,
          endTime: newEndTime,
          capacity: slot.capacity
        });
      }
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error cloning event:", error);
      res.status(500).json({ message: "Failed to clone event" });
    }
  });
  
  // Get all registrations with filters
  app.get("/api/admin/registrations", authMiddleware, async (req, res) => {
    try {
      const { eventId, status } = req.query;
      
      // For now, get all registrations for a specific event
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      
      const registrations = await storage.getRegistrationsByEvent(eventId as string);
      
      // Filter by status if provided
      const filteredRegistrations = status 
        ? registrations.filter(r => r.status === status)
        : registrations;
      
      res.json(filteredRegistrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Update registration
  app.put("/api/admin/registrations/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const registrationData = insertRegistrationSchema.partial().parse(req.body);
      
      const registration = await storage.updateRegistration(id, registrationData);
      res.json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: error.errors 
        });
      }
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Cancel registration
  app.delete("/api/admin/registrations/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.cancelRegistration(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });
  
  // Add to blacklist
  app.post("/api/admin/blacklist", authMiddleware, async (req, res) => {
    try {
      const blacklistData = insertBlacklistSchema.parse(req.body);
      const blacklistItem = await storage.addToBlacklist(blacklistData);
      res.status(201).json(blacklistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid blacklist data",
          errors: error.errors 
        });
      }
      console.error("Error adding to blacklist:", error);
      res.status(500).json({ message: "Failed to add to blacklist" });
    }
  });
  
  // Get blacklist
  app.get("/api/admin/blacklist", authMiddleware, async (req, res) => {
    try {
      const blacklist = await storage.getBlacklist();
      res.json(blacklist);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      res.status(500).json({ message: "Failed to fetch blacklist" });
    }
  });
  
  // Remove from blacklist
  app.delete("/api/admin/blacklist/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromBlacklist(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from blacklist:", error);
      res.status(500).json({ message: "Failed to remove from blacklist" });
    }
  });
  
  // Get dashboard stats
  app.get("/api/admin/stats", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.getEventStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Export CSV
  app.get("/api/admin/export/csv", authMiddleware, async (req, res) => {
    try {
      const { eventId } = req.query;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      
      const registrations = await storage.getRegistrationsByEvent(eventId as string);
      
      // Simple CSV generation
      const headers = "Name,Email,Phone,Status,Time Slot,Registration Date\n";
      const rows = registrations.map(r => 
        `"${r.name}","${r.email}","${r.phone}","${r.status}","${r.timeSlot.startTime.toLocaleString()}","${r.createdAt.toLocaleString()}"`
      ).join("\n");
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
      res.send(headers + rows);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
