import {
  addDays,
  subDays,
  isFriday,
  nextFriday,
  differenceInCalendarDays,
  isSameDay,
  startOfDay,
  format,
} from 'date-fns';

// ── Client 1: Semi-monthly (5th and 18th) ───────────────────

export function getClient1PayDates(
  year: number,
  month: number,
  count: number = 2,
): Date[] {
  const dates: Date[] = [];
  let y = year;
  let m = month;

  while (dates.length < count) {
    dates.push(new Date(y, m, 5));
    dates.push(new Date(y, m, 18));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return dates.slice(0, count);
}

export function getNextClient1PayDate(fromDate: Date): Date {
  const day = fromDate.getDate();
  const month = fromDate.getMonth();
  const year = fromDate.getFullYear();

  if (day <= 5) {
    return new Date(year, month, 5);
  }
  if (day <= 18) {
    return new Date(year, month, 18);
  }
  // Next month's 5th
  return month === 11
    ? new Date(year + 1, 0, 5)
    : new Date(year, month + 1, 5);
}

export function getClient1PeriodRange(payDate: Date): {
  start: Date;
  end: Date;
} {
  const day = payDate.getDate();
  const month = payDate.getMonth();
  const year = payDate.getFullYear();

  if (day === 5) {
    // Period: 19th of prev month to 4th of this month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return {
      start: new Date(prevYear, prevMonth, 19),
      end: new Date(year, month, 4),
    };
  }
  // day === 18: Period: 5th to 17th of this month
  return {
    start: new Date(year, month, 5),
    end: new Date(year, month, 17),
  };
}

export function isClient1PayDay(date: Date): boolean {
  const day = date.getDate();
  return day === 5 || day === 18;
}

// ── Client 2: Bi-weekly (every other Friday) ─────────────────

// Default anchor — user can update this in Settings
let client2AnchorFriday = new Date(2026, 3, 10); // April 10, 2026 (Friday)

export function setClient2Anchor(anchor: Date): void {
  client2AnchorFriday = startOfDay(anchor);
}

export function getClient2Anchor(): Date {
  return client2AnchorFriday;
}

export function isClient2PayDay(date: Date): boolean {
  if (!isFriday(date)) {
    return false;
  }
  const diff = Math.abs(
    differenceInCalendarDays(startOfDay(date), client2AnchorFriday),
  );
  return diff % 14 === 0;
}

export function getNextClient2PayDate(fromDate: Date): Date {
  let candidate = isFriday(fromDate) ? fromDate : nextFriday(fromDate);
  // Try up to 4 Fridays (max 2 iterations needed but safety margin)
  for (let i = 0; i < 4; i++) {
    if (isClient2PayDay(candidate)) {
      return candidate;
    }
    candidate = addDays(candidate, 7);
  }
  return candidate;
}

export function getClient2PeriodRange(payDate: Date): {
  start: Date;
  end: Date;
} {
  return {
    start: subDays(payDate, 13),
    end: payDate,
  };
}

// ── Combined helpers ─────────────────────────────────────────

export type PayDateInfo = {
  date: Date;
  type: 'client1' | 'client2';
  label: string;
  start: Date;
  end: Date;
};

export function getUpcomingPayDates(
  fromDate: Date,
  count: number = 4,
): PayDateInfo[] {
  const dates: PayDateInfo[] = [];

  // Get next several client1 dates
  let c1Date = getNextClient1PayDate(fromDate);
  for (let i = 0; i < count; i++) {
    const range = getClient1PeriodRange(c1Date);
    dates.push({
      date: c1Date,
      type: 'client1',
      label: `${format(c1Date, 'MMM d')} Pay`,
      start: range.start,
      end: range.end,
    });
    c1Date = getNextClient1PayDate(addDays(c1Date, 1));
  }

  // Get next several client2 dates
  let c2Date = getNextClient2PayDate(fromDate);
  for (let i = 0; i < count; i++) {
    const range = getClient2PeriodRange(c2Date);
    dates.push({
      date: c2Date,
      type: 'client2',
      label: `${format(c2Date, 'MMM d')} Pay (Fri)`,
      start: range.start,
      end: range.end,
    });
    c2Date = getNextClient2PayDate(addDays(c2Date, 1));
  }

  // Sort by date
  dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return dates.slice(0, count);
}

export function isPayDay(date: Date): boolean {
  return isClient1PayDay(date) || isClient2PayDay(date);
}

export function generatePeriodLabel(date: Date, type: 'client1' | 'client2' | 'special'): string {
  if (type === 'special') {
    return format(date, 'MMM d, yyyy');
  }
  const suffix = type === 'client2' ? ' (Fri)' : '';
  return `${format(date, 'MMM d')} Pay${suffix}`;
}
