import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertRegistrationSchema, insertWaitlistSchema, insertEventSchema, insertTimeSlotSchema, insertBlacklistSchema } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { generateAuthToken, verifyPassword, hashPassword } from "./lib/auth";
import { checkBlacklistMiddleware } from "./lib/blacklist";
import { sendConfirmationEmail, sendReminderEmail } from "./lib/sendgrid";
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
        validatedData.phone || '', 
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
          // Import timezone utilities and format date/time for email in Eastern Time
          const { formatEmailDate, formatEmailTime } = await import('../shared/timezone');
          
          const eventDate = formatEmailDate(targetSlot.startTime);
          const startTime = formatEmailTime(targetSlot.startTime);
          const endTime = formatEmailTime(targetSlot.endTime);
          
          if (status === 'confirmed') {
            await sendConfirmationEmail({
              name: registration.name,
              email: registration.email,
              eventTitle: event.title,
              eventDate: eventDate,
              eventTime: `${startTime} - ${endTime}`,
              eventLocation: event.laundromatName ? 
                `${event.laundromatName}${event.laundromatAddress ? ', ' + event.laundromatAddress : ''}` : 
                event.location,
              cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`,
              startTime: targetSlot.startTime,
              endTime: targetSlot.endTime
            });
            
            // Send admin notification for new confirmed registration
            const { sendNewRegistrationNotification } = await import('./lib/admin-notifications');
            await sendNewRegistrationNotification({
              registration,
              event,
              timeSlot: targetSlot
            });
          } else {
            // Send waitlist confirmation email
            const { sendWaitlistConfirmationEmail } = await import('./lib/sendgrid');
            await sendWaitlistConfirmationEmail({
              name: registration.name,
              email: registration.email,
              eventTitle: event.title,
              eventDate: eventDate,
              eventTime: `${startTime} - ${endTime}`,
              eventLocation: event.location,
              cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`
            });
            
            // Send admin notification for waitlist addition
            const { sendWaitlistNotification } = await import('./lib/admin-notifications');
            await sendWaitlistNotification({
              registration,
              event,
              timeSlot: targetSlot
            });
          }
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

  // Join waitlist (simplified registration)
  app.post("/api/waitlist", async (req, res) => {
    try {
      const validatedData = insertWaitlistSchema.parse(req.body);
      
      // Check for duplicate registration
      const isDuplicate = await storage.checkDuplicateRegistration(
        validatedData.email, 
        '', 
        validatedData.eventId
      );
      
      if (isDuplicate) {
        return res.status(400).json({ 
          message: "You are already registered for this event" 
        });
      }
      
      // Create waitlist registration with only name and email
      const registration = await storage.createRegistration({
        ...validatedData,
        status: 'waitlist'
      });
      
      // Send waitlist confirmation email
      try {
        const event = await storage.getEvent(validatedData.eventId);
        const timeSlots = await storage.getTimeSlotsByEvent(validatedData.eventId);
        const targetSlot = timeSlots.find(slot => slot.id === validatedData.timeSlotId);
        
        if (event && targetSlot) {
          const { sendWaitlistConfirmationEmail } = await import('./lib/sendgrid');
          
          // Format date and time for email
          const eventDate = new Date(targetSlot.startTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          });
          
          const startTime = new Date(targetSlot.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          const endTime = new Date(targetSlot.endTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit', 
            hour12: true
          });
          
          await sendWaitlistConfirmationEmail({
            name: validatedData.name,
            email: validatedData.email,
            eventTitle: event.title,
            eventDate: eventDate,
            eventTime: `${startTime} - ${endTime}`,
            eventLocation: event.laundromatName ? 
              `${event.laundromatName}${event.laundromatAddress ? ', ' + event.laundromatAddress : ''}` : 
              event.location,
            cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`,
            startTime: targetSlot.startTime,
            endTime: targetSlot.endTime
          });
          
          // Send admin notification for waitlist addition
          const { sendWaitlistNotification } = await import('./lib/admin-notifications');
          await sendWaitlistNotification({
            registration,
            event,
            timeSlot: targetSlot
          });
          
          console.log(`✓ Waitlist confirmation email sent to ${validatedData.email}`);
        }
      } catch (emailError) {
        console.error("Error sending waitlist confirmation email:", emailError);
        // Don't fail the registration if email fails
      }
      
      res.status(201).json({ registration, message: 'Added to waitlist - you will be notified if a spot opens' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid waitlist data",
          errors: error.errors 
        });
      }
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
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
      
      const wasConfirmed = registration.status === 'confirmed';
      await storage.cancelRegistration(token);
      
      // Send admin notification for cancellation
      try {
        const event = await storage.getEvent(registration.eventId);
        const timeSlots = await storage.getTimeSlotsByEvent(registration.eventId);
        const timeSlot = timeSlots.find(slot => slot.id === registration.timeSlotId);
        
        if (event && timeSlot) {
          const { sendCancellationNotification } = await import('./lib/admin-notifications');
          await sendCancellationNotification({
            registration,
            event,
            timeSlot
          });
        }
      } catch (notificationError) {
        console.error("Error sending cancellation notification:", notificationError);
      }
      
      // Notify waitlist if this was a confirmed registration
      if (wasConfirmed) {
        await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
      }
      
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
      const { timeSlots: timeSlotsData, ...eventData } = req.body;
      
      // Parse and validate event data (this will handle date conversion)
      const validatedEventData = insertEventSchema.partial().parse({
        ...eventData,
        date: eventData.date ? new Date(eventData.date) : undefined
      });
      
      const event = await storage.updateEvent(id, validatedEventData);
      
      // Update time slots if provided
      if (timeSlotsData && Array.isArray(timeSlotsData)) {
        // First, get existing time slots to check for registrations
        const existingSlots = await storage.getTimeSlotsByEvent(id);
        
        // Delete old time slots that aren't in the new list (but only if no registrations)
        for (const existingSlot of existingSlots) {
          const stillExists = timeSlotsData.find(newSlot => newSlot.id === existingSlot.id);
          if (!stillExists) {
            // Check if this slot has registrations
            const registrations = await storage.getRegistrationsByEvent(id);
            const hasRegistrations = registrations.some(r => r.timeSlot.id === existingSlot.id);
            
            if (!hasRegistrations) {
              await storage.deleteTimeSlot(existingSlot.id);
            }
          }
        }
        
        // Create or update time slots
        for (const slotData of timeSlotsData) {
          if (slotData.id) {
            // Update existing slot
            const validatedSlotData = insertTimeSlotSchema.partial().parse({
              startTime: new Date(slotData.startTime),
              endTime: new Date(slotData.endTime),
              capacity: slotData.capacity
            });
            await storage.updateTimeSlot(slotData.id, validatedSlotData);
          } else {
            // Create new slot
            const validatedSlotData = insertTimeSlotSchema.parse({
              ...slotData,
              eventId: event.id,
              startTime: new Date(slotData.startTime),
              endTime: new Date(slotData.endTime)
            });
            await storage.createTimeSlot(validatedSlotData);
          }
        }
      }
      
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
      
      // Parse the date as local date without timezone conversion
      const [year, month, day] = date.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day); // month is 0-indexed
      
      const newEvent = await storage.createEvent({
        title: originalEvent.title,
        description: originalEvent.description,
        date: eventDate,
        location: originalEvent.location,
        laundromatName: originalEvent.laundromatName,
        laundromatAddress: originalEvent.laundromatAddress
      });
      
      // Clone time slots with consistent date handling
      for (const slot of timeSlots) {
        const originalStart = new Date(slot.startTime);
        const originalEnd = new Date(slot.endTime);
        
        // Create new datetime objects using the new event date but same times
        const newStartTime = new Date(year, month - 1, day, 
          originalStart.getHours(), originalStart.getMinutes(), 
          originalStart.getSeconds(), originalStart.getMilliseconds());
        const newEndTime = new Date(year, month - 1, day, 
          originalEnd.getHours(), originalEnd.getMinutes(), 
          originalEnd.getSeconds(), originalEnd.getMilliseconds());
        
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
  
  // Get all registrations for a specific event
  app.get("/api/admin/registrations/:eventId", authMiddleware, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { status } = req.query;
      
      console.log("Fetching registrations for event:", eventId);
      const registrations = await storage.getRegistrationsByEvent(eventId);
      console.log("Found registrations:", registrations.length);
      
      // Filter by status if provided
      const filteredRegistrations = status 
        ? registrations.filter(r => r.status === status)
        : registrations;
      
      console.log("Filtered registrations:", filteredRegistrations.length);
      res.setHeader('Content-Type', 'application/json');
      res.json(filteredRegistrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Get all registrations with filters (for general admin use)
  app.get("/api/admin/registrations", authMiddleware, async (req, res) => {
    try {
      const { eventId, status } = req.query;
      
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
      
      // Get the original registration to check status change
      const originalRegistration = await storage.getRegistrationById(id);
      if (!originalRegistration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const wasConfirmed = originalRegistration.status === 'confirmed';
      const becomingNonConfirmed = registrationData.status && 
        ['cancelled', 'no-show'].includes(registrationData.status);
      
      const registration = await storage.updateRegistration(id, registrationData);
      
      // If a confirmed registration becomes cancelled/no-show, notify waitlist
      if (wasConfirmed && becomingNonConfirmed) {
        try {
          await storage.notifyWaitlist(originalRegistration.eventId, originalRegistration.timeSlotId);
          console.log(`✓ Notified waitlist for time slot ${originalRegistration.timeSlotId} after admin status change`);
        } catch (emailError) {
          console.error("Error notifying waitlist after admin status change:", emailError);
          // Don't fail the status update if email fails
        }
      }
      
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

  // Cancel registration (set status to cancelled)
  app.put("/api/admin/registrations/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get registration details before cancelling
      const registration = await storage.getRegistrationById(id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const wasConfirmed = registration.status === 'confirmed';
      await storage.updateRegistrationStatus(id, 'cancelled');
      
      // Send admin notification for cancellation
      try {
        const event = await storage.getEvent(registration.eventId);
        const timeSlots = await storage.getTimeSlotsByEvent(registration.eventId);
        const timeSlot = timeSlots.find(slot => slot.id === registration.timeSlotId);
        
        if (event && timeSlot) {
          const { sendCancellationNotification } = await import('./lib/admin-notifications');
          await sendCancellationNotification({
            registration,
            event,
            timeSlot
          });
        }
      } catch (notificationError) {
        console.error("Error sending admin cancellation notification:", notificationError);
      }
      
      // Notify waitlist if this was a confirmed registration
      if (wasConfirmed) {
        try {
          await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
          console.log(`✓ Notified waitlist for time slot ${registration.timeSlotId} after admin cancellation`);
        } catch (emailError) {
          console.error("Error notifying waitlist after admin cancellation:", emailError);
          // Don't fail the cancellation if email fails
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });

  // Mark registration as no-show and add to blacklist
  app.post("/api/admin/registrations/:id/no-show", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the registration first
      const registration = await storage.getRegistrationById(id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const wasConfirmed = registration.status === 'confirmed';
      
      // Update registration status to no-show
      await storage.updateRegistration(id, { status: 'no-show' });
      
      // Add to blacklist
      await storage.addToBlacklist({
        name: registration.name,
        email: registration.email,
        phone: registration.phone || '',
        reason: `No-show for event on ${new Date(registration.timeSlot.startTime).toLocaleDateString()}`
      });
      
      // Notify waitlist if this was a confirmed registration
      if (wasConfirmed) {
        try {
          await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
          console.log(`✓ Notified waitlist for time slot ${registration.timeSlotId} after no-show marking`);
        } catch (emailError) {
          console.error("Error notifying waitlist after no-show marking:", emailError);
          // Don't fail the no-show marking if email fails
        }
      }
      
      res.json({ message: "Registration marked as no-show and added to blacklist" });
    } catch (error) {
      console.error("Error marking as no-show:", error);
      res.status(500).json({ message: "Failed to mark as no-show" });
    }
  });

  // Delete registration (permanently remove)
  app.delete("/api/admin/registrations/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get registration details before deletion
      const registration = await storage.getRegistrationById(id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const wasConfirmed = registration.status === 'confirmed';
      await storage.deleteRegistration(id);
      
      // Send admin notification for deletion
      try {
        const event = await storage.getEvent(registration.eventId);
        const timeSlots = await storage.getTimeSlotsByEvent(registration.eventId);
        const timeSlot = timeSlots.find(slot => slot.id === registration.timeSlotId);
        
        if (event && timeSlot) {
          const { sendCancellationNotification } = await import('./lib/admin-notifications');
          await sendCancellationNotification({
            registration: { ...registration, status: 'cancelled' }, // Show as cancelled in email
            event,
            timeSlot
          });
        }
      } catch (notificationError) {
        console.error("Error sending admin deletion notification:", notificationError);
      }
      
      // Notify waitlist if this was a confirmed registration
      if (wasConfirmed) {
        try {
          await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
          console.log(`✓ Notified waitlist for time slot ${registration.timeSlotId} after admin deletion`);
        } catch (emailError) {
          console.error("Error notifying waitlist after admin deletion:", emailError);
          // Don't fail the deletion if email fails
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ message: "Failed to delete registration" });
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
