import { 
  events, 
  timeSlots, 
  registrations, 
  blacklist, 
  admins,
  emailReminders,
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
  type RegistrationWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Events
  getActiveEvents(): Promise<EventWithSlots[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Time Slots
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getTimeSlotsByEvent(eventId: string): Promise<TimeSlot[]>;
  
  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrationsByEvent(eventId: string): Promise<RegistrationWithDetails[]>;
  getRegistrationByToken(token: string): Promise<Registration | undefined>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration>;
  cancelRegistration(token: string): Promise<void>;
  updateRegistrationStatus(id: string, status: 'confirmed' | 'waitlist' | 'cancelled' | 'no_show'): Promise<void>;
  deleteRegistration(id: string): Promise<void>;
  checkDuplicateRegistration(email: string, phone: string, eventId: string): Promise<boolean>;
  promoteFromWaitlist(eventId: string, timeSlotId: string): Promise<void>;
  
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
  }>;
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
        ...timeSlot,
        updatedAt: new Date()
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

  async updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration> {
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

  async updateRegistrationStatus(id: string, status: 'confirmed' | 'waitlist' | 'cancelled' | 'no_show'): Promise<void> {
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
      
      // If it was confirmed, promote someone from waitlist
      if (registration.status === 'confirmed') {
        await this.promoteFromWaitlist(registration.eventId, registration.timeSlotId);
      }
    }
  }

  async promoteFromWaitlist(eventId: string, timeSlotId: string): Promise<void> {
    // Find the oldest waitlist registration for this time slot
    const [waitlistRegistration] = await db
      .select()
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        eq(registrations.timeSlotId, timeSlotId),
        eq(registrations.status, 'waitlist')
      ))
      .orderBy(asc(registrations.createdAt))
      .limit(1);
    
    if (waitlistRegistration) {
      await db
        .update(registrations)
        .set({
          status: 'confirmed',
          updatedAt: new Date()
        })
        .where(eq(registrations.id, waitlistRegistration.id));
    }
  }

  async checkDuplicateRegistration(email: string, phone: string, eventId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        sql`(${registrations.email} = ${email} OR ${registrations.phone} = ${phone})`,
        sql`${registrations.status} IN ('confirmed', 'waitlist')`
      ));
    return !!existing;
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

  async checkReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of'): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(emailReminders)
      .where(and(
        eq(emailReminders.registrationId, registrationId),
        eq(emailReminders.reminderType, reminderType)
      ));
    
    return (result[0]?.count || 0) > 0;
  }

  async markReminderSent(registrationId: string, reminderType: 'day-before' | 'morning-of'): Promise<void> {
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
  }> {
    const now = new Date();
    
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
    
    return {
      activeEvents: activeEventsResult.count,
      totalRegistrations: totalRegistrationsResult.count,
      waitlistCount: waitlistResult.count,
      noShowRate
    };
  }
}

export const storage = new DatabaseStorage();
