import {RecurringBill, PayPeriod} from '../types';
import {
  getDaysInMonth,
  isToday,
  isThisWeek,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
} from 'date-fns';

export interface BillWithDueDate extends RecurringBill {
  dueDate: Date;
}

function toPayDate(period: PayPeriod): Date | null {
  const ts: any = period.payDate;
  if (ts?._date instanceof Date) return ts._date;
  if (typeof ts?.toDate === 'function') return ts.toDate();
  return null;
}

// Given a bill and a snapshot of all pay periods, return the pay period
// that "owns" this bill for the calendar month containing `targetMonth`.
//
// Rule: among same-client pay periods in that month, pick the one with
// the largest payDate.day that is <= bill.dueDay (so the paycheck arrives
// on or before the bill is due). If every payday in that month falls
// after the due day, fall back to the earliest payday so the bill at least
// lands somewhere instead of vanishing.
//
// Returns null when the month has no matching pay periods.
export function findPayPeriodForBill(
  bill: RecurringBill,
  allPayPeriods: PayPeriod[],
  targetMonth: Date,
): PayPeriod | null {
  const candidates = allPayPeriods.filter(p => {
    if (bill.clientType && p.type !== bill.clientType) return false;
    const pd = toPayDate(p);
    return !!pd && isSameMonth(pd, targetMonth);
  });
  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) => toPayDate(a)!.getTime() - toPayDate(b)!.getTime(),
  );

  let best: PayPeriod | null = null;
  for (const p of candidates) {
    if (toPayDate(p)!.getDate() <= bill.dueDay) best = p;
  }
  return best ?? candidates[0];
}

export type FilterPeriod = 'today' | 'week' | 'month';

export function getBillDueDate(dueDay: number, referenceDate: Date): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const maxDay = getDaysInMonth(referenceDate);
  const day = Math.min(dueDay, maxDay);
  return new Date(year, month, day);
}

export function filterBillsByPeriod(
  bills: RecurringBill[],
  period: FilterPeriod,
  referenceDate: Date = new Date(),
): BillWithDueDate[] {
  const activeBills = bills.filter(b => b.isActive);

  const billsWithDates: BillWithDueDate[] = [];

  for (const bill of activeBills) {
    const dueDate = getBillDueDate(bill.dueDay, referenceDate);

    if (period === 'today' && isToday(dueDate)) {
      billsWithDates.push({...bill, dueDate});
    } else if (period === 'month' && isSameMonth(dueDate, referenceDate)) {
      billsWithDates.push({...bill, dueDate});
    } else if (period === 'week') {
      const weekStart = startOfWeek(referenceDate, {weekStartsOn: 1});
      const weekEnd = endOfWeek(referenceDate, {weekStartsOn: 1});

      // Check current month's due date
      if (isThisWeek(dueDate, {weekStartsOn: 1})) {
        billsWithDates.push({...bill, dueDate});
      } else if (weekStart.getMonth() !== weekEnd.getMonth()) {
        // Week spans month boundary — check adjacent month
        const adjacentMonth =
          weekEnd.getMonth() !== referenceDate.getMonth()
            ? addMonths(referenceDate, 1)
            : subMonths(referenceDate, 1);
        const adjacentDueDate = getBillDueDate(bill.dueDay, adjacentMonth);
        if (adjacentDueDate >= weekStart && adjacentDueDate <= weekEnd) {
          billsWithDates.push({...bill, dueDate: adjacentDueDate});
        }
      }
    }
  }

  return billsWithDates.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getBillIcon(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('card') || desc.includes('credit') || desc.includes('atome')) return '💳';
  if (desc.includes('house') || desc.includes('rent') || desc.includes('mortgage')) return '🏠';
  if (desc.includes('electric') || desc.includes('meralco') || desc.includes('power')) return '⚡';
  if (desc.includes('water') || desc.includes('maynilad')) return '💧';
  if (desc.includes('internet') || desc.includes('wifi') || desc.includes('pldt') || desc.includes('globe')) return '🌐';
  if (desc.includes('phone') || desc.includes('mobile')) return '📱';
  if (desc.includes('insurance')) return '🛡️';
  if (desc.includes('loan')) return '🏦';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('subscription') || desc.includes('youtube')) return '📺';
  if (desc.includes('grocery') || desc.includes('food')) return '🛒';
  return '🧾';
}

export function formatFrequency(frequency: string): string {
  switch (frequency) {
    case 'monthly': return 'Monthly';
    case 'semi-monthly': return 'Semi-Monthly';
    case 'bi-weekly': return 'Bi-Weekly';
    default: return frequency;
  }
}

export function formatDueLabel(bill: BillWithDueDate): string {
  return `${formatFrequency(bill.frequency)} · Due ${format(bill.dueDate, 'MMM d')}`;
}
