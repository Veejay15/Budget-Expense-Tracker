import {useState, useEffect} from 'react';
import {PayPeriod} from '../types';
import {mockOnPayPeriods} from '../services/mockData';

export function usePayPeriods(limit?: number) {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = mockOnPayPeriods(items => {
      setPeriods(items);
      setLoading(false);
    }, limit);

    return unsubscribe;
  }, [limit]);

  return {periods, loading};
}

export function useCurrentPayPeriods() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = mockOnPayPeriods(items => {
      setPeriods(items);
      setLoading(false);
    }, 4);

    return unsubscribe;
  }, []);

  return {periods, loading};
}
