import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// Default sender email using ChristsLovingHands.org domain
const defaultFromEmail = "info@ChristsLovingHands.org";
const defaultFromName = "Christ's Loving Hands";

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: {
        email: defaultFromEmail,
        name: defaultFromName
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
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
}) {
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
            
            <div class="details">
              <h3>Appointment Details:</h3>
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
            </ul>
            
            <p>If you need to cancel your appointment, please use the link below:</p>
            <a href="${details.cancelUrl}" class="cancel-link">Cancel Appointment</a>
            
            <div class="footer">
              <p>Thank you for letting us serve you!</p>
              <p>Christ's Loving Hands<br>
              <em>Showing God's love through practical service</em></p>
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

      What to bring:
      - Your laundry (we provide detergent and fabric softener)
      - This confirmation email or your name for check-in

      Important notes:
      - Please arrive on time to ensure your slot
      - Service is completely free - no payment required
      - We'll have volunteers to help with washing and folding

      If you need to cancel your appointment, please visit: ${details.cancelUrl}

      Thank you for letting us serve you!
      Christ's Loving Hands
      Showing God's love through practical service

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
  reminderType: 'day-before' | 'hour-before'
) {
  const reminderTitle = reminderType === 'day-before' ? 'Tomorrow' : 'In 1 Hour';
  const reminderText = reminderType === 'day-before' 
    ? 'This is a friendly reminder that your laundry appointment is tomorrow.'
    : 'This is a reminder that your laundry appointment is in 1 hour.';

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
              <p>Christ's Loving Hands<br>
              <em>Showing God's love through practical service</em></p>
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