import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

type Timestamp = FirebaseFirestoreTypes.Timestamp;

export interface PayPeriod {
  id: string;
  label: string;
  type: 'client1' | 'client2' | 'special';
  startDate: Timestamp;
  endDate: Timestamp;
  payDate: Timestamp;
  salary: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  isPaid: boolean;
  category?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecurringBill {
  id: string;
  description: string;
  amount: number;
  dueDay: number;
  frequency: 'monthly' | 'semi-monthly' | 'bi-weekly';
  reminderDaysBefore: number;
  isActive: boolean;
  clientType?: 'client1' | 'client2';
  createdAt: Timestamp;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  fcmToken: string;
  updatedAt: Timestamp;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  PayPeriod: {periodId: string; label: string};
  AddExpense: {periodId: string; expense?: Expense};
  AddBill: {bill?: RecurringBill};
  AddPayPeriod: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Bills: undefined;
  Settings: undefined;
};
