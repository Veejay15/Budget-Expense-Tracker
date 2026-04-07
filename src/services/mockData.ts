import {PayPeriod, Expense, RecurringBill} from '../types';

// A lightweight Timestamp-like object for mock data
export class MockTimestamp {
  private _date: Date;

  constructor(date: Date) {
    this._date = date;
  }

  toDate(): Date {
    return this._date;
  }

  static now(): MockTimestamp {
    return new MockTimestamp(new Date());
  }

  static fromDate(date: Date): MockTimestamp {
    return new MockTimestamp(date);
  }
}

let nextId = 100;
function genId(): string {
  return `mock_${nextId++}`;
}

// ── In-memory stores ─────────────────────────────────────────

let payPeriods: PayPeriod[] = [
  {
    id: 'pp1',
    label: 'Apr 5 Pay',
    type: 'client1',
    startDate: MockTimestamp.fromDate(new Date(2026, 2, 19)) as any,
    endDate: MockTimestamp.fromDate(new Date(2026, 3, 4)) as any,
    payDate: MockTimestamp.fromDate(new Date(2026, 3, 5)) as any,
    salary: 28000,
    createdBy: 'mock_user',
    createdAt: MockTimestamp.now() as any,
    updatedAt: MockTimestamp.now() as any,
  },
  {
    id: 'pp2',
    label: 'Apr 10 Pay (Fri)',
    type: 'client2',
    startDate: MockTimestamp.fromDate(new Date(2026, 2, 28)) as any,
    endDate: MockTimestamp.fromDate(new Date(2026, 3, 10)) as any,
    payDate: MockTimestamp.fromDate(new Date(2026, 3, 10)) as any,
    salary: 25000,
    createdBy: 'mock_user',
    createdAt: MockTimestamp.now() as any,
    updatedAt: MockTimestamp.now() as any,
  },
  {
    id: 'pp3',
    label: 'Apr 18 Pay',
    type: 'client1',
    startDate: MockTimestamp.fromDate(new Date(2026, 3, 5)) as any,
    endDate: MockTimestamp.fromDate(new Date(2026, 3, 17)) as any,
    payDate: MockTimestamp.fromDate(new Date(2026, 3, 18)) as any,
    salary: 28000,
    createdBy: 'mock_user',
    createdAt: MockTimestamp.now() as any,
    updatedAt: MockTimestamp.now() as any,
  },
];

