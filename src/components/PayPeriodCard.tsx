import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {PayPeriod, Expense} from '../types';
import {mockOnExpenses} from '../services/mockData';
import {formatPeso} from '../utils/currency';
import {formatDateRange, timestampToDate} from '../utils/dates';
import {colors, spacing, fontSize, borderRadius} from '../theme';

interface Props {
  payPeriod: PayPeriod;
  onPress: () => void;
}

export function PayPeriodCard({payPeriod, onPress}: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const unsubscribe = mockOnExpenses(payPeriod.id, items => {
      setExpenses(items);
    });
    return unsubscribe;
  }, [payPeriod.id]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );
  const remaining = payPeriod.salary - totalExpenses;
  const remainingColor =
    remaining > 0
      ? colors.remaining.positive
      : remaining < 0
      ? colors.remaining.negative
      : colors.remaining.zero;

  const typeLabel = payPeriod.type === 'client1' ? 'Client 1' : payPeriod.type === 'client2' ? 'Client 2' : 'Special';
  const typeBadgeColor = payPeriod.type === 'client1' ? colors.primary : payPeriod.type === 'client2' ? '#8B5CF6' : colors.warning;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.label}>{payPeriod.label}</Text>
        <View style={[styles.badge, {backgroundColor: typeBadgeColor}]}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
      </View>

      <Text style={styles.dateRange}>
        {formatDateRange(
          timestampToDate(payPeriod.startDate),
          timestampToDate(payPeriod.endDate),
        )}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, {color: colors.income}]}>
            {formatPeso(payPeriod.salary)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, {color: colors.expense}]}>
            {formatPeso(totalExpenses)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, {color: remainingColor}]}>
            {formatPeso(remaining)}
          </Text>
        </View>
      </View>

      <Text style={styles.expenseCount}>
        {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  expenseCount: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
});
