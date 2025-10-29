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

/**
 * Get current time in Eastern Time zone as a Date object
 */
export function getCurrentEasternTime(): Date {
  const now = new Date();
  // Create a new date that represents the current moment in Eastern Time
  return new Date(now.toLocaleString("en-US", {timeZone: EASTERN_TIMEZONE}));
}

/**
 * Convert any date to Eastern Time for consistent comparison
 */
export function convertToEasternTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.toLocaleString("en-US", {timeZone: EASTERN_TIMEZONE}));
}

/**
 * Get the nth occurrence of a specific weekday in a given month
 * @param year - The year
 * @param month - The month (1-12)
 * @param weekday - The day of week (0 = Sunday, 1 = Monday, ..., 2 = Tuesday)
 * @param occurrence - Which occurrence (1 = first, 2 = second, 4 = fourth, etc.)
 * @returns Date object for the nth occurrence of the weekday
 */
export function getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): Date {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)); // noon UTC
  const firstDow = firstOfMonth.getUTCDay(); // 0..6
  const offsetToWeekday = (weekday - firstDow + 7) % 7; // 0..6
  const day = 1 + offsetToWeekday + (occurrence - 1) * 7;

  // Construct the result ALSO at noon UTC (prevents timezone boundary issues)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Get the 2nd Tuesday of a specific month
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Date object for the 2nd Tuesday in Eastern Time
 */
export function getSecondTuesdayOfMonth(year: number, month: number): Date {
  return getNthWeekdayOfMonth(year, month, 2, 2); // 2 = Tuesday, 2 = second occurrence
}

/**
 * Get the 4th Tuesday of a specific month
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Date object for the 4th Tuesday in Eastern Time
 */
export function getFourthTuesdayOfMonth(year: number, month: number): Date {
  return getNthWeekdayOfMonth(year, month, 2, 4); // 2 = Tuesday, 4 = fourth occurrence
}

/**
 * Get the Wednesday after a specific date
 * @param date - The reference date
 * @returns Date object for the Wednesday after the given date
 */
export function getWednesdayAfter(date: Date): Date {
  const result = new Date(date);
  const daysUntilWednesday = (3 - result.getDay() + 7) % 7;
  
  // If the reference date is already Wednesday, get next Wednesday
  if (daysUntilWednesday === 0) {
    result.setDate(result.getDate() + 7);
  } else {
    result.setDate(result.getDate() + daysUntilWednesday);
  }
  
  return result;
}