let expenses: Record<string, Expense[]> = {
  pp1: [
    {id: 'e1', description: 'PLDT Internet', amount: 1699, isPaid: true, category: 'Bills', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e2', description: 'Meralco Electric', amount: 3500, isPaid: true, category: 'Bills', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e3', description: 'Groceries - SM', amount: 4200, isPaid: true, category: 'Food', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e4', description: 'Water bill', amount: 350, isPaid: false, category: 'Bills', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e5', description: 'Grab transpo', amount: 800, isPaid: true, category: 'Transport', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
  ],
  pp2: [
    {id: 'e6', description: 'Rent', amount: 8000, isPaid: false, category: 'Bills', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e7', description: 'Netflix', amount: 549, isPaid: true, category: 'Entertainment', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
    {id: 'e8', description: 'Spotify', amount: 194, isPaid: true, category: 'Entertainment', createdBy: 'mock_user', createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any},
  ],
  pp3: [],
};

let recurringBills: RecurringBill[] = [
  {id: 'rb1', description: 'PLDT Internet', amount: 1699, dueDay: 15, frequency: 'monthly', reminderDaysBefore: 3, isActive: true, createdAt: MockTimestamp.now() as any},
  {id: 'rb2', description: 'Meralco Electric', amount: 3500, dueDay: 20, frequency: 'monthly', reminderDaysBefore: 5, isActive: true, createdAt: MockTimestamp.now() as any},
  {id: 'rb3', description: 'Water bill', amount: 350, dueDay: 10, frequency: 'monthly', reminderDaysBefore: 3, isActive: true, createdAt: MockTimestamp.now() as any},
  {id: 'rb4', description: 'Netflix', amount: 549, dueDay: 1, frequency: 'monthly', reminderDaysBefore: 2, isActive: true, createdAt: MockTimestamp.now() as any},
  {id: 'rb5', description: 'Spotify', amount: 194, dueDay: 1, frequency: 'monthly', reminderDaysBefore: 2, isActive: true, createdAt: MockTimestamp.now() as any},
  {id: 'rb6', description: 'Rent', amount: 8000, dueDay: 5, frequency: 'monthly', reminderDaysBefore: 5, isActive: true, createdAt: MockTimestamp.now() as any},
];

// ── Listener system (simulates Firestore onSnapshot) ─────────

type Listener<T> = (data: T) => void;

const payPeriodListeners: Map<string, Set<Listener<PayPeriod | null>>> = new Map();
const expenseListeners: Map<string, Set<Listener<Expense[]>>> = new Map();
const payPeriodsListListeners: Set<Listener<PayPeriod[]>> = new Set();
const recurringBillListeners: Set<Listener<RecurringBill[]>> = new Set();

function notifyPayPeriodsList() {
  const sorted = [...payPeriods].sort(
    (a, b) => (b.payDate as any)._date.getTime() - (a.payDate as any)._date.getTime(),
  );
  payPeriodsListListeners.forEach(cb => cb(sorted));
}

function notifyPayPeriod(id: string) {
  const period = payPeriods.find(p => p.id === id) ?? null;
  payPeriodListeners.get(id)?.forEach(cb => cb(period));
}

function notifyExpenses(periodId: string) {
  const items = expenses[periodId] || [];
  expenseListeners.get(periodId)?.forEach(cb => cb([...items]));
}

function notifyRecurringBills() {
  const sorted = [...recurringBills].sort((a, b) => a.dueDay - b.dueDay);
  recurringBillListeners.forEach(cb => cb(sorted));
}

// ── Public API (mirrors firestore.ts interface) ──────────────

// Pay Periods
export function mockOnPayPeriods(
  callback: Listener<PayPeriod[]>,
  limit?: number,
): () => void {
  payPeriodsListListeners.add(callback);
  const sorted = [...payPeriods].sort(
    (a, b) => (b.payDate as any)._date.getTime() - (a.payDate as any)._date.getTime(),
  );
  callback(limit ? sorted.slice(0, limit) : sorted);
  return () => {
    payPeriodsListListeners.delete(callback);
  };
}

export function mockOnPayPeriod(
  periodId: string,
  callback: Listener<PayPeriod | null>,
): () => void {
  if (!payPeriodListeners.has(periodId)) {
    payPeriodListeners.set(periodId, new Set());
  }
  payPeriodListeners.get(periodId)!.add(callback);
  const period = payPeriods.find(p => p.id === periodId) ?? null;
  callback(period);
  return () => {
    payPeriodListeners.get(periodId)?.delete(callback);
  };
}

export function mockCreatePayPeriod(
  data: Omit<PayPeriod, 'id' | 'createdAt' | 'updatedAt'>,
): string {
  const id = genId();
  const period: PayPeriod = {
    ...data,
    id,
    createdAt: MockTimestamp.now() as any,
    updatedAt: MockTimestamp.now() as any,
  };
  payPeriods.push(period);
  expenses[id] = [];
  notifyPayPeriodsList();
  return id;
}

export function mockUpdatePayPeriod(
  id: string,
  data: Partial<PayPeriod>,
): void {
  const idx = payPeriods.findIndex(p => p.id === id);
  if (idx !== -1) {
    payPeriods[idx] = {...payPeriods[idx], ...data, updatedAt: MockTimestamp.now() as any};
    notifyPayPeriod(id);
    notifyPayPeriodsList();
  }
}

export function mockDeletePayPeriod(id: string): void {
  payPeriods = payPeriods.filter(p => p.id !== id);
  delete expenses[id];
  notifyPayPeriod(id);
  notifyPayPeriodsList();
}

// Expenses
export function mockOnExpenses(
  periodId: string,
  callback: Listener<Expense[]>,
): () => void {
  if (!expenseListeners.has(periodId)) {
    expenseListeners.set(periodId, new Set());
  }
  expenseListeners.get(periodId)!.add(callback);
  callback([...(expenses[periodId] || [])]);
  return () => {
    expenseListeners.get(periodId)?.delete(callback);
  };
}

export function mockAddExpense(
  periodId: string,
  data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
): string {
  const id = genId();
  const expense: Expense = {
    ...data,
    id,
    createdAt: MockTimestamp.now() as any,
    updatedAt: MockTimestamp.now() as any,
  };
  if (!expenses[periodId]) {
    expenses[periodId] = [];
  }
  expenses[periodId].push(expense);
  notifyExpenses(periodId);
  return id;
}

export function mockUpdateExpense(
  periodId: string,
  expenseId: string,
  data: Partial<Expense>,
): void {
  const list = expenses[periodId];
  if (list) {
    const idx = list.findIndex(e => e.id === expenseId);
    if (idx !== -1) {
      list[idx] = {...list[idx], ...data, updatedAt: MockTimestamp.now() as any};
      notifyExpenses(periodId);
    }
  }
}

export function mockDeleteExpense(
  periodId: string,
  expenseId: string,
): void {
  const list = expenses[periodId];
  if (list) {
    expenses[periodId] = list.filter(e => e.id !== expenseId);
    notifyExpenses(periodId);
  }
}

export function mockToggleExpensePaid(
  periodId: string,
  expenseId: string,
  isPaid: boolean,
): void {
  mockUpdateExpense(periodId, expenseId, {isPaid});
}

// Recurring Bills
export function mockOnRecurringBills(
  callback: Listener<RecurringBill[]>,
): () => void {
  recurringBillListeners.add(callback);
  const sorted = [...recurringBills].sort((a, b) => a.dueDay - b.dueDay);
  callback(sorted);
  return () => {
    recurringBillListeners.delete(callback);
  };
}

export function mockAddRecurringBill(
  data: Omit<RecurringBill, 'id' | 'createdAt'>,
): string {
  const id = genId();
  const bill: RecurringBill = {
    ...data,
    id,
    createdAt: MockTimestamp.now() as any,
  };
  recurringBills.push(bill);
  notifyRecurringBills();
  return id;
}

export function mockUpdateRecurringBill(
  id: string,
  data: Partial<RecurringBill>,
): void {
  const idx = recurringBills.findIndex(b => b.id === id);
  if (idx !== -1) {
    recurringBills[idx] = {...recurringBills[idx], ...data};
    notifyRecurringBills();
  }
}

export function mockDeleteRecurringBill(id: string): void {
  recurringBills = recurringBills.filter(b => b.id !== id);
  notifyRecurringBills();
}
