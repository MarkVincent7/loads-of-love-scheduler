const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const defaultFromEmail =
  process.env.MAILERSEND_FROM_EMAIL || "info@christslovinghands.org";
const defaultFromName =
  process.env.MAILERSEND_FROM_NAME || "Christ's Loving Hands";

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!MAILERSEND_API_KEY) {
    console.warn("MAILERSEND_API_KEY not configured, skipping email");
    return false;
  }

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: defaultFromEmail,
          name: defaultFromName,
        },
        to: [{ email: params.to }],
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    if (!response.ok) {
      console.error("MailerSend email error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("MailerSend email error:", error);
    return false;
  }
}

export async function sendConfirmationEmail(details: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  cancelUrl: string;
  startTime?: Date;
  endTime?: Date;
}) {
  // Generate calendar buttons if start/end times are provided
  let calendarButtonsHTML = '';
  if (details.startTime && details.endTime) {
    const { generateCalendarButtonsHTML } = await import('./calendar-utils');
    calendarButtonsHTML = generateCalendarButtonsHTML({
      title: details.eventTitle,
      startTime: details.startTime,
      endTime: details.endTime,
      location: details.eventLocation,
      description: `Confirmed appointment for ${details.eventTitle}\n\nDate: ${details.eventDate}\nTime: ${details.eventTime}\nLocation: ${details.eventLocation}`
    });
  }

  const emailData = {
    to: details.email,
    subject: "Appointment Confirmed - Christ's Loving Hands Loads of Love",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Confirmed</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
          }
          .header { 
            background: #2563eb; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .cancel-link {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed!</h1>
            <p>Christ's Loving Hands - Loads of Love</p>
          </div>
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <p>Your appointment has been confirmed for our free laundry service!</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${details.cancelUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Cancel Appointment</a>
            </div>
            
            <div class="details">
              <h3>Appointment Details:</h3>
              <p><strong>Event:</strong> ${details.eventTitle}</p>
              <p><strong>Date:</strong> ${details.eventDate}</p>
              <p><strong>Time:</strong> ${details.eventTime}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <p><strong>What you get:</strong></p>
            <ul>
              <li><strong>3 loads of laundry for free</strong> - washing and drying included</li>
              <li>Free detergent and fabric softener provided</li>
              <li>Volunteer assistance with washing</li>
            </ul>
            
            <p><strong>What to bring:</strong></p>
            <ul>
              <li>Your laundry (up to 3 loads)</li>
              <li>This confirmation email or your name for check-in</li>
            </ul>
            
            <p><strong>Important notes:</strong></p>
            <ul>
              <li>Please arrive on time to ensure your slot</li>
              <li>Service is completely free - no payment required</li>
              <li>We'll have volunteers to help with washing</li>
              <li><strong>You must stay with your clothes during the entire washing and drying process</strong></li>
            </ul>
            
            ${calendarButtonsHTML}
            
            <p>If you need to cancel your appointment, please use the link below:</p>
            <a href="${details.cancelUrl}" class="cancel-link">Cancel Appointment</a>
            
            <div class="footer">
              <p>Thank you for letting us serve you!</p>
              <p>Christ's Loving Hands</p>
              <p>This is an automated message from Christ's Loving Hands Loads of Love program.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${details.name},

      Your appointment has been confirmed for our free laundry service!

      Appointment Details:
      Event: ${details.eventTitle}
      Date: ${details.eventDate}
      Time: ${details.eventTime}
      Location: ${details.eventLocation}

      What you get:
      - 3 loads of laundry for free - washing and drying included
      - Free detergent and fabric softener provided
      - Volunteer assistance with washing

      What to bring:
      - Your laundry (up to 3 loads)
      - This confirmation email or your name for check-in

      Important notes:
      - Please arrive on time to ensure your slot
      - Service is completely free - no payment required
      - We'll have volunteers to help with washing
      - You must stay with your clothes during the entire washing and drying process

      If you need to cancel your appointment, please visit: ${details.cancelUrl}

      Thank you for letting us serve you!
      Christ's Loving Hands

      This is an automated message from Christ's Loving Hands Loads of Love program.
    `
  };

  try {
    const success = await sendEmail(emailData);
    if (success) {
      console.log(`✓ Confirmation email sent to ${details.email}`);
    } else {
      console.error(`Failed to send confirmation email to ${details.email}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}

export async function sendSlotAvailableEmail(details: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  signUpUrl: string;
  removeFromWaitlistUrl: string;
}) {
  const emailData = {
    to: details.email,
    subject: "Slot Available! Act Fast - Christ's Loving Hands",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Slot Available</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
          }
          .header { 
            background: #16a34a; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .signup-link {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .remove-link {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
          .urgent {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 A Slot Opened Up!</h1>
            <p>Christ's Loving Hands - Loads of Love</p>
          </div>
          <div class="content">
            <p>Hi ${details.name},</p>
            
            <div class="urgent">
              <p><strong>Great news!</strong> A spot has opened up for the time slot you were waiting for. Click below to secure your spot!</p>
            </div>
            
            <div class="details">
              <h3>Available Time Slot:</h3>
              <p><strong>Event:</strong> ${details.eventTitle}</p>
              <p><strong>Date:</strong> ${details.eventDate}</p>
              <p><strong>Time:</strong> ${details.eventTime}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${details.signUpUrl}" class="signup-link">SIGN UP NOW</a>
            </div>
            
            <p><strong>Important:</strong> This slot is available on a first-come, first-served basis. Other people on the waitlist are also being notified, so please sign up quickly if you still want this appointment.</p>
            
            <p><strong>What to bring:</strong></p>
            <ul>
              <li>Your laundry (we provide detergent and fabric softener)</li>
              <li>Please arrive on time to ensure your slot</li>
            </ul>
            
            <p><strong>Important:</strong> You must stay with your clothes during the entire washing and drying process.</p>
            
            <p>If you no longer need this appointment, please remove yourself from the waitlist:</p>
            <a href="${details.removeFromWaitlistUrl}" class="remove-link">Remove from Waitlist</a>
            
            <div class="footer">
              <p>Thank you for your patience!</p>
              <p>Christ's Loving Hands</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${details.name},

      Great news! A spot has opened up for the time slot you were waiting for.

      Available Time Slot:
      Event: ${details.eventTitle}
      Date: ${details.eventDate}
      Time: ${details.eventTime}
      Location: ${details.eventLocation}

      SIGN UP NOW: ${details.signUpUrl}

      Important: This slot is available on a first-come, first-served basis. Other people on the waitlist are also being notified, so please sign up quickly if you still want this appointment.

      What to bring:
      - Your laundry (we provide detergent and fabric softener)
      - Please arrive on time to ensure your slot

      Important: You must stay with your clothes during the entire washing and drying process.

      If you no longer need this appointment, remove yourself from waitlist: ${details.removeFromWaitlistUrl}

      Thank you for your patience!
      Christ's Loving Hands
    `
  };

  try {
    const success = await sendEmail(emailData);
    if (success) {
      console.log(`✓ Slot available email sent to ${details.email}`);
    } else {
      console.error(`Failed to send slot available email to ${details.email}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send slot available email:", error);
    return false;
  }
}

export async function sendWaitlistPromotionEmail(details: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  cancelUrl: string;
}) {
  const emailData = {
    to: details.email,
    subject: "Great News! Your Waitlist Spot is Now Confirmed - Christ's Loving Hands",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Waitlist Spot Confirmed</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
          }
          .header { 
            background: #16a34a; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .cancel-link {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
          .highlight {
            background: #dcfce7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #16a34a;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Great News!</h1>
            <p>Your Waitlist Spot is Now Confirmed</p>
          </div>
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <div class="highlight">
              <p><strong>Excellent news!</strong> A spot has opened up and you've been moved from the waitlist to <strong>confirmed</strong> for our free laundry service!</p>
            </div>
            
            <div class="details">
              <h3>Your Confirmed Appointment:</h3>
              <p><strong>Event:</strong> ${details.eventTitle}</p>
              <p><strong>Date:</strong> ${details.eventDate}</p>
              <p><strong>Time:</strong> ${details.eventTime}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <p><strong>What to bring:</strong></p>
            <ul>
              <li>Your laundry (we provide detergent and fabric softener)</li>
              <li>This confirmation email or your name for check-in</li>
            </ul>
            
            <p><strong>Important notes:</strong></p>
            <ul>
              <li>Please arrive on time to ensure your slot</li>
              <li>Service is completely free - no payment required</li>
              <li>We'll have volunteers to help with washing and folding</li>
              <li><strong>You must stay with your clothes during the entire washing and drying process</strong></li>
            </ul>
            
            <p>If you can no longer make this appointment, please cancel as soon as possible so we can offer the spot to someone else on the waitlist:</p>
            <a href="${details.cancelUrl}" class="cancel-link">Cancel Appointment</a>
            
            <div class="footer">
              <p>Thank you for your patience, and we look forward to serving you!</p>
              <p>Christ's Loving Hands</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${details.name},

      Excellent news! A spot has opened up and you've been moved from the waitlist to CONFIRMED for our free laundry service!

      Your Confirmed Appointment:
      Event: ${details.eventTitle}
      Date: ${details.eventDate}
      Time: ${details.eventTime}
      Location: ${details.eventLocation}

      What to bring:
      - Your laundry (we provide detergent and fabric softener)
      - This confirmation email or your name for check-in

      Important notes:
      - Please arrive on time to ensure your slot
      - Service is completely free - no payment required
      - We'll have volunteers to help with washing and folding
      - You must stay with your clothes during the entire washing and drying process

      If you can no longer make this appointment, please visit: ${details.cancelUrl}

      Thank you for your patience, and we look forward to serving you!
      Christ's Loving Hands
    `
  };

  try {
    const success = await sendEmail(emailData);
    if (success) {
      console.log(`✓ Waitlist promotion email sent to ${details.email}`);
    } else {
      console.error(`Failed to send waitlist promotion email to ${details.email}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send waitlist promotion email:", error);
    return false;
  }
}

export async function sendWaitlistConfirmationEmail(details: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  cancelUrl: string;
  startTime?: Date;
  endTime?: Date;
}) {
  // Generate calendar buttons if start/end times are provided
  let calendarButtonsHTML = '';
  if (details.startTime && details.endTime) {
    const { generateCalendarButtonsHTML } = await import('./calendar-utils');
    calendarButtonsHTML = generateCalendarButtonsHTML({
      title: `${details.eventTitle} (Waitlist)`,
      startTime: details.startTime,
      endTime: details.endTime,
      location: details.eventLocation,
      description: `Waitlist reservation for ${details.eventTitle}\n\nDate: ${details.eventDate}\nTime: ${details.eventTime}\nLocation: ${details.eventLocation}\n\nNote: You are currently on the waitlist. You will be notified if a slot becomes available.`
    });
  }

  const emailData = {
    to: details.email,
    subject: "Waitlist Confirmation - Christ's Loving Hands Loads of Love",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Waitlist Confirmation</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
          }
          .header { 
            background: #f59e0b; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .cancel-link {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
          .highlight {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're on the Waitlist!</h1>
            <p>Christ's Loving Hands - Loads of Love</p>
          </div>
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <div class="highlight">
              <p><strong>You've been added to the waitlist!</strong> This time slot is currently full, but we'll notify you immediately if a spot opens up.</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${details.cancelUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave Waitlist</a>
            </div>
            
            <div class="details">
              <h3>Waitlist Details:</h3>
              <p><strong>Event:</strong> ${details.eventTitle}</p>
              <p><strong>Date:</strong> ${details.eventDate}</p>
              <p><strong>Time:</strong> ${details.eventTime}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>If someone cancels, you'll get an email confirming your spot</li>
              <li>You'll have priority based on when you joined the waitlist</li>
              <li>We'll send you notification as soon as a spot becomes available</li>
            </ul>
            
            <p><strong>What you'll get when confirmed:</strong></p>
            <ul>
              <li><strong>3 loads of laundry for free</strong> - washing and drying included</li>
              <li>Free detergent and fabric softener provided</li>
              <li>Volunteer assistance with washing</li>
            </ul>
            
            <p><strong>What to prepare:</strong></p>
            <ul>
              <li>Have your laundry ready (up to 3 loads)</li>
              <li>Be ready to respond quickly if a spot opens up</li>
              <li>Keep this confirmation for your records</li>
            </ul>
            
            ${calendarButtonsHTML}
            
            <p>If you need to leave the waitlist, please use the link below:</p>
            <a href="${details.cancelUrl}" class="cancel-link">Leave Waitlist</a>
            
            <div class="footer">
              <p>Thank you for your patience!</p>
              <p>Christ's Loving Hands</p>
              <p>This is an automated message from Christ's Loving Hands Loads of Love program.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${details.name},

      You've been added to the waitlist! This time slot is currently full, but we'll notify you immediately if a spot opens up.

      Waitlist Details:
      Event: ${details.eventTitle}
      Date: ${details.eventDate}
      Time: ${details.eventTime}
      Location: ${details.eventLocation}

      What happens next:
      - If someone cancels, you'll get an email confirming your spot
      - You'll have priority based on when you joined the waitlist
      - We'll send you notification as soon as a spot becomes available

      What you'll get when confirmed:
      - 3 loads of laundry for free - washing and drying included
      - Free detergent and fabric softener provided
      - Volunteer assistance with washing

      What to prepare:
      - Have your laundry ready (up to 3 loads)
      - Be ready to respond quickly if a spot opens up
      - Keep this confirmation for your records

      If you need to leave the waitlist, please visit: ${details.cancelUrl}

      Thank you for your patience!
      Christ's Loving Hands

      This is an automated message from Christ's Loving Hands Loads of Love program.
    `
  };

  try {
    const success = await sendEmail(emailData);
    if (success) {
      console.log(`✓ Waitlist confirmation email sent to ${details.email}`);
    } else {
      console.error(`Failed to send waitlist confirmation email to ${details.email}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send waitlist confirmation email:", error);
    return false;
  }
}

export async function sendReminderEmail(
  details: {
    name: string;
    email: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    cancelUrl: string;
  },
  reminderType: 'day-before' | 'hour-before' | 'evening-before'
) {
  let reminderTitle, reminderText;
  
  if (reminderType === 'day-before') {
    reminderTitle = 'Tomorrow';
    reminderText = 'This is a friendly reminder that your laundry appointment is tomorrow.';
  } else if (reminderType === 'evening-before') {
    reminderTitle = 'Tomorrow Morning';
    reminderText = 'This is a friendly reminder that your laundry appointment is tomorrow morning.';
  } else {
    reminderTitle = 'In 1 Hour';
    reminderText = 'This is a reminder that your laundry appointment is in 1 hour.';
  }

  const emailData = {
    to: details.email,
    subject: `Reminder: Laundry Appointment ${reminderTitle} - Christ's Loving Hands`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Reminder</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
          }
          .header { 
            background: #059669; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .cancel-link {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Reminder</h1>
            <p>Christ's Loving Hands - Loads of Love</p>
          </div>
          <div class="content">
            <p>Dear ${details.name},</p>
            
            <p>${reminderText}</p>
            
            <div class="details">
              <h3>Your Appointment:</h3>
              <p><strong>Event:</strong> ${details.eventTitle}</p>
              <p><strong>Date:</strong> ${details.eventDate}</p>
              <p><strong>Time:</strong> ${details.eventTime}</p>
              <p><strong>Location:</strong> ${details.eventLocation}</p>
            </div>
            
            <p><strong>Reminder:</strong></p>
            <ul>
              <li>Bring your laundry (detergent provided)</li>
              <li>Arrive on time to ensure your slot</li>
              <li>Service is completely free</li>
            </ul>
            
            <p>If you need to cancel, please use the link below:</p>
            <a href="${details.cancelUrl}" class="cancel-link">Cancel Appointment</a>
            
            <div class="footer">
              <p>We look forward to serving you!</p>
              <p>Christ's Loving Hands</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${details.name},

      ${reminderText}

      Your Appointment:
      Event: ${details.eventTitle}
      Date: ${details.eventDate}
      Time: ${details.eventTime}
      Location: ${details.eventLocation}

      Reminder:
      - Bring your laundry (detergent provided)
      - Arrive on time to ensure your slot
      - Service is completely free

      If you need to cancel, please visit: ${details.cancelUrl}

      We look forward to serving you!
      Christ's Loving Hands
      Showing God's love through practical service
    `
  };

  try {
    const success = await sendEmail(emailData);
    if (success) {
      console.log(`✓ ${reminderType} reminder email sent to ${details.email}`);
    } else {
      console.error(`Failed to send ${reminderType} reminder email to ${details.email}`);
    }
    return success;
  } catch (error) {
    console.error(`Failed to send ${reminderType} reminder email:`, error);
    return false;
  }
}
