import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidImportance,
  RepeatFrequency,
} from '@notifee/react-native';

const CHANNEL_ID = 'budget-tracker-bills';

export async function setupNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Bill Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function scheduleBillReminder(
  billId: string,
  billName: string,
  amount: number,
  dueDay: number,
  reminderDaysBefore: number,
): Promise<void> {
  // Cancel any existing notification for this bill
  await notifee.cancelNotification(`bill-${billId}`);

  // Calculate next reminder date
  const now = new Date();
  let reminderDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    dueDay - reminderDaysBefore,
    8, 0, 0, // 8:00 AM
  );

  // If the date has already passed this month, schedule for next month
  if (reminderDate.getTime() <= now.getTime()) {
    reminderDate.setMonth(reminderDate.getMonth() + 1);
  }

  const amountStr = amount.toLocaleString('en-PH', {minimumFractionDigits: 2});

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: reminderDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: `bill-${billId}`,
      title: '💰 Bill Due Reminder',
      body: `${billName} (₱${amountStr}) is due in ${reminderDaysBefore} day${reminderDaysBefore !== 1 ? 's' : ''}!`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
        importance: AndroidImportance.HIGH,
      },
    },
    trigger,
  );
}

export async function schedulePaydayReminder(
  periodId: string,
  label: string,
  payDate: Date,
  salary: number,
): Promise<void> {
  await notifee.cancelNotification(`payday-${periodId}`);

  // Notify at 7 AM on payday
  const notifyDate = new Date(payDate);
  notifyDate.setHours(7, 0, 0, 0);

  // Don't schedule if in the past
  if (notifyDate.getTime() <= Date.now()) { return; }

  const salaryStr = salary.toLocaleString('en-PH', {minimumFractionDigits: 2});

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notifyDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: `payday-${periodId}`,
      title: '🎉 Payday!',
      body: `${label}: ₱${salaryStr} incoming. Check your expenses!`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
        importance: AndroidImportance.HIGH,
      },
    },
    trigger,
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

export async function scheduleAllBillReminders(
  bills: Array<{id: string; description: string; amount: number; dueDay: number; reminderDaysBefore: number; isActive: boolean}>,
): Promise<void> {
  for (const bill of bills) {
    if (bill.isActive) {
      await scheduleBillReminder(
        bill.id, bill.description, bill.amount, bill.dueDay, bill.reminderDaysBefore,
      );
    } else {
      await notifee.cancelNotification(`bill-${bill.id}`);
    }
  }
}
