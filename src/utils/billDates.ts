import {RecurringBill} from '../types';
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
