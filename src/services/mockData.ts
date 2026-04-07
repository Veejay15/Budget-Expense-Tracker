import AsyncStorage from '@react-native-async-storage/async-storage';
import {PayPeriod, Expense, RecurringBill} from '../types';

// ── MockTimestamp ────────────────────────────────────────────

export class MockTimestamp {
  _date: Date;
  constructor(date: Date) { this._date = date; }
  toDate(): Date { return this._date; }
  static now(): MockTimestamp { return new MockTimestamp(new Date()); }
  static fromDate(date: Date): MockTimestamp { return new MockTimestamp(date); }
  toJSON() { return this._date.toISOString(); }
  static fromJSON(iso: string): MockTimestamp { return new MockTimestamp(new Date(iso)); }
}

// ── ID generator ─────────────────────────────────────────────

let nextId = 100;
function genId(): string { return `mock_${nextId++}`; }

// ── App Settings (shared state) ──────────────────────────────

export interface AppSettings {
  client1Name: string;
  client2Name: string;
  client1Salary: number;
  client2Salary: number;
  client2AnchorDate: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  client1Name: 'Client 1',
  client2Name: 'Client 2',
  client1Salary: 28000,
  client2Salary: 25000,
  client2AnchorDate: '2026-04-10',
};

let appSettings: AppSettings = {...DEFAULT_SETTINGS};
const settingsListeners: Set<Listener<AppSettings>> = new Set();

export function getSettings(): AppSettings { return {...appSettings}; }

export function updateSettings(data: Partial<AppSettings>): void {
  appSettings = {...appSettings, ...data};
  settingsListeners.forEach(cb => cb({...appSettings}));
  persistAll();
}

export function onSettings(callback: Listener<AppSettings>): () => void {
  settingsListeners.add(callback);
  callback({...appSettings});
  return () => { settingsListeners.delete(callback); };
}

// ── In-memory stores ─────────────────────────────────────────

let payPeriods: PayPeriod[] = [];
let expenses: Record<string, Expense[]> = {};
let recurringBills: RecurringBill[] = [];
let initialized = false;

// ── Listener system ──────────────────────────────────────────

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

// ── Persistence ──────────────────────────────────────────────

function serializeTimestamp(ts: any): string {
  if (ts && ts._date) { return ts._date.toISOString(); }
  if (ts && ts.toDate) { return ts.toDate().toISOString(); }
  return new Date().toISOString();
}

function deserializeTimestamp(iso: string): MockTimestamp {
  return MockTimestamp.fromJSON(iso);
}

function serializePayPeriod(p: PayPeriod): any {
  return {
    ...p,
    startDate: serializeTimestamp(p.startDate),
    endDate: serializeTimestamp(p.endDate),
    payDate: serializeTimestamp(p.payDate),
    createdAt: serializeTimestamp(p.createdAt),
    updatedAt: serializeTimestamp(p.updatedAt),
  };
}

function deserializePayPeriod(data: any): PayPeriod {
  return {
    ...data,
    startDate: deserializeTimestamp(data.startDate),
    endDate: deserializeTimestamp(data.endDate),
    payDate: deserializeTimestamp(data.payDate),
    createdAt: deserializeTimestamp(data.createdAt),
    updatedAt: deserializeTimestamp(data.updatedAt),
  };
}

function serializeExpense(e: Expense): any {
  return {
    ...e,
    createdAt: serializeTimestamp(e.createdAt),
    updatedAt: serializeTimestamp(e.updatedAt),
  };
}

function deserializeExpense(data: any): Expense {
  return {
    ...data,
    createdAt: deserializeTimestamp(data.createdAt),
    updatedAt: deserializeTimestamp(data.updatedAt),
  };
}

function serializeBill(b: RecurringBill): any {
  return { ...b, createdAt: serializeTimestamp(b.createdAt) };
}

function deserializeBill(data: any): RecurringBill {
  return { ...data, createdAt: deserializeTimestamp(data.createdAt) };
}

async function persistAll(): Promise<void> {
  try {
    const data = {
      payPeriods: payPeriods.map(serializePayPeriod),
      expenses: Object.fromEntries(
        Object.entries(expenses).map(([k, v]) => [k, v.map(serializeExpense)]),
      ),
      recurringBills: recurringBills.map(serializeBill),
      settings: appSettings,
      nextId,
    };
    await AsyncStorage.setItem('@budget_data', JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist data:', e);
  }
}

async function loadPersistedData(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem('@budget_data');
    if (!raw) { return false; }
    const data = JSON.parse(raw);

    payPeriods = (data.payPeriods || []).map(deserializePayPeriod);
    expenses = {};
    for (const [k, v] of Object.entries(data.expenses || {})) {
      expenses[k] = (v as any[]).map(deserializeExpense);
    }
    recurringBills = (data.recurringBills || []).map(deserializeBill);
    if (data.settings) { appSettings = {...DEFAULT_SETTINGS, ...data.settings}; }
    if (data.nextId) { nextId = data.nextId; }

    return true;
  } catch (e) {
    console.warn('Failed to load data:', e);
    return false;
  }
}

function loadDefaults(): void {
  // Start with empty pay periods - user will create their own
  payPeriods = [];
  expenses = {};

  // Start with empty recurring bills - user adds from Bills tab
  recurringBills = [];

  persistAll();
}

