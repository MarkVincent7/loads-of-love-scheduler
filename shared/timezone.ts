// Eastern Time zone identifier
export const EASTERN_TIMEZONE = 'America/New_York';

/**
 * Create a Date object from local date input (YYYY-MM-DD) without timezone conversion
 */
export function createEasternDate(dateString: string, hours = 0, minutes = 0): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date object that will be interpreted as local time
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Format date for email display in Eastern Time
 */
export function formatEmailDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    timeZone: EASTERN_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time for email display in Eastern Time
 */
export function formatEmailTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    timeZone: EASTERN_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for HTML date input (YYYY-MM-DD) from Eastern Time
 */
export function formatForDateInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-CA', {
    timeZone: EASTERN_TIMEZONE
  });
}

/**
 * Format time for HTML time input (HH:mm) from Eastern Time
 */
export function formatForTimeInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', {
    timeZone: EASTERN_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}