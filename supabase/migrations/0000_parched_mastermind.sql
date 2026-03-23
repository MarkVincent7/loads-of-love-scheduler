CREATE TYPE "public"."loads_of_love_registration_status" AS ENUM('confirmed', 'waitlist', 'cancelled', 'no-show');--> statement-breakpoint
CREATE TABLE "loads_of_love_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loads_of_love_admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_email_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"reminder_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"location" text NOT NULL,
	"laundromat_name" text,
	"laundromat_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_recurring_event_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"year_month" text NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"time_slot_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"status" "loads_of_love_registration_status" DEFAULT 'confirmed' NOT NULL,
	"unique_cancel_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads_of_love_time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loads_of_love_email_reminders" ADD CONSTRAINT "loads_of_love_email_reminders_registration_id_loads_of_love_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."loads_of_love_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads_of_love_recurring_event_tracking" ADD CONSTRAINT "loads_of_love_recurring_event_tracking_event_id_loads_of_love_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."loads_of_love_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads_of_love_registrations" ADD CONSTRAINT "loads_of_love_registrations_event_id_loads_of_love_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."loads_of_love_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads_of_love_registrations" ADD CONSTRAINT "loads_of_love_registrations_time_slot_id_loads_of_love_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."loads_of_love_time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads_of_love_time_slots" ADD CONSTRAINT "loads_of_love_time_slots_event_id_loads_of_love_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."loads_of_love_events"("id") ON DELETE cascade ON UPDATE no action;