import firestore from '@react-native-firebase/firestore';
import {PayPeriod, Expense, RecurringBill, User} from '../types';

const db = firestore();

// ── Pay Periods ──────────────────────────────────────────────

export function payPeriodsCollection() {
  return db.collection('payPeriods');
}

export async function createPayPeriod(
  data: Omit<PayPeriod, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const ref = await payPeriodsCollection().add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updatePayPeriod(
  id: string,
  data: Partial<Omit<PayPeriod, 'id' | 'createdAt'>>,
): Promise<void> {
  await payPeriodsCollection()
    .doc(id)
    .update({
      ...data,
      updatedAt: firestore.Timestamp.now(),
    });
}

export async function deletePayPeriod(id: string): Promise<void> {
  // Delete all expenses in the subcollection first
  const expenses = await expensesCollection(id).get();
  const batch = db.batch();
  expenses.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(payPeriodsCollection().doc(id));
  await batch.commit();
}

// ── Expenses (subcollection of payPeriods) ───────────────────

export function expensesCollection(periodId: string) {
  return payPeriodsCollection().doc(periodId).collection('expenses');
}

export async function addExpense(
  periodId: string,
  data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const ref = await expensesCollection(periodId).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateExpense(
  periodId: string,
  expenseId: string,
  data: Partial<Omit<Expense, 'id' | 'createdAt'>>,
): Promise<void> {
  await expensesCollection(periodId)
    .doc(expenseId)
    .update({
      ...data,
      updatedAt: firestore.Timestamp.now(),
    });
}

export async function deleteExpense(
  periodId: string,
  expenseId: string,
): Promise<void> {
  await expensesCollection(periodId).doc(expenseId).delete();
}

export async function toggleExpensePaid(
  periodId: string,
  expenseId: string,
  isPaid: boolean,
): Promise<void> {
  await expensesCollection(periodId).doc(expenseId).update({
    isPaid,
    updatedAt: firestore.Timestamp.now(),
  });
}

// ── Recurring Bills ──────────────────────────────────────────

export function recurringBillsCollection() {
  return db.collection('recurringBills');
}

export async function addRecurringBill(
  data: Omit<RecurringBill, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await recurringBillsCollection().add({
    ...data,
    createdAt: firestore.Timestamp.now(),
  });
  return ref.id;
}

export async function updateRecurringBill(
  id: string,
  data: Partial<Omit<RecurringBill, 'id' | 'createdAt'>>,
): Promise<void> {
  await recurringBillsCollection().doc(id).update(data);
}

export async function deleteRecurringBill(id: string): Promise<void> {
  await recurringBillsCollection().doc(id).delete();
}

// ── Users ────────────────────────────────────────────────────

export function usersCollection() {
  return db.collection('users');
}

export async function saveUserProfile(data: User): Promise<void> {
  await usersCollection().doc(data.id).set(data, {merge: true});
}

export async function updateFcmToken(
  userId: string,
  fcmToken: string,
): Promise<void> {
  await usersCollection().doc(userId).update({
    fcmToken,
    updatedAt: firestore.Timestamp.now(),
  });
}

// ── Helpers ──────────────────────────────────────────────────

export function serverTimestamp() {
  return firestore.FieldValue.serverTimestamp();
}

export function toTimestamp(date: Date) {
  return firestore.Timestamp.fromDate(date);
}
