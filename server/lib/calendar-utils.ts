import { formatEmailDate, formatEmailTime, EASTERN_TIMEZONE } from '@shared/timezone';

interface CalendarEventData {
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  location: string;
  description?: string;
}

/**
 * Generate Google Calendar URL for adding event
 */
export function generateGoogleCalendarUrl(eventData: CalendarEventData): string {
  const { title, startTime, endTime, location, description } = eventData;
  
  // Convert to Date objects if strings
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format in UTC)
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const startFormatted = formatGoogleDate(start);
  const endFormatted = formatGoogleDate(end);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    location: location,
    details: description || `Event: ${title}\nLocation: ${location}`
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL for adding event
 */
export function generateOutlookCalendarUrl(eventData: CalendarEventData): string {
  const { title, startTime, endTime, location, description } = eventData;
  
  // Convert to Date objects if strings
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Format dates for Outlook (ISO format)
  const startFormatted = start.toISOString();
  const endFormatted = end.toISOString();
  
  const params = new URLSearchParams({
    subject: title,
    startdt: startFormatted,
    enddt: endFormatted,
    location: location,
    body: description || `Event: ${title}\nLocation: ${location}`
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL for adding event
 */
export function generateYahooCalendarUrl(eventData: CalendarEventData): string {
  const { title, startTime, endTime, location, description } = eventData;
  
  // Convert to Date objects if strings
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Calculate duration in hours
  const durationMs = end.getTime() - start.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = durationHours > 0 ? `${durationHours}${durationMinutes > 0 ? durationMinutes.toString().padStart(2, '0') : '00'}` : `00${durationMinutes.toString().padStart(2, '0')}`;
  
  // Format start time for Yahoo (YYYYMMDDTHHMMSSZ)
  const startFormatted = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const params = new URLSearchParams({
    v: '60',
    title: title,
    st: startFormatted,
    dur: duration,
    in_loc: location,
    desc: description || `Event: ${title}\nLocation: ${location}`
  });
  
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Generate ICS file content for download
 */
export function generateICSFile(eventData: CalendarEventData): string {
  const { title, startTime, endTime, location, description } = eventData;
  
  // Convert to Date objects if strings
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ format in UTC)
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const startFormatted = formatICSDate(start);
  const endFormatted = formatICSDate(end);
  const now = formatICSDate(new Date());
  
  // Generate unique UID
  const uid = `${startFormatted}-${Math.random().toString(36).substr(2, 9)}@christslovinghands.org`;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Christ\'s Loving Hands//Loads of Love//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description || `Event: ${title}\\nLocation: ${location}`}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

/**
 * Generate calendar button HTML for emails
 */
export function generateCalendarButtonsHTML(eventData: CalendarEventData): string {
  const googleUrl = generateGoogleCalendarUrl(eventData);
  const outlookUrl = generateOutlookCalendarUrl(eventData);
  const yahooUrl = generateYahooCalendarUrl(eventData);
  
  return `
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px;">
        📅 Add to Your Calendar
      </p>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
        <a href="${googleUrl}" target="_blank" style="background-color: #4285f4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; min-width: 120px; text-align: center;">
          Google Calendar
        </a>
        <a href="${outlookUrl}" target="_blank" style="background-color: #0078d4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; min-width: 120px; text-align: center;">
          Outlook
        </a>
        <a href="${yahooUrl}" target="_blank" style="background-color: #7b68ee; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; min-width: 120px; text-align: center;">
          Yahoo
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
        Click any button above to add this appointment to your calendar
      </p>
    </div>
  `;
}