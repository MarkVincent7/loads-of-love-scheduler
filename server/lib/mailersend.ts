import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

// Default sender email - you may want to configure this
const defaultSender = new Sender("noreply@your-domain.com", "Christ's Loving Hands");

export interface AppointmentDetails {
  name: string;
  email: string;
  eventTitle: string;
  eventLocation: string;
  startTime: string;
  endTime: string;
  cancelToken: string;
}

export async function sendConfirmationEmail(details: AppointmentDetails) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.log("MailerSend API key not configured, skipping email");
    return;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const recipients = [new Recipient(details.email, details.name)];

  const emailParams = new EmailParams()
    .setFrom(defaultSender)
    .setTo(recipients)
    .setSubject("Appointment Confirmed - Christ's Loving Hands Loads of Love")
    .setHtml(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed!</h1>
            <p>Your laundry appointment has been scheduled</p>
          </div>
          
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <p>Thank you for registering! Your appointment for <strong>${details.eventTitle}</strong> has been confirmed.</p>
            
            <div class="appointment-box">
              <h3>📅 Appointment Details</h3>
              <p><strong>Date:</strong> ${formatDate(details.startTime)}</p>
              <p><strong>Time:</strong> ${formatTime(details.startTime)} - ${formatTime(details.endTime)}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <h3>⚠️ Important Reminders:</h3>
            <ul>
              <li>Please arrive on time for your appointment</li>
              <li>Bring your laundry and any needed supplies</li>
              <li>Have transportation arranged to the location</li>
              <li>Cancel within 24 hours if you can't make it to avoid being restricted from future events</li>
            </ul>
            
            <p>If you need to cancel your appointment, please use the link below:</p>
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/cancel/${details.cancelToken}" class="button">Cancel Appointment</a>
            
            <div class="footer">
              <p>This is an automated message from Christ's Loving Hands Loads of Love program.</p>
              <p>If you have questions, please contact us.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    .setText(`
      Appointment Confirmed - Christ's Loving Hands Loads of Love
      
      Dear ${details.name},
      
      Thank you for registering! Your appointment for ${details.eventTitle} has been confirmed.
      
      APPOINTMENT DETAILS:
      Date: ${formatDate(details.startTime)}
      Time: ${formatTime(details.startTime)} - ${formatTime(details.endTime)}
      Location: ${details.eventLocation}
      
      IMPORTANT REMINDERS:
      - Please arrive on time for your appointment
      - Bring your laundry and any needed supplies
      - Have transportation arranged to the location
      - Cancel within 24 hours if you can't make it to avoid being restricted from future events
      
      To cancel your appointment, visit: ${process.env.BASE_URL || 'http://localhost:5000'}/cancel/${details.cancelToken}
      
      This is an automated message from Christ's Loving Hands Loads of Love program.
    `);

  try {
    await mailerSend.email.send(emailParams);
    console.log(`Confirmation email sent to ${details.email}`);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }
}

export async function sendReminderEmail(details: AppointmentDetails, reminderType: 'day-before' | 'morning-of') {
  if (!process.env.MAILERSEND_API_KEY) {
    console.log("MailerSend API key not configured, skipping reminder email");
    return;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isToday = reminderType === 'morning-of';
  const subject = isToday 
    ? "Reminder: Your laundry appointment is TODAY"
    : "Reminder: Your laundry appointment is TOMORROW";

  const recipients = [new Recipient(details.email, details.name)];

  const emailParams = new EmailParams()
    .setFrom(defaultSender)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isToday ? '#dc2626' : '#2563eb'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isToday ? '#dc2626' : '#2563eb'}; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isToday ? '🔔 Today is the Day!' : '📅 Tomorrow\'s Reminder'}</h1>
            <p>Your laundry appointment is ${isToday ? 'today' : 'tomorrow'}</p>
          </div>
          
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <p>This is a friendly reminder about your upcoming appointment for <strong>${details.eventTitle}</strong>.</p>
            
            <div class="appointment-box">
              <h3>📅 Appointment Details</h3>
              <p><strong>Date:</strong> ${formatDate(details.startTime)}</p>
              <p><strong>Time:</strong> ${formatTime(details.startTime)} - ${formatTime(details.endTime)}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            ${isToday ? `
              <h3>🚨 Today's Checklist:</h3>
              <ul>
                <li>✅ Gather your laundry and supplies</li>
                <li>✅ Confirm your transportation</li>
                <li>✅ Plan to arrive on time</li>
                <li>✅ Bring this confirmation if needed</li>
              </ul>
            ` : `
              <h3>📋 Get Ready for Tomorrow:</h3>
              <ul>
                <li>Gather your laundry and any needed supplies</li>
                <li>Confirm your transportation arrangements</li>
                <li>Set a reminder to leave on time</li>
                <li>If you can't make it, cancel within 24 hours</li>
              </ul>
            `}
            
            <p>If you need to cancel your appointment, please use the link below:</p>
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/cancel/${details.cancelToken}" class="button">Cancel Appointment</a>
            
            <div class="footer">
              <p>This is an automated reminder from Christ's Loving Hands Loads of Love program.</p>
              <p>We look forward to serving you!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    .setText(`
      ${subject}
      
      Dear ${details.name},
      
      This is a friendly reminder about your upcoming appointment for ${details.eventTitle}.
      
      APPOINTMENT DETAILS:
      Date: ${formatDate(details.startTime)}
      Time: ${formatTime(details.startTime)} - ${formatTime(details.endTime)}
      Location: ${details.eventLocation}
      
      ${isToday ? 'TODAY\'S CHECKLIST:' : 'GET READY FOR TOMORROW:'}
      - Gather your laundry and any needed supplies
      - Confirm your transportation arrangements
      - ${isToday ? 'Plan to arrive on time' : 'Set a reminder to leave on time'}
      - ${isToday ? 'Bring this confirmation if needed' : 'If you can\'t make it, cancel within 24 hours'}
      
      To cancel your appointment, visit: ${process.env.BASE_URL || 'http://localhost:5000'}/cancel/${details.cancelToken}
      
      This is an automated reminder from Christ's Loving Hands Loads of Love program.
      We look forward to serving you!
    `);

  try {
    await mailerSend.email.send(emailParams);
    console.log(`${reminderType} reminder email sent to ${details.email}`);
  } catch (error) {
    console.error(`Failed to send ${reminderType} reminder email:`, error);
  }
}