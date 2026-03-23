import type { Event, Registration, TimeSlot } from "@shared/schema";
import { formatEmailDate, formatEmailTime } from "@shared/timezone";
import { sendEmail } from "./sendgrid";

const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAILS ||
  "Mark@ChristsLovingHands.org,Melanie@ChristsLovingHands.org")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

interface NotificationData {
  registration: Registration;
  event: Event;
  timeSlot: TimeSlot;
}

async function sendAdminNotification(subject: string, html: string) {
  await Promise.all(
    ADMIN_EMAILS.map(async (email) => {
      try {
        await sendEmail({ to: email, subject, html });
      } catch (error) {
        console.error(`Failed to send admin email to ${email}:`, error);
      }
    }),
  );
}

function buildEventDetails(event: Event, timeSlot: TimeSlot) {
  return {
    eventDate: formatEmailDate(timeSlot.startTime),
    eventTime: `${formatEmailTime(timeSlot.startTime)} - ${formatEmailTime(timeSlot.endTime)}`,
    eventLocation: event.laundromatName
      ? `${event.laundromatName}${event.laundromatAddress ? `, ${event.laundromatAddress}` : ""}`
      : event.location,
  };
}

export async function sendNewRegistrationNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  const details = buildEventDetails(event, timeSlot);

  await sendAdminNotification(
    `New Registration: ${event.title}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Registration Received</h2>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${details.eventDate}</p>
        <p><strong>Time:</strong> ${details.eventTime}</p>
        <p><strong>Location:</strong> ${details.eventLocation}</p>
        <hr />
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ""}
        ${registration.address ? `<p><strong>Address:</strong> ${registration.address}${registration.city ? `, ${registration.city}` : ""}${registration.state ? `, ${registration.state}` : ""}${registration.zipCode ? ` ${registration.zipCode}` : ""}</p>` : ""}
        <p><strong>Status:</strong> ${registration.status.toUpperCase()}</p>
      </div>
    `,
  );
}

export async function sendCancellationNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  const details = buildEventDetails(event, timeSlot);

  await sendAdminNotification(
    `Registration Cancelled: ${event.title}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Registration Cancelled</h2>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${details.eventDate}</p>
        <p><strong>Time:</strong> ${details.eventTime}</p>
        <p><strong>Location:</strong> ${details.eventLocation}</p>
        <hr />
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ""}
        <p><strong>Status:</strong> ${registration.status.toUpperCase()}</p>
      </div>
    `,
  );
}

export async function sendWaitlistNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  const details = buildEventDetails(event, timeSlot);

  await sendAdminNotification(
    `Waitlist Addition: ${event.title}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">New Waitlist Registration</h2>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${details.eventDate}</p>
        <p><strong>Time:</strong> ${details.eventTime}</p>
        <p><strong>Location:</strong> ${details.eventLocation}</p>
        <hr />
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ""}
        <p><strong>Status:</strong> WAITLIST</p>
      </div>
    `,
  );
}
