import { Registration, TimeSlot } from "@shared/schema";

const VOIP_API_KEY = process.env.VOIP_API_KEY;
const VOIP_API_URL = process.env.VOIP_API_URL;
const CLH_PHONE_NUMBER = process.env.CLH_PHONE_NUMBER || "(555) 123-4567";

export async function sendConfirmationSMS(registration: Registration, timeSlot: TimeSlot): Promise<void> {
  if (!VOIP_API_KEY || !VOIP_API_URL) {
    console.warn("VOIP API not configured, skipping SMS");
    return;
  }

  try {
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`;
    
    const message = `Hi ${registration.name}! Your Loads of Love registration is confirmed for ${timeSlot.startTime.toLocaleDateString()} at ${timeSlot.startTime.toLocaleTimeString()}. Cancel: ${cancelUrl}`;
    
    const smsData = {
      to: registration.phone,
      message,
      from: CLH_PHONE_NUMBER
    };

    const response = await fetch(VOIP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      throw new Error(`VOIP API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending confirmation SMS:", error);
    throw error;
  }
}

export async function sendReminderSMS(registration: Registration, timeSlot: TimeSlot, type: 'day_before' | 'day_of'): Promise<void> {
  if (!VOIP_API_KEY || !VOIP_API_URL) {
    console.warn("VOIP API not configured, skipping SMS");
    return;
  }

  try {
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`;
    const timeText = type === 'day_before' ? 'tomorrow' : 'today';
    
    const message = `Reminder: Loads of Love ${timeText} at ${timeSlot.startTime.toLocaleTimeString()}. Cancel: ${cancelUrl}`;
    
    const smsData = {
      to: registration.phone,
      message,
      from: CLH_PHONE_NUMBER
    };

    const response = await fetch(VOIP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      throw new Error(`VOIP API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending reminder SMS:", error);
    throw error;
  }
}

export async function sendWaitlistPromotionSMS(registration: Registration, timeSlot: TimeSlot): Promise<void> {
  if (!VOIP_API_KEY || !VOIP_API_URL) {
    console.warn("VOIP API not configured, skipping SMS");
    return;
  }

  try {
    const message = `Great news ${registration.name}! A spot opened up for Loads of Love on ${timeSlot.startTime.toLocaleDateString()} at ${timeSlot.startTime.toLocaleTimeString()}. You have 30 minutes to confirm. Reply YES to confirm.`;
    
    const smsData = {
      to: registration.phone,
      message,
      from: CLH_PHONE_NUMBER
    };

    const response = await fetch(VOIP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      throw new Error(`VOIP API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending waitlist promotion SMS:", error);
    throw error;
  }
}
