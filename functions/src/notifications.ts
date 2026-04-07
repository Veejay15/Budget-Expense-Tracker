import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Helper: get all FCM tokens
async function getAllFcmTokens(): Promise<string[]> {
  const usersSnapshot = await db.collection('users').get();
  const tokens: string[] = [];
  usersSnapshot.docs.forEach(doc => {
    const token = doc.data().fcmToken;
    if (token) {
      tokens.push(token);
    }
  });
  return tokens;
}

// Helper: send notification to all users
async function sendToAll(title: string, body: string): Promise<void> {
  const tokens = await getAllFcmTokens();
  if (tokens.length === 0) {
    return;
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {title, body},
    android: {
      priority: 'high',
      notification: {
        channelId: 'budget-tracker',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });
}

/**
 * Bill Due Reminder
 * Runs daily at 8:00 AM Manila time.
 * Checks all active recurring bills. If a bill's due day is X days away
 * (where X = reminderDaysBefore), sends a push notification.
 */
export const billDueReminder = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('Asia/Manila')
  .onRun(async () => {
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    const billsSnapshot = await db
      .collection('recurringBills')
      .where('isActive', '==', true)
      .get();

    for (const doc of billsSnapshot.docs) {
      const bill = doc.data();
      const dueDay: number = bill.dueDay;
      const reminderDays: number = bill.reminderDaysBefore || 3;

      // Calculate days until due
      let daysUntilDue: number;
      if (dueDay >= today) {
        daysUntilDue = dueDay - today;
      } else {
        // Due day is next month
        daysUntilDue = daysInMonth - today + dueDay;
      }

      if (daysUntilDue === reminderDays) {
        const amount = bill.amount.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        });

        await sendToAll(
          'Bill Due Reminder',
          `${bill.description} (₱${amount}) is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`,
        );
      }
    }
  });

/**
 * Payday Summary
 * Runs daily at 7:00 AM Manila time.
 * Checks if today is a payday (Client 1: 5th/18th, Client 2: bi-weekly Friday).
 * If yes, finds the matching pay period and sends a summary notification.
 */
export const paydaySummary = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('Asia/Manila')
  .onRun(async () => {
    const now = new Date();
    const today = now.getDate();
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri

    const isClient1Payday = today === 5 || today === 18;

    // For Client 2 bi-weekly Friday check, we store the anchor in Firestore config
    let isClient2Payday = false;
    if (dayOfWeek === 5) {
      // It's a Friday — check if it's a bi-weekly payday
      const configDoc = await db.collection('config').doc('paySchedule').get();
      if (configDoc.exists) {
        const anchorStr = configDoc.data()?.client2AnchorFriday;
        if (anchorStr) {
          const anchor = new Date(anchorStr);
          const diffMs = Math.abs(now.getTime() - anchor.getTime());
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          isClient2Payday = diffDays % 14 === 0;
        }
      }
    }

    if (!isClient1Payday && !isClient2Payday) {
      return;
    }

    // Find today's pay period(s)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const periodsSnapshot = await db
      .collection('payPeriods')
      .where('payDate', '>=', admin.firestore.Timestamp.fromDate(startOfToday))
      .where('payDate', '<=', admin.firestore.Timestamp.fromDate(endOfToday))
      .get();

    for (const periodDoc of periodsSnapshot.docs) {
      const period = periodDoc.data();

      // Get expenses for this period
      const expensesSnapshot = await periodDoc.ref
        .collection('expenses')
        .get();

      const expenses = expensesSnapshot.docs.map(d => d.data());
      const totalExpenses = expenses.reduce(
        (sum: number, e: any) => sum + (e.amount || 0),
        0,
      );
      const remaining = (period.salary || 0) - totalExpenses;

      const salaryStr = (period.salary || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      });
      const totalStr = totalExpenses.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      });
      const remainingStr = remaining.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      });

      await sendToAll(
        `Payday! ${period.label}`,
        `Income: ₱${salaryStr} | ${expenses.length} expenses: ₱${totalStr} | Remaining: ₱${remainingStr}`,
      );
    }
  });
