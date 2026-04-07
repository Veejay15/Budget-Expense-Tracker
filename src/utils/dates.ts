import {format, isToday, isTomorrow, isYesterday} from 'date-fns';

// Works with both Firebase Timestamp and MockTimestamp
// Both have a toDate() method
interface TimestampLike {
  toDate(): Date;
}

export function formatDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d, yyyy');
}

export function formatShortDate(date: Date): string {
  return format(date, 'MMM d');
}

export function formatDateRange(start: Date, end: Date): string {
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}

export function timestampToDate(timestamp: TimestampLike): Date {
  return timestamp.toDate();
}
