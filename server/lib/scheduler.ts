import { fromZonedTime } from "date-fns-tz";
import type { RegistrationWithDetails } from "@shared/schema";
import {
  convertToEasternTime,
  EASTERN_TIMEZONE,
  formatEmailDate,
  formatEmailTime,
  getCurrentEasternTime,
  getFourthTuesdayOfMonth,
  getSecondTuesdayOfMonth,
  getWednesdayAfter,
} from "@shared/timezone";
import { storage } from "../storage";
import { getAppUrl } from "./app-url";
import { sendReminderEmail } from "./sendgrid";

function buildCancelUrl(token: string) {
  return `${getAppUrl()}/cancel/${token}`;
}

async function sendReminder(
  registration: RegistrationWithDetails,
  reminderType: "day-before" | "morning-of" | "evening-before",
  emailVariant: "day-before" | "hour-before" | "evening-before",
) {
  const alreadySent = await storage.checkReminderSent(registration.id, reminderType);
  if (alreadySent) {
    return;
  }

  await sendReminderEmail(
    {
      name: registration.name,
      email: registration.email,
      eventTitle: registration.event.title,
      eventDate: formatEmailDate(registration.timeSlot.startTime),
      eventTime: `${formatEmailTime(registration.timeSlot.startTime)} - ${formatEmailTime(registration.timeSlot.endTime)}`,
      eventLocation: registration.event.laundromatName
        ? `${registration.event.laundromatName}${registration.event.laundromatAddress ? `, ${registration.event.laundromatAddress}` : ""}`
        : registration.event.location,
      cancelUrl: buildCancelUrl(registration.uniqueCancelToken),
    },
    emailVariant,
  );

  await storage.markReminderSent(registration.id, reminderType);
}

export async function processReminderCron() {
  const upcomingRegistrations = await storage.getUpcomingRegistrations();
  const nowEastern = getCurrentEasternTime();
  const currentHour = nowEastern.getHours();

  if (currentHour < 9 || currentHour >= 20) {
    return { processed: 0, skipped: "outside reminder window" };
  }

  let processed = 0;

  for (const registration of upcomingRegistrations) {
    const appointmentTimeEastern = convertToEasternTime(registration.timeSlot.startTime);
    const hoursDiff =
      (appointmentTimeEastern.getTime() - nowEastern.getTime()) / (1000 * 60 * 60);
    const appointmentHour = appointmentTimeEastern.getHours();
    const isMorningEvent = appointmentHour < 12;

    if (hoursDiff <= 28 && hoursDiff > 20) {
      await sendReminder(registration, "day-before", "day-before");
      processed += 1;
      continue;
    }

    if (isMorningEvent && hoursDiff <= 16 && hoursDiff > 12) {
      await sendReminder(registration, "evening-before", "evening-before");
      processed += 1;
      continue;
    }

    if (!isMorningEvent && hoursDiff <= 6 && hoursDiff > 2) {
      await sendReminder(registration, "morning-of", "hour-before");
      processed += 1;
    }
  }

  return { processed };
}

async function createRecurringEvent(
  eventType: "morning" | "evening",
  targetYear: number,
  targetMonth: number,
  yearMonth: string,
) {
  const alreadyCreated = await storage.checkRecurringEventCreated(eventType, yearMonth);
  if (alreadyCreated) {
    return false;
  }

  const templateTitle =
    eventType === "morning" ? "Morning Loads of Love" : "Evening Loads of Love";
  const templateEvent = await storage.getEventByTitle(templateTitle);
  if (!templateEvent) {
    return false;
  }

  const slots = await storage.getTimeSlotsByEvent(templateEvent.id);
  if (slots.length === 0) {
    return false;
  }

  const targetDate =
    eventType === "morning"
      ? getSecondTuesdayOfMonth(targetYear, targetMonth)
      : getFourthTuesdayOfMonth(targetYear, targetMonth);

  const newEvent = await storage.createEvent({
    title: templateEvent.title,
    description: templateEvent.description,
    date: targetDate,
    location: templateEvent.location,
    laundromatName: templateEvent.laundromatName,
    laundromatAddress: templateEvent.laundromatAddress,
  });

  for (const slot of slots) {
    const originalStartStr = new Date(slot.startTime).toLocaleString("en-US", {
      timeZone: EASTERN_TIMEZONE,
      hour12: false,
    });
    const originalEndStr = new Date(slot.endTime).toLocaleString("en-US", {
      timeZone: EASTERN_TIMEZONE,
      hour12: false,
    });

    const startMatch = originalStartStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    const endMatch = originalEndStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!startMatch || !endMatch) {
      continue;
    }

    const startHour = Number.parseInt(startMatch[1], 10);
    const startMinute = Number.parseInt(startMatch[2], 10);
    const endHour = Number.parseInt(endMatch[1], 10);
    const endMinute = Number.parseInt(endMatch[2], 10);

    const newStartLocal = new Date(
      targetYear,
      targetMonth - 1,
      targetDate.getDate(),
      startHour,
      startMinute,
    );
    const newEndLocal = new Date(
      targetYear,
      targetMonth - 1,
      targetDate.getDate(),
      endHour,
      endMinute,
    );

    await storage.createTimeSlot({
      eventId: newEvent.id,
      startTime: fromZonedTime(newStartLocal, EASTERN_TIMEZONE),
      endTime: fromZonedTime(newEndLocal, EASTERN_TIMEZONE),
      capacity: slot.capacity,
    });
  }

  await storage.trackRecurringEvent(eventType, yearMonth, newEvent.id);
  return true;
}

export async function processRecurringEventCron() {
  const nowEastern = getCurrentEasternTime();
  const currentYear = nowEastern.getFullYear();
  const currentMonth = nowEastern.getMonth() + 1;

  const secondTuesday = getSecondTuesdayOfMonth(currentYear, currentMonth);
  const fourthTuesday = getFourthTuesdayOfMonth(currentYear, currentMonth);
  const wednesdayAfterSecond = getWednesdayAfter(secondTuesday);
  const wednesdayAfterFourth = getWednesdayAfter(fourthTuesday);

  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nextMonthYearMonth = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
  let created = 0;

  if (nowEastern >= wednesdayAfterSecond) {
    created += Number(
      await createRecurringEvent("morning", nextYear, nextMonth, nextMonthYearMonth),
    );
  }

  if (nowEastern >= wednesdayAfterFourth) {
    created += Number(
      await createRecurringEvent("evening", nextYear, nextMonth, nextMonthYearMonth),
    );
  }

  return { created };
}
