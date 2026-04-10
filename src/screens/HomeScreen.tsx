import React, {useCallback, useMemo, useState, useEffect} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {usePayPeriods} from '../hooks/usePayPeriods';
import {useSettings} from '../hooks/useSettings';
import {PayPeriodCard} from '../components/PayPeriodCard';
import {getAllExpenses, mockOnExpenses} from '../services/mockData';
import {formatPeso} from '../utils/currency';
import {format, addMonths, subMonths, isSameMonth} from 'date-fns';
import {colors, spacing, fontSize, borderRadius} from '../theme';
import {DueThisWeekWidget} from '../components/DueThisWeek/DueThisWeekWidget';

type NavProp = StackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const {periods, loading} = usePayPeriods();
  const settings = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [expenseVersion, setExpenseVersion] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Filter periods for the current month view
  const monthPeriods = useMemo(() => {
    return periods.filter(p => {
      const payDate = (p.payDate as any)._date || (p.payDate as any).toDate?.();
      return payDate && isSameMonth(payDate, viewDate);
    });
  }, [periods, viewDate]);

  // Subscribe to expense changes for all visible periods
  useEffect(() => {
    const unsubscribers = monthPeriods.map(period =>
      mockOnExpenses(period.id, () => {
        setExpenseVersion(v => v + 1);
      }),
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, [monthPeriods]);

  // Calculate totals for the viewed month
  const totalSalary = useMemo(
    () => monthPeriods.reduce((sum, p) => sum + p.salary, 0),
    [monthPeriods],
  );

  const totalMonthlySpend = useMemo(() => {
    const allExp = getAllExpenses();
    // Filter expenses that belong to this month's periods
    const monthPeriodIds = new Set(monthPeriods.map(p => p.id));
    return allExp
      .filter(({periodId}) => monthPeriodIds.has(periodId))
      .reduce((sum, {expense}) => sum + expense.amount, 0);
  }, [monthPeriods, expenseVersion]);

  const monthLabel = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.name}>Veejay</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>💰</Text>
          </View>
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setViewDate(prev => subMonths(prev, 1))} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setViewDate(prev => addMonths(prev, 1))} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatPeso(totalSalary - totalMonthlySpend)}</Text>
          <Text style={styles.monthlySpend}>
            Total spend this month: {formatPeso(totalMonthlySpend)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.income}]} />
              <View>
                <Text style={styles.statValue}>{formatPeso(totalSalary)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.expense}]} />
              <View>
                <Text style={styles.statValue}>{formatPeso(totalMonthlySpend)}</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
            </View>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.primary}]} />
              <View>
                <Text style={styles.statValue}>{formatPeso(totalSalary - totalMonthlySpend)}</Text>
                <Text style={styles.statLabel}>Savings</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Due This Week */}
        <DueThisWeekWidget />

        {/* Pay Periods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Paydays</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddPayPeriod')}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {monthPeriods.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No paydays for {monthLabel}</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add" to create a pay period</Text>
          </View>
        ) : (
          monthPeriods.map(item => (
            <PayPeriodCard
              key={item.id}
              payPeriod={item}
              onPress={() => navigation.navigate('PayPeriod', {periodId: item.id, label: item.label})}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background},
  scroll: {paddingBottom: spacing.xl},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.sm,
  },
  greeting: {fontSize: fontSize.sm, color: colors.textSecondary},
  name: {fontSize: fontSize.xl, fontWeight: '700', color: colors.text},
  avatarContainer: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary,
  },
  avatar: {fontSize: 22},
  // Month Nav
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  monthArrow: {padding: spacing.sm},
  monthArrowText: {fontSize: fontSize.md, color: colors.primary, fontWeight: '700'},
  monthLabel: {fontSize: fontSize.md, fontWeight: '700', color: colors.text},
  // Balance Card
  balanceCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.xs, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  balanceLabel: {fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs},
  balanceAmount: {fontSize: fontSize.hero, fontWeight: '700', color: colors.primary},
  monthlySpend: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md},
  balanceStats: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  balanceStat: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  statDot: {width: 8, height: 8, borderRadius: 4},
  statValue: {fontSize: fontSize.xs, fontWeight: '700', color: colors.text},
  statLabel: {fontSize: fontSize.xs, color: colors.textMuted},
  // Sections
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  sectionTitle: {fontSize: fontSize.lg, fontWeight: '700', color: colors.text},
  addButton: {fontSize: fontSize.md, fontWeight: '600', color: colors.primary},
  empty: {alignItems: 'center', paddingVertical: spacing.xl},
  emptyIcon: {fontSize: 48, marginBottom: spacing.md},
  emptyText: {fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary},
  emptySubtext: {fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs},
});
