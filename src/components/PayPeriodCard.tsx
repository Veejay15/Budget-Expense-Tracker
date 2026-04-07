import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {PayPeriod, Expense} from '../types';
import {mockOnExpenses, getSettings} from '../services/mockData';
import {useSettings} from '../hooks/useSettings';
import {formatPeso} from '../utils/currency';
import {formatDateRange, timestampToDate} from '../utils/dates';
import {colors, spacing, fontSize, borderRadius} from '../theme';

interface Props {
  payPeriod: PayPeriod;
  onPress: () => void;
}

export function PayPeriodCard({payPeriod, onPress}: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const settings = useSettings();

  useEffect(() => {
    const unsubscribe = mockOnExpenses(payPeriod.id, items => setExpenses(items));
    return unsubscribe;
  }, [payPeriod.id]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const remaining = payPeriod.salary - totalExpenses;
  const remainingColor = remaining > 0 ? colors.remaining.positive : remaining < 0 ? colors.remaining.negative : colors.remaining.zero;

  const typeLabel = payPeriod.type === 'client1'
    ? (settings?.client1Name || 'Client 1')
    : payPeriod.type === 'client2'
    ? (settings?.client2Name || 'Client 2')
    : 'Special';
  const typeBadgeColor = payPeriod.type === 'client1' ? colors.primary : payPeriod.type === 'client2' ? '#8B5CF6' : colors.warning;
  const typeIcon = payPeriod.type === 'client1' ? '💼' : payPeriod.type === 'client2' ? '🏢' : '⭐';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <View>
            <Text style={styles.label}>{payPeriod.label}</Text>
            <Text style={styles.dateRange}>
              {formatDateRange(timestampToDate(payPeriod.startDate), timestampToDate(payPeriod.endDate))}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, {backgroundColor: typeBadgeColor}]}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, {color: colors.income}]}>{formatPeso(payPeriod.salary)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, {color: colors.expense}]}>{formatPeso(totalExpenses)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Left</Text>
          <Text style={[styles.statValue, {color: remainingColor}]}>{formatPeso(remaining)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.expenseCount}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginHorizontal: spacing.lg, marginVertical: spacing.xs, borderWidth: 1, borderColor: colors.border,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md},
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  typeIcon: {fontSize: 24},
  label: {fontSize: fontSize.md, fontWeight: '700', color: colors.text},
  dateRange: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1},
  badge: {paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full},
  badgeText: {color: '#fff', fontSize: fontSize.xs, fontWeight: '700'},
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md,
  },
  stat: {flex: 1, alignItems: 'center'},
  statDivider: {width: 1, height: 30, backgroundColor: colors.border},
  statLabel: {fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2},
  statValue: {fontSize: fontSize.md, fontWeight: '700'},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm},
  expenseCount: {fontSize: fontSize.xs, color: colors.textMuted},
  arrow: {fontSize: fontSize.md, color: colors.primary, fontWeight: '700'},
});
