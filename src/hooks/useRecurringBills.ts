import {useState, useEffect} from 'react';
import {RecurringBill} from '../types';
import {mockOnRecurringBills} from '../services/mockData';

export function useRecurringBills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = mockOnRecurringBills(items => {
      setBills(items);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const activeBills = bills.filter(b => b.isActive);
  const totalMonthly = activeBills.reduce((sum, b) => sum + b.amount, 0);

  return {bills, activeBills, totalMonthly, loading};
}
