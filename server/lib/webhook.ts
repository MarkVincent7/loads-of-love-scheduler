import { storage } from "../storage";
import type { Registration, Event, TimeSlot } from "@shared/schema";
import { formatEmailDate, formatEmailTime } from "../../shared/timezone";

export interface WebhookPayload {
  event: string;
  data: {
    registrationId: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    status: string;
    cancelUrl: string;
  };
}

export async function sendWebhook(
  registration: Registration,
  event: Event,
  timeSlot: TimeSlot
): Promise<void> {
  try {
    const config = await storage.getWebhookConfig();
    
    if (!config || !config.webhookUrl || config.enabled !== 1) {
      console.log('Webhook not configured or disabled, skipping');
      return;
    }

    const eventDate = formatEmailDate(timeSlot.startTime);
    const startTime = formatEmailTime(timeSlot.startTime);
    const endTime = formatEmailTime(timeSlot.endTime);
    
    const payload: WebhookPayload = {
      event: 'registration.created',
      data: {
        registrationId: registration.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone || undefined,
        address: registration.address || undefined,
        city: registration.city || undefined,
        state: registration.state || undefined,
        zipCode: registration.zipCode || undefined,
        eventTitle: event.title,
        eventDate: eventDate,
        eventTime: `${startTime} - ${endTime}`,
        eventLocation: event.laundromatName ? 
          `${event.laundromatName}${event.laundromatAddress ? ', ' + event.laundromatAddress : ''}` : 
          event.location,
        status: registration.status,
        cancelUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/cancel/${registration.uniqueCancelToken}`
      }
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadsOfLove-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Webhook failed with status ${response.status}: ${await response.text()}`);
    } else {
      console.log(`✓ Webhook sent successfully to ${config.webhookUrl}`);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}
