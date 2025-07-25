import { storage } from "../storage";
import { sendReminderEmail } from "./mailerlite";
import type { RegistrationWithDetails } from "@shared/schema";

// Run scheduler every hour
const SCHEDULER_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

class EmailScheduler {
  private schedulerRunning = false;

  start() {
    if (this.schedulerRunning) {
      console.log("Email scheduler already running");
      return;
    }

    this.schedulerRunning = true;
    console.log("Starting email scheduler...");
    
    // Run immediately on start
    this.processReminders();
    
    // Then run every hour
    setInterval(() => {
      this.processReminders();
    }, SCHEDULER_INTERVAL);
  }

  private async processReminders() {
    try {
      console.log("Processing email reminders...");
      
      // Get all upcoming registrations (within next 2 days)
      const upcomingRegistrations = await storage.getUpcomingRegistrations();
      
      const now = new Date();
      
      for (const registration of upcomingRegistrations) {
        const appointmentTime = new Date(registration.timeSlot.startTime);
        const timeDiff = appointmentTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Send day-before reminder (20-28 hours before)
        if (hoursDiff <= 28 && hoursDiff > 20) {
          await this.sendDayBeforeReminder(registration);
        }
        
        // Send morning-of reminder (2-6 hours before)
        if (hoursDiff <= 6 && hoursDiff > 2) {
          await this.sendMorningOfReminder(registration);
        }
      }
      
      console.log(`Processed reminders for ${upcomingRegistrations.length} registrations`);
    } catch (error) {
      console.error("Error processing email reminders:", error);
    }
  }

  private async sendDayBeforeReminder(registration: RegistrationWithDetails) {
    try {
      // Check if day-before reminder already sent
      const reminderSent = await storage.checkReminderSent(registration.id, 'day-before');
      if (reminderSent) {
        return;
      }

      await sendReminderEmail({
        name: registration.name,
        email: registration.email,
        eventTitle: registration.event.title,
        eventLocation: registration.event.location,
        startTime: registration.timeSlot.startTime.toISOString(),
        endTime: registration.timeSlot.endTime.toISOString(),
        cancelToken: registration.uniqueCancelToken
      }, 'day-before');

      // Mark reminder as sent
      await storage.markReminderSent(registration.id, 'day-before');
      console.log(`Day-before reminder sent to ${registration.email}`);
    } catch (error) {
      console.error(`Failed to send day-before reminder to ${registration.email}:`, error);
    }
  }

  private async sendMorningOfReminder(registration: RegistrationWithDetails) {
    try {
      // Check if morning-of reminder already sent
      const reminderSent = await storage.checkReminderSent(registration.id, 'morning-of');
      if (reminderSent) {
        return;
      }

      await sendReminderEmail({
        name: registration.name,
        email: registration.email,
        eventTitle: registration.event.title,
        eventLocation: registration.event.location,
        startTime: registration.timeSlot.startTime.toISOString(),
        endTime: registration.timeSlot.endTime.toISOString(),
        cancelToken: registration.uniqueCancelToken
      }, 'morning-of');

      // Mark reminder as sent
      await storage.markReminderSent(registration.id, 'morning-of');
      console.log(`Morning-of reminder sent to ${registration.email}`);
    } catch (error) {
      console.error(`Failed to send morning-of reminder to ${registration.email}:`, error);
    }
  }

  stop() {
    this.schedulerRunning = false;
    console.log("Email scheduler stopped");
  }
}

export const emailScheduler = new EmailScheduler();