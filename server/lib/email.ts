import { Registration, TimeSlot } from "@shared/schema";

// MailerSend configuration
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@christslovinghands.org";

export async function sendConfirmationEmail(registration: Registration, timeSlot: TimeSlot): Promise<void> {
  if (!MAILERSEND_API_KEY) {
    console.warn("MailerSend API key not configured, skipping email");
    return;
  }

  try {
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`;
    
    const emailData = {
      from: {
        email: FROM_EMAIL,
        name: "Christ's Loving Hands"
      },
      to: [{
        email: registration.email,
        name: registration.name
      }],
      subject: "Loads of Love Registration Confirmed",
      html: `
        <h2>Registration Confirmed!</h2>
        <p>Hi ${registration.name},</p>
        <p>Your registration for Loads of Love has been confirmed:</p>
        <ul>
          <li><strong>Date:</strong> ${timeSlot.startTime.toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${timeSlot.startTime.toLocaleTimeString()} - ${timeSlot.endTime.toLocaleTimeString()}</li>
        </ul>
        <p>If you need to cancel, <a href="${cancelUrl}">click here</a>.</p>
        <p>Christ's Loving Hands<br>
        Loads of Love Program</p>
      `,
      text: `
        Registration Confirmed!
        
        Hi ${registration.name},
        
        Your registration for Loads of Love has been confirmed:
        Date: ${timeSlot.startTime.toLocaleDateString()}
        Time: ${timeSlot.startTime.toLocaleTimeString()} - ${timeSlot.endTime.toLocaleTimeString()}
        
        Cancel link: ${cancelUrl}
        
        Christ's Loving Hands
        Loads of Love Program
      `
    };

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`MailerSend API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
}

export async function sendReminderEmail(registration: Registration, timeSlot: TimeSlot, type: 'day_before' | 'day_of'): Promise<void> {
  if (!MAILERSEND_API_KEY) {
    console.warn("MailerSend API key not configured, skipping email");
    return;
  }

  try {
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`;
    const subject = type === 'day_before' 
      ? "Reminder: Loads of Love Tomorrow"
      : "Reminder: Loads of Love Today";
    
    const emailData = {
      from: {
        email: FROM_EMAIL,
        name: "Christ's Loving Hands"
      },
      to: [{
        email: registration.email,
        name: registration.name
      }],
      subject,
      html: `
        <h2>${subject}</h2>
        <p>Hi ${registration.name},</p>
        <p>This is a reminder about your Loads of Love registration:</p>
        <ul>
          <li><strong>Date:</strong> ${timeSlot.startTime.toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${timeSlot.startTime.toLocaleTimeString()} - ${timeSlot.endTime.toLocaleTimeString()}</li>
        </ul>
        <p>If you need to cancel, <a href="${cancelUrl}">click here</a>.</p>
        <p>Christ's Loving Hands<br>
        Loads of Love Program</p>
      `
    };

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`MailerSend API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}
