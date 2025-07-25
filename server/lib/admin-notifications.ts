import { MailService } from '@sendgrid/mail';
import type { Registration, Event, TimeSlot } from '@shared/schema';
import { formatEmailDate, formatEmailTime } from '@shared/timezone';

// Admin notification email addresses
const ADMIN_EMAILS = [
  'Mark@ChristsLovingHands.org',
  'Melanie@ChristsLovingHands.org'
];

const FROM_EMAIL = 'info@ChristsLovingHands.org';

interface NotificationData {
  registration: Registration;
  event: Event;  
  timeSlot: TimeSlot;
}

/**
 * Send notification to admins about new registration
 */
export async function sendNewRegistrationNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  
  const eventDate = formatEmailDate(timeSlot.startTime);
  const eventTime = `${formatEmailTime(timeSlot.startTime)} - ${formatEmailTime(timeSlot.endTime)}`;
  
  const subject = `New Registration: ${event.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Registration Received</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Event Details</h3>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${eventTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Registrant Information</h3>
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ''}
        ${registration.address ? `<p><strong>Address:</strong> ${registration.address}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: ${registration.status === 'confirmed' ? '#059669' : '#d97706'}; font-weight: bold;">${registration.status.toUpperCase()}</span></p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated notification from the Loads of Love registration system.
      </p>
    </div>
  `;
  
  // Initialize SendGrid
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
  
  // Send to all admin emails
  for (const adminEmail of ADMIN_EMAILS) {
    try {
      await mailService.send({
        to: adminEmail,
        from: FROM_EMAIL,
        subject,
        html
      });
    } catch (error) {
      console.error(`Failed to send new registration notification to ${adminEmail}:`, error);
    }
  }
}

/**
 * Send notification to admins about registration cancellation
 */
export async function sendCancellationNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  
  const eventDate = formatEmailDate(timeSlot.startTime);
  const eventTime = `${formatEmailTime(timeSlot.startTime)} - ${formatEmailTime(timeSlot.endTime)}`;
  
  const subject = `Registration Cancelled: ${event.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Registration Cancelled</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Event Details</h3>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${eventTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
      </div>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #dc2626;">Cancelled Registration</h3>
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ''}
        <p><strong>Previous Status:</strong> ${registration.status.toUpperCase()}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated notification from the Loads of Love registration system.
      </p>
    </div>
  `;
  
  // Initialize SendGrid
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
  
  // Send to all admin emails
  for (const adminEmail of ADMIN_EMAILS) {
    try {
      await mailService.send({
        to: adminEmail,
        from: FROM_EMAIL,
        subject,
        html
      });
    } catch (error) {
      console.error(`Failed to send cancellation notification to ${adminEmail}:`, error);
    }
  }
}

/**
 * Send notification to admins about waitlist addition
 */
export async function sendWaitlistNotification(data: NotificationData) {
  const { registration, event, timeSlot } = data;
  
  const eventDate = formatEmailDate(timeSlot.startTime);
  const eventTime = `${formatEmailTime(timeSlot.startTime)} - ${formatEmailTime(timeSlot.endTime)}`;
  
  const subject = `Waitlist Addition: ${event.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d97706;">New Waitlist Registration</h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Event Details</h3>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${eventTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
      </div>
      
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #d97706;">Waitlist Registration</h3>
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ''}
        ${registration.address ? `<p><strong>Address:</strong> ${registration.address}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">WAITLIST</span></p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          <strong>Note:</strong> This person will be notified when a slot becomes available and can then complete their registration.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated notification from the Loads of Love registration system.
      </p>
    </div>
  `;
  
  // Initialize SendGrid
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
  
  // Send to all admin emails
  for (const adminEmail of ADMIN_EMAILS) {
    try {
      await mailService.send({
        to: adminEmail,
        from: FROM_EMAIL,
        subject,
        html
      });
    } catch (error) {
      console.error(`Failed to send waitlist notification to ${adminEmail}:`, error);
    }
  }
}