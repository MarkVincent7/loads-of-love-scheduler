import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrationStatusEnum = pgEnum("loads_of_love_registration_status", [
  "confirmed",
  "waitlist",
  "cancelled",
  "no-show",
]);

export const events = pgTable("loads_of_love_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  laundromatName: text("laundromat_name"),
  laundromatAddress: text("laundromat_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeSlots = pgTable("loads_of_love_time_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registrations = pgTable("loads_of_love_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  timeSlotId: uuid("time_slot_id")
    .notNull()
    .references(() => timeSlots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  status: registrationStatusEnum("status").notNull().default("confirmed"),
  uniqueCancelToken: uuid("unique_cancel_token").notNull().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blacklist = pgTable("loads_of_love_blacklist", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailReminders = pgTable("loads_of_love_email_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  reminderType: text("reminder_type").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const admins = pgTable("loads_of_love_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringEventTracking = pgTable("loads_of_love_recurring_event_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  yearMonth: text("year_month").notNull(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  timeSlots: many(timeSlots),
  registrations: many(registrations),
}));

export const timeSlotsRelations = relations(timeSlots, ({ many, one }) => ({
  event: one(events, {
    fields: [timeSlots.eventId],
    references: [events.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [registrations.timeSlotId],
    references: [timeSlots.id],
  }),
}));

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

export const VALID_ZIP_CODES = [
  "45252",
  "45247",
  "45053",
  "45052",
  "45033",
  "45030",
  "45013",
  "45002",
  "47060",
  "47025",
];

export const insertRegistrationSchema = createInsertSchema(registrations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    uniqueCancelToken: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    zipCode: z.string().min(1, "Zip code is required").refine(
      (zip) => VALID_ZIP_CODES.includes(zip),
      { message: "Zip code out of service area" },
    ),
  });

export const insertAdminRegistrationSchema = createInsertSchema(registrations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    uniqueCancelToken: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional().refine(
      (zip) => !zip || VALID_ZIP_CODES.includes(zip),
      { message: "Zip code out of service area" },
    ),
    status: z.enum(["confirmed", "waitlist", "cancelled", "no-show"]).optional(),
  });

export const insertWaitlistSchema = z.object({
  eventId: z.string(),
  timeSlotId: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

export const insertBlacklistSchema = createInsertSchema(blacklist).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSchema = createInsertSchema(admins)
  .omit({
    id: true,
    createdAt: true,
    passwordHash: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type InsertAdminRegistration = z.infer<typeof insertAdminRegistrationSchema>;
export type Blacklist = typeof blacklist.$inferSelect;
export type InsertBlacklist = z.infer<typeof insertBlacklistSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type RecurringEventTracking = typeof recurringEventTracking.$inferSelect;

export type EventWithSlots = Event & {
  timeSlots: (TimeSlot & {
    registrationCount: number;
    waitlistCount: number;
  })[];
};

export type RegistrationWithDetails = Registration & {
  event: Event;
  timeSlot: TimeSlot;
};
