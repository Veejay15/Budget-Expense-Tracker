import {useState, useEffect, useMemo} from 'react';
import {PayPeriod, Expense} from '../types';
import {mockOnPayPeriod, mockOnExpenses} from '../services/mockData';

export function usePayPeriod(periodId: string) {
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPeriod = mockOnPayPeriod(periodId, period => {
      setPayPeriod(period);
    });

    const unsubExpenses = mockOnExpenses(periodId, items => {
      setExpenses(items);
      setLoading(false);
    });

    return () => {
      unsubPeriod();
      unsubExpenses();
    };
  }, [periodId]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const remaining = useMemo(
    () => (payPeriod?.salary ?? 0) - totalExpenses,
    [payPeriod?.salary, totalExpenses],
  );

  return {payPeriod, expenses, totalExpenses, remaining, loading};
}
