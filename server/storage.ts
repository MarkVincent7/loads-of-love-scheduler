import { 
  events, 
  timeSlots, 
  registrations, 
  blacklist, 
  admins,
  emailReminders,
  recurringEventTracking,
  type Event, 
  type InsertEvent,
  type TimeSlot,
  type InsertTimeSlot,
  type Registration,
  type InsertRegistration,
  type Blacklist,
  type InsertBlacklist,
  type Admin,
  type InsertAdmin,
  type EventWithSlots,
  type RegistrationWithDetails,
  type RecurringEventTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Events
  getActiveEvents(): Promise<EventWithSlots[]>;
  getAllEvents(): Promise<EventWithSlots[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Time Slots
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot>;
  deleteTimeSlot(id: string): Promise<void>;
  getTimeSlotsByEvent(eventId: string): Promise<TimeSlot[]>;
  
  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrationsByEvent(eventId: string): Promise<RegistrationWithDetails[]>;
  getRegistrationByToken(token: string): Promise<Registration | undefined>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration>;
  cancelRegistration(token: string): Promise<void>;
  updateRegistrationStatus(id: string, status: 'confirmed' | 'waitlist' | 'cancelled' | 'no-show'): Promise<void>;
  deleteRegistration(id: string): Promise<void>;
  checkDuplicateRegistration(email: string, phone: string, eventId: string): Promise<boolean>;
  notifyWaitlist(eventId: string, timeSlotId: string): Promise<void>;
  
  // Blacklist
  addToBlacklist(blacklistItem: InsertBlacklist): Promise<Blacklist>;
  getBlacklist(): Promise<Blacklist[]>;
  removeFromBlacklist(id: string): Promise<void>;
  checkBlacklist(name: string, email: string, phone: string): Promise<boolean>;
  
  // Admins
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Email reminders
  getUpcomingRegistrations(): Promise<RegistrationWithDetails[]>;
  checkReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of'): Promise<boolean>;
  markReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of'): Promise<void>;
  
  // Analytics
  getEventStats(): Promise<{
    activeEvents: number;
    totalRegistrations: number;
    waitlistCount: number;
    noShowRate: number;
    dailyAverage: number;
    weeklyTotal: number;
    capacityUtilization: number;
    statusDistribution: {
      confirmed: number;
      waitlist: number;
      cancelled: number;
      no_show: number;
    };
  }>;
  getRecentActivity(): Promise<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    status?: string;
    eventTitle?: string;
  }>>;
  
  // Recurring event automation
  checkRecurringEventCreated(eventType: 'morning' | 'evening', yearMonth: string): Promise<boolean>;
  trackRecurringEvent(eventType: 'morning' | 'evening', yearMonth: string, eventId: string): Promise<void>;
  getEventByTitle(title: string): Promise<Event | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getActiveEvents(): Promise<EventWithSlots[]> {
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventsWithSlots = await db
      .select({
        event: events,
        timeSlot: timeSlots,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .innerJoin(timeSlots, eq(events.id, timeSlots.eventId))
      .leftJoin(registrations, and(
        eq(timeSlots.id, registrations.timeSlotId),
        eq(registrations.status, 'confirmed')
      ))
      .where(gte(events.date, today))
      .groupBy(events.id, timeSlots.id)
      .orderBy(asc(events.date), asc(timeSlots.startTime));

    // Group by event
    const eventsMap = new Map<string, EventWithSlots>();
    
    for (const row of eventsWithSlots) {
      const eventId = row.event.id;
      
      if (!eventsMap.has(eventId)) {
        eventsMap.set(eventId, {
          ...row.event,
          timeSlots: []
        });
      }
      
      if (row.timeSlot) {
        // Get waitlist count for this time slot
        const waitlistResult = await db
          .select({ count: count() })
          .from(registrations)
          .where(and(
            eq(registrations.timeSlotId, row.timeSlot.id),
            eq(registrations.status, 'waitlist')
          ));
        
        eventsMap.get(eventId)!.timeSlots.push({
          ...row.timeSlot,
          registrationCount: row.registrationCount,
          waitlistCount: waitlistResult[0]?.count || 0
        });
      }
    }
    
    return Array.from(eventsMap.values());
  }

  async getAllEvents(): Promise<EventWithSlots[]> {
    const eventsWithSlots = await db
      .select({
        event: events,
        timeSlot: timeSlots,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .innerJoin(timeSlots, eq(events.id, timeSlots.eventId))
      .leftJoin(registrations, and(
        eq(timeSlots.id, registrations.timeSlotId),
        eq(registrations.status, 'confirmed')
      ))
      .groupBy(events.id, timeSlots.id)
      .orderBy(asc(events.date), asc(timeSlots.startTime));

    // Group by event
    const eventsMap = new Map<string, EventWithSlots>();
    
    for (const row of eventsWithSlots) {
      const eventId = row.event.id;
      
      if (!eventsMap.has(eventId)) {
        eventsMap.set(eventId, {
          ...row.event,
          timeSlots: []
        });
      }
      
      if (row.timeSlot) {
        // Get waitlist count for this time slot
        const waitlistResult = await db
          .select({ count: count() })
          .from(registrations)
          .where(and(
            eq(registrations.timeSlotId, row.timeSlot.id),
            eq(registrations.status, 'waitlist')
          ));
        
        eventsMap.get(eventId)!.timeSlots.push({
          ...row.timeSlot,
          registrationCount: row.registrationCount,
          waitlistCount: waitlistResult[0]?.count || 0
        });
      }
    }
    
    return Array.from(eventsMap.values());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({
        ...event,
        updatedAt: new Date()
      })
      .returning();
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...event,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db
      .insert(timeSlots)
      .values(timeSlot)
      .returning();
    return newTimeSlot;
  }

  async updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot> {
    const [updatedTimeSlot] = await db
      .update(timeSlots)
      .set({
        ...timeSlot
      })
      .where(eq(timeSlots.id, id))
      .returning();
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: string): Promise<void> {
    await db.delete(timeSlots).where(eq(timeSlots.id, id));
  }

  async getTimeSlotsByEvent(eventId: string): Promise<TimeSlot[]> {
    return db
      .select()
      .from(timeSlots)
      .where(eq(timeSlots.eventId, eventId))
      .orderBy(asc(timeSlots.startTime));
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const [newRegistration] = await db
      .insert(registrations)
      .values({
        ...registration,
        updatedAt: new Date()
      })
      .returning();
    return newRegistration;
  }

  async getRegistrationsByEvent(eventId: string): Promise<RegistrationWithDetails[]> {
    return db
      .select({
        registration: registrations,
        event: events,
        timeSlot: timeSlots
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(timeSlots, eq(registrations.timeSlotId, timeSlots.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(asc(timeSlots.startTime), asc(registrations.createdAt))
      .then(rows => rows.map(row => ({
        ...row.registration,
        event: row.event,
        timeSlot: row.timeSlot
      })));
  }

  async getRegistrationByToken(token: string): Promise<Registration | undefined> {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.uniqueCancelToken, token));
    return registration || undefined;
  }

  async getRegistrationById(id: string): Promise<RegistrationWithDetails | undefined> {
    const [result] = await db
      .select({
        registration: registrations,
        event: events,
        timeSlot: timeSlots
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(timeSlots, eq(registrations.timeSlotId, timeSlots.id))
      .where(eq(registrations.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.registration,
      event: result.event,
      timeSlot: result.timeSlot
    };
  }

  async updateRegistration(id: string, registration: Partial<Registration>): Promise<Registration> {
    const [updatedRegistration] = await db
      .update(registrations)
      .set({
        ...registration,
        updatedAt: new Date()
      })
      .where(eq(registrations.id, id))
      .returning();
    return updatedRegistration;
  }

  async cancelRegistration(token: string): Promise<void> {
    await db
      .update(registrations)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(registrations.uniqueCancelToken, token));
  }



  async updateRegistrationStatus(id: string, status: 'confirmed' | 'waitlist' | 'cancelled' | 'no-show'): Promise<void> {
    await db
      .update(registrations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(registrations.id, id));
  }

  async deleteRegistration(id: string): Promise<void> {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id));
    
    if (registration) {
      // Delete the registration
      await db.delete(registrations).where(eq(registrations.id, id));
      
      // If it was confirmed, notify waitlist
      if (registration.status === 'confirmed') {
        await this.notifyWaitlist(registration.eventId, registration.timeSlotId);
      }
    }
  }

  async notifyWaitlist(eventId: string, timeSlotId: string): Promise<void> {
    // Find all waitlist registrations for this time slot
    const waitlistRegistrations = await db
      .select()
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        eq(registrations.timeSlotId, timeSlotId),
        eq(registrations.status, 'waitlist')
      ))
      .orderBy(asc(registrations.createdAt));
    
    if (waitlistRegistrations.length > 0) {
      try {
        const event = await this.getEvent(eventId);
        const timeSlot = await db
          .select()
          .from(timeSlots)
          .where(eq(timeSlots.id, timeSlotId))
          .limit(1);
        
        if (event && timeSlot[0]) {
          const { sendSlotAvailableEmail } = await import('./lib/sendgrid');
          
          // Format date and time for email
          const eventDate = new Date(timeSlot[0].startTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          });
          
          const startTime = new Date(timeSlot[0].startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          const endTime = new Date(timeSlot[0].endTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit', 
            hour12: true
          });
          
          // Notify all waitlist members
          for (const waitlistRegistration of waitlistRegistrations) {
            await sendSlotAvailableEmail({
              name: waitlistRegistration.name,
              email: waitlistRegistration.email,
              eventTitle: event.title,
              eventDate: eventDate,
              eventTime: `${startTime} - ${endTime}`,
              eventLocation: event.laundromatName ? 
                `${event.laundromatName}${event.laundromatAddress ? ', ' + event.laundromatAddress : ''}` : 
                event.location,
              signUpUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/register?event=${eventId}&timeSlot=${timeSlotId}`,
              removeFromWaitlistUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${waitlistRegistration.uniqueCancelToken}`
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending waitlist notification emails:", emailError);
      }
    }
  }

  async checkDuplicateRegistration(email: string, phone: string, eventId: string): Promise<boolean> {
    // If phone is provided, check for exact match of both email AND phone (indicating truly the same person)
    // If phone is empty/not provided, only check email (for waitlist registrations)
    if (phone && phone.trim() !== '') {
      const [existing] = await db
        .select()
        .from(registrations)
        .where(and(
          eq(registrations.eventId, eventId),
          eq(registrations.email, email),
          eq(registrations.phone, phone),
          sql`${registrations.status} IN ('confirmed', 'waitlist')`
        ));
      return !!existing;
    } else {
      // For waitlist-only registrations, just check email
      const [existing] = await db
        .select()
        .from(registrations)
        .where(and(
          eq(registrations.eventId, eventId),
          eq(registrations.email, email),
          sql`${registrations.status} IN ('confirmed', 'waitlist')`
        ));
      return !!existing;
    }
  }

  async addToBlacklist(blacklistItem: InsertBlacklist): Promise<Blacklist> {
    const [newBlacklistItem] = await db
      .insert(blacklist)
      .values(blacklistItem)
      .returning();
    return newBlacklistItem;
  }

  async getBlacklist(): Promise<Blacklist[]> {
    return db
      .select()
      .from(blacklist)
      .orderBy(desc(blacklist.createdAt));
  }

  async removeFromBlacklist(id: string): Promise<void> {
    await db.delete(blacklist).where(eq(blacklist.id, id));
  }

  async checkBlacklist(name: string, email: string, phone: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(blacklist)
      .where(sql`
        LOWER(${blacklist.name}) LIKE LOWER(${'%' + name + '%'}) OR
        ${blacklist.email} = ${email} OR
        ${blacklist.phone} = ${phone}
      `);
    return !!existing;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    // Hash the password before storing
    const { password, ...adminData } = admin;
    const { hashPassword } = await import('./lib/auth');
    const passwordHash = await hashPassword(password);
    
    const [newAdmin] = await db
      .insert(admins)
      .values({
        ...adminData,
        passwordHash
      })
      .returning();
    return newAdmin;
  }

  async getUpcomingRegistrations(): Promise<RegistrationWithDetails[]> {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    const results = await db
      .select({
        registration: registrations,
        event: events,
        timeSlot: timeSlots,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(timeSlots, eq(registrations.timeSlotId, timeSlots.id))
      .where(and(
        gte(timeSlots.startTime, now),
        lte(timeSlots.startTime, twoDaysFromNow),
        eq(registrations.status, 'confirmed')
      ));
    
    return results.map(result => ({
      ...result.registration,
      event: result.event,
      timeSlot: result.timeSlot,
    }));
  }

  async checkReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of' | 'evening-before'): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(emailReminders)
      .where(and(
        eq(emailReminders.registrationId, registrationId),
        eq(emailReminders.reminderType, reminderType)
      ));
    
    return (result[0]?.count || 0) > 0;
  }

  async markReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of' | 'evening-before'): Promise<void> {
    await db.insert(emailReminders).values({
      registrationId,
      reminderType,
    });
  }

  async getEventStats(): Promise<{
    activeEvents: number;
    totalRegistrations: number;
    waitlistCount: number;
    noShowRate: number;
    dailyAverage: number;
    weeklyTotal: number;
    capacityUtilization: number;
    statusDistribution: {
      confirmed: number;
      waitlist: number;
      cancelled: number;
      no_show: number;
    };
  }> {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Active events count
    const [activeEventsResult] = await db
      .select({ count: count() })
      .from(events)
      .where(gte(events.date, now));
    
    // Total registrations count
    const [totalRegistrationsResult] = await db
      .select({ count: count() })
      .from(registrations)
      .where(sql`${registrations.status} IN ('confirmed', 'waitlist')`);
    
    // Waitlist count
    const [waitlistResult] = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.status, 'waitlist'));
    
    // No-show rate calculation
    const [noShowResult] = await db
      .select({ 
        total: count(),
        noShows: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'no_show' THEN 1 END)`
      })
      .from(registrations)
      .where(lte(sql`${registrations.createdAt}`, sql`NOW() - INTERVAL '1 week'`));
    
    const noShowRate = noShowResult.total > 0 
      ? Math.round((noShowResult.noShows / noShowResult.total) * 100)
      : 0;

    // Weekly registrations
    const [weeklyResult] = await db
      .select({ count: count() })
      .from(registrations)
      .where(gte(registrations.createdAt, oneWeekAgo));

    const dailyAverage = Math.round(weeklyResult.count / 7);

    // Status distribution
    const statusResults = await db
      .select({ 
        status: registrations.status,
        count: count()
      })
      .from(registrations)
      .groupBy(registrations.status);

    const statusDistribution = {
      confirmed: 0,
      waitlist: 0,
      cancelled: 0,
      no_show: 0
    };

    statusResults.forEach(result => {
      if (result.status in statusDistribution) {
        statusDistribution[result.status as keyof typeof statusDistribution] = result.count;
      }
    });

    // Capacity utilization
    const [capacityResult] = await db
      .select({
        totalCapacity: sql<number>`SUM(${timeSlots.capacity})`,
        usedCapacity: sql<number>`COUNT(${registrations.id})`
      })
      .from(timeSlots)
      .leftJoin(registrations, and(
        eq(timeSlots.id, registrations.timeSlotId),
        eq(registrations.status, 'confirmed')
      ))
      .innerJoin(events, eq(timeSlots.eventId, events.id))
      .where(gte(events.date, now));

    const capacityUtilization = capacityResult.totalCapacity > 0 
      ? Math.round((capacityResult.usedCapacity / capacityResult.totalCapacity) * 100)
      : 0;
    
    return {
      activeEvents: activeEventsResult.count,
      totalRegistrations: totalRegistrationsResult.count,
      waitlistCount: waitlistResult.count,
      noShowRate,
      dailyAverage,
      weeklyTotal: weeklyResult.count,
      capacityUtilization,
      statusDistribution
    };
  }

  async getRecentActivity(): Promise<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    status?: string;
    eventTitle?: string;
  }>> {
    // Get recent registrations with event details
    const recentRegistrations = await db
      .select({
        id: registrations.id,
        name: registrations.name,
        status: registrations.status,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        eventTitle: events.title
      })
      .from(registrations)
      .innerJoin(timeSlots, eq(registrations.timeSlotId, timeSlots.id))
      .innerJoin(events, eq(timeSlots.eventId, events.id))
      .orderBy(desc(registrations.updatedAt))
      .limit(50);

    const activities = [];

    for (const reg of recentRegistrations) {
      // Determine activity type based on status and timestamps
      let type = 'registration';
      let description = `${reg.name} registered for ${reg.eventTitle}`;
      
      if (reg.status === 'cancelled') {
        type = 'cancellation';
        description = `${reg.name} cancelled registration for ${reg.eventTitle}`;
      } else if (reg.status === 'waitlist') {
        type = 'waitlist';
        description = `${reg.name} joined waitlist for ${reg.eventTitle}`;
      } else if (reg.status === 'no-show') {
        type = 'no_show';
        description = `${reg.name} marked as no-show for ${reg.eventTitle}`;
      }

      activities.push({
        id: reg.id,
        type,
        description,
        timestamp: reg.updatedAt || reg.createdAt,
        status: reg.status,
        eventTitle: reg.eventTitle
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async checkRecurringEventCreated(eventType: 'morning' | 'evening', yearMonth: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(recurringEventTracking)
      .where(and(
        eq(recurringEventTracking.eventType, eventType),
        eq(recurringEventTracking.yearMonth, yearMonth)
      ));
    return !!existing;
  }

  async trackRecurringEvent(eventType: 'morning' | 'evening', yearMonth: string, eventId: string): Promise<void> {
    await db.insert(recurringEventTracking).values({
      eventType,
      yearMonth,
      eventId
    });
  }

  async getEventByTitle(title: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.title, title));
    return event || undefined;
  }
}

export const storage = new DatabaseStorage();
