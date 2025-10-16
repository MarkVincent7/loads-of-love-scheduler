import { storage } from "../storage";
import { sendReminderEmail } from "./sendgrid";
import { 
  formatEmailDate, 
  formatEmailTime, 
  getCurrentEasternTime, 
  convertToEasternTime,
  getSecondTuesdayOfMonth,
  getFourthTuesdayOfMonth,
  getWednesdayAfter
} from "../../shared/timezone";
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
    this.processRecurringEvents();
    
    // Then run every hour
    setInterval(() => {
      this.processReminders();
      this.processRecurringEvents();
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

  private async processRecurringEvents() {
    try {
      console.log("Checking for recurring event automation...");
      
      const nowEastern = getCurrentEasternTime();
      const currentYear = nowEastern.getFullYear();
      const currentMonth = nowEastern.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Calculate 2nd and 4th Tuesday of current month
      const secondTuesday = getSecondTuesdayOfMonth(currentYear, currentMonth);
      const fourthTuesday = getFourthTuesdayOfMonth(currentYear, currentMonth);
      
      // Get Wednesday after each Tuesday
      const wednesdayAfterSecond = getWednesdayAfter(secondTuesday);
      const wednesdayAfterFourth = getWednesdayAfter(fourthTuesday);
      
      // Calculate next month's year and month
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = currentYear + 1;
      }
      
      const nextMonthYearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      
      // Check if we're on or after Wednesday after 2nd Tuesday -> create Morning event for next month
      if (nowEastern >= wednesdayAfterSecond) {
        console.log(`On or after Wednesday following 2nd Tuesday. Checking Morning Loads of Love event...`);
        await this.createRecurringEvent('morning', nextYear, nextMonth, nextMonthYearMonth);
      }
      
      // Check if we're on or after Wednesday after 4th Tuesday -> create Evening event for next month
      if (nowEastern >= wednesdayAfterFourth) {
        console.log(`On or after Wednesday following 4th Tuesday. Checking Evening Loads of Love event...`);
        await this.createRecurringEvent('evening', nextYear, nextMonth, nextMonthYearMonth);
      }
      
    } catch (error) {
      console.error("Error processing recurring events:", error);
    }
  }

  private async createRecurringEvent(
    eventType: 'morning' | 'evening', 
    targetYear: number, 
    targetMonth: number, 
    yearMonth: string
  ) {
    try {
      // Check if we've already created this event (idempotency)
      const alreadyCreated = await storage.checkRecurringEventCreated(eventType, yearMonth);
      if (alreadyCreated) {
        console.log(`${eventType === 'morning' ? 'Morning' : 'Evening'} Loads of Love event for ${yearMonth} already exists`);
        return;
      }
      
      // Find the template event by title
      const templateTitle = eventType === 'morning' 
        ? 'Morning Loads of Love' 
        : 'Evening Loads of Love';
      
      const templateEvent = await storage.getEventByTitle(templateTitle);
      if (!templateEvent) {
        console.error(`Template event not found: ${templateTitle}`);
        return;
      }
      
      // Get time slots for the template
      const timeSlots = await storage.getTimeSlotsByEvent(templateEvent.id);
      if (timeSlots.length === 0) {
        console.error(`No time slots found for template event: ${templateTitle}`);
        return;
      }
      
      // Calculate target date (2nd or 4th Tuesday of next month)
      const targetDate = eventType === 'morning' 
        ? getSecondTuesdayOfMonth(targetYear, targetMonth)
        : getFourthTuesdayOfMonth(targetYear, targetMonth);
      
      // Create the new event
      const newEvent = await storage.createEvent({
        title: templateEvent.title,
        description: templateEvent.description,
        date: targetDate,
        location: templateEvent.location,
        laundromatName: templateEvent.laundromatName,
        laundromatAddress: templateEvent.laundromatAddress
      });
      
      // Clone time slots - match admin clone route logic exactly
      // Server is in UTC, database stores UTC, frontend converts to Eastern for display
      for (const slot of timeSlots) {
        const originalStart = new Date(slot.startTime);
        const originalEnd = new Date(slot.endTime);
        
        // Create new datetime objects using the new event date but same UTC times
        const newStartTime = new Date(
          targetYear, 
          targetMonth - 1, 
          targetDate.getDate(), 
          originalStart.getHours(), 
          originalStart.getMinutes(), 
          originalStart.getSeconds(), 
          originalStart.getMilliseconds()
        );
        const newEndTime = new Date(
          targetYear, 
          targetMonth - 1, 
          targetDate.getDate(), 
          originalEnd.getHours(), 
          originalEnd.getMinutes(), 
          originalEnd.getSeconds(), 
          originalEnd.getMilliseconds()
        );
        
        await storage.createTimeSlot({
          eventId: newEvent.id,
          startTime: newStartTime,
          endTime: newEndTime,
          capacity: slot.capacity
        });
      }
      
      // Track that we created this event
      await storage.trackRecurringEvent(eventType, yearMonth, newEvent.id);
      
      console.log(`✓ Successfully created ${eventType} Loads of Love event for ${yearMonth} (${targetDate.toLocaleDateString()})`);
      
    } catch (error) {
      console.error(`Error creating ${eventType} recurring event:`, error);
    }
  }

  stop() {
    this.schedulerRunning = false;
    console.log("Email scheduler stopped");
  }
}

export const emailScheduler = new EmailScheduler();