export async function initializeData(): Promise<void> {
  if (initialized) { return; }
  const loaded = await loadPersistedData();
  if (!loaded) { loadDefaults(); }
  initialized = true;
}

// Reset all data to start fresh
export async function resetAllData(): Promise<void> {
  payPeriods = [];
  expenses = {};
  recurringBills = [];
  appSettings = {...DEFAULT_SETTINGS};
  nextId = 100;
  await AsyncStorage.removeItem('@budget_data');
  notifyPayPeriodsList();
  notifyRecurringBills();
  settingsListeners.forEach(cb => cb({...appSettings}));
}

// ── Public API ───────────────────────────────────────────────

// Pay Periods
export function mockOnPayPeriods(callback: Listener<PayPeriod[]>, limit?: number): () => void {
  payPeriodsListListeners.add(callback);
  const sorted = [...payPeriods].sort(
    (a, b) => (b.payDate as any)._date.getTime() - (a.payDate as any)._date.getTime(),
  );
  callback(limit ? sorted.slice(0, limit) : sorted);
  return () => { payPeriodsListListeners.delete(callback); };
}

export function mockOnPayPeriod(periodId: string, callback: Listener<PayPeriod | null>): () => void {
  if (!payPeriodListeners.has(periodId)) { payPeriodListeners.set(periodId, new Set()); }
  payPeriodListeners.get(periodId)!.add(callback);
  callback(payPeriods.find(p => p.id === periodId) ?? null);
  return () => { payPeriodListeners.get(periodId)?.delete(callback); };
}

export function mockCreatePayPeriod(data: Omit<PayPeriod, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = genId();
  payPeriods.push({...data, id, createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any});
  expenses[id] = [];
  notifyPayPeriodsList();
  persistAll();
  return id;
}

export function mockUpdatePayPeriod(id: string, data: Partial<PayPeriod>): void {
  const idx = payPeriods.findIndex(p => p.id === id);
  if (idx !== -1) {
    payPeriods[idx] = {...payPeriods[idx], ...data, updatedAt: MockTimestamp.now() as any};
    notifyPayPeriod(id);
    notifyPayPeriodsList();
    persistAll();
  }
}

export function mockDeletePayPeriod(id: string): void {
  payPeriods = payPeriods.filter(p => p.id !== id);
  delete expenses[id];
  notifyPayPeriod(id);
  notifyPayPeriodsList();
  persistAll();
}

// Expenses
export function mockOnExpenses(periodId: string, callback: Listener<Expense[]>): () => void {
  if (!expenseListeners.has(periodId)) { expenseListeners.set(periodId, new Set()); }
  expenseListeners.get(periodId)!.add(callback);
  callback([...(expenses[periodId] || [])]);
  return () => { expenseListeners.get(periodId)?.delete(callback); };
}

export function mockAddExpense(periodId: string, data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = genId();
  if (!expenses[periodId]) { expenses[periodId] = []; }
  expenses[periodId].push({...data, id, createdAt: MockTimestamp.now() as any, updatedAt: MockTimestamp.now() as any});
  notifyExpenses(periodId);
  persistAll();
  return id;
}

export function mockUpdateExpense(periodId: string, expenseId: string, data: Partial<Expense>): void {
  const list = expenses[periodId];
  if (list) {
    const idx = list.findIndex(e => e.id === expenseId);
    if (idx !== -1) {
      list[idx] = {...list[idx], ...data, updatedAt: MockTimestamp.now() as any};
      notifyExpenses(periodId);
      persistAll();
    }
  }
}

export function mockDeleteExpense(periodId: string, expenseId: string): void {
  if (expenses[periodId]) {
    expenses[periodId] = expenses[periodId].filter(e => e.id !== expenseId);
    notifyExpenses(periodId);
    persistAll();
  }
}

export function mockToggleExpensePaid(periodId: string, expenseId: string, isPaid: boolean): void {
  mockUpdateExpense(periodId, expenseId, {isPaid});
}

// Recurring Bills
export function mockOnRecurringBills(callback: Listener<RecurringBill[]>): () => void {
  recurringBillListeners.add(callback);
  callback([...recurringBills].sort((a, b) => a.dueDay - b.dueDay));
  return () => { recurringBillListeners.delete(callback); };
}

export function mockAddRecurringBill(data: Omit<RecurringBill, 'id' | 'createdAt'>): string {
  const id = genId();
  recurringBills.push({...data, id, createdAt: MockTimestamp.now() as any});
  notifyRecurringBills();
  persistAll();
  return id;
}

export function mockUpdateRecurringBill(id: string, data: Partial<RecurringBill>): void {
  const idx = recurringBills.findIndex(b => b.id === id);
  if (idx !== -1) {
    recurringBills[idx] = {...recurringBills[idx], ...data};
    notifyRecurringBills();
    persistAll();
  }
}

export function mockDeleteRecurringBill(id: string): void {
  recurringBills = recurringBills.filter(b => b.id !== id);
  notifyRecurringBills();
  persistAll();
}

// Helper to get all expenses across all periods (for monthly totals)
export function getAllExpenses(): {periodId: string; expense: Expense}[] {
  const result: {periodId: string; expense: Expense}[] = [];
  for (const [periodId, list] of Object.entries(expenses)) {
    for (const expense of list) {
      result.push({periodId, expense});
    }
  }
  return result;
}

export function getAllPayPeriods(): PayPeriod[] {
  return [...payPeriods];
}
