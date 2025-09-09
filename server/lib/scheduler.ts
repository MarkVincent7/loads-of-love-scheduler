import { storage } from "../storage";
import { sendReminderEmail } from "./sendgrid";
import { formatEmailDate, formatEmailTime, getCurrentEasternTime, convertToEasternTime } from "../../shared/timezone";
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
      
      // Get current time in Eastern Time for proper comparison
      const nowEastern = getCurrentEasternTime();
      
      // Only send reminders between 9am and 8pm Eastern Time
      const currentHour = nowEastern.getHours();
      if (currentHour < 9 || currentHour >= 20) {
        console.log(`Skipping reminder processing - current time is ${currentHour}:00, outside allowed hours (9am-8pm)`);
        return;
      }

      for (const registration of upcomingRegistrations) {
        // Convert appointment time to Eastern Time for consistent comparison
        const appointmentTimeEastern = convertToEasternTime(registration.timeSlot.startTime);
        const timeDiff = appointmentTimeEastern.getTime() - nowEastern.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Determine if appointment is morning (before noon) or afternoon/evening
        const appointmentHour = appointmentTimeEastern.getHours();
        const isMorningEvent = appointmentHour < 12;
        
        console.log(`Checking ${registration.name} (${registration.email}): appointment at ${appointmentTimeEastern.toLocaleString('en-US', {timeZone: 'America/New_York'})}, now is ${nowEastern.toLocaleString('en-US', {timeZone: 'America/New_York'})}, ${hoursDiff.toFixed(2)} hours difference, ${isMorningEvent ? 'morning' : 'afternoon/evening'} event`);
        
        // Send day-before reminder (20-28 hours before) - always send these
        if (hoursDiff <= 28 && hoursDiff > 20) {
          await this.sendDayBeforeReminder(registration);
        }
        
        if (isMorningEvent) {
          // For morning events: send evening-before reminder (12-16 hours before)
          if (hoursDiff <= 16 && hoursDiff > 12) {
            await this.sendEveningBeforeReminder(registration);
          }
        } else {
          // For afternoon/evening events: send morning-of reminder (2-6 hours before)
          if (hoursDiff <= 6 && hoursDiff > 2) {
            await this.sendMorningOfReminder(registration);
          }
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

      // Format date and time for email in Eastern Time
      const eventDate = formatEmailDate(registration.timeSlot.startTime);
      const startTime = formatEmailTime(registration.timeSlot.startTime);
      const endTime = formatEmailTime(registration.timeSlot.endTime);

      await sendReminderEmail({
        name: registration.name,
        email: registration.email,
        eventTitle: registration.event.title,
        eventDate: eventDate,
        eventTime: `${startTime} - ${endTime}`,
        eventLocation: registration.event.location,
        cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`
      }, 'day-before');

      // Mark reminder as sent
      await storage.markReminderSent(registration.id, 'day-before');
      console.log(`Day-before reminder sent to ${registration.email}`);
    } catch (error) {
      console.error(`Failed to send day-before reminder to ${registration.email}:`, error);
    }
  }

  private async sendEveningBeforeReminder(registration: RegistrationWithDetails) {
    try {
      // Check if evening-before reminder already sent
      const reminderSent = await storage.checkReminderSent(registration.id, 'evening-before');
      if (reminderSent) {
        return;
      }

      // Format date and time for email in Eastern Time
      const eventDate = formatEmailDate(registration.timeSlot.startTime);
      const startTime = formatEmailTime(registration.timeSlot.startTime);
      const endTime = formatEmailTime(registration.timeSlot.endTime);

      await sendReminderEmail({
        name: registration.name,
        email: registration.email,
        eventTitle: registration.event.title,
        eventDate: eventDate,
        eventTime: `${startTime} - ${endTime}`,
        eventLocation: registration.event.location,
        cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`
      }, 'evening-before');

      // Mark reminder as sent
      await storage.markReminderSent(registration.id, 'evening-before');
      console.log(`Evening-before reminder sent to ${registration.email}`);
    } catch (error) {
      console.error(`Failed to send evening-before reminder to ${registration.email}:`, error);
    }
  }

  private async sendMorningOfReminder(registration: RegistrationWithDetails) {
    try {
      // Check if morning-of reminder already sent
      const reminderSent = await storage.checkReminderSent(registration.id, 'morning-of');
      if (reminderSent) {
        return;
      }

      // Format date and time for email in Eastern Time
      const eventDate = formatEmailDate(registration.timeSlot.startTime);
      const startTime = formatEmailTime(registration.timeSlot.startTime);
      const endTime = formatEmailTime(registration.timeSlot.endTime);

      await sendReminderEmail({
        name: registration.name,
        email: registration.email,
        eventTitle: registration.event.title,
        eventDate: eventDate,
        eventTime: `${startTime} - ${endTime}`,
        eventLocation: registration.event.location,
        cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`
      }, 'hour-before');

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