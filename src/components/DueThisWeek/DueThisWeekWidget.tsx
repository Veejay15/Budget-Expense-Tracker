import React, {useMemo, useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecurringBills} from '../../hooks/useRecurringBills';
import {filterBillsByPeriod, FilterPeriod} from '../../utils/billDates';
import {BillCard} from './BillCard';
import {
  getAllExpenses, getAllPayPeriods,
  mockToggleExpensePaid, mockOnExpenses,
} from '../../services/mockData';
import {colors, spacing, fontSize, borderRadius} from '../../theme';

const FILTER_OPTIONS: {key: FilterPeriod; label: string}[] = [
  {key: 'today', label: 'Today'},
  {key: 'week', label: 'Week'},
  {key: 'month', label: 'Month'},
];

const PERIOD_LABELS: Record<FilterPeriod, string> = {
  today: 'today',
  week: 'this week',
  month: 'this month',
};

interface ExpenseMatch {
  periodId: string;
  expenseId: string;
  isPaid: boolean;
}

export function DueThisWeekWidget() {
  const navigation = useNavigation<any>();
  const {activeBills, loading} = useRecurringBills();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('week');
  const [expenseVersion, setExpenseVersion] = useState(0);

  // Subscribe to expense changes across all periods to track paid status
  useEffect(() => {
    const periods = getAllPayPeriods();
    const unsubscribers = periods.map(p =>
      mockOnExpenses(p.id, () => {
        setExpenseVersion(v => v + 1);
      }),
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const filteredBills = useMemo(
    () => filterBillsByPeriod(activeBills, selectedPeriod),
    [activeBills, selectedPeriod],
  );

  // Find matching expenses for each bill (to check paid status)
  const billExpenseMap = useMemo(() => {
    const allExp = getAllExpenses();
    const map: Record<string, ExpenseMatch> = {};

    for (const bill of filteredBills) {
      // Find an expense matching this bill's description with category 'Bills'
      const match = allExp.find(
        ({expense}) =>
          expense.description === bill.description &&
          expense.category === 'Bills',
      );
      if (match) {
        map[bill.id] = {
          periodId: match.periodId,
          expenseId: match.expense.id,
          isPaid: match.expense.isPaid,
        };
      }
    }
    return map;
  }, [filteredBills, expenseVersion]);

  // Split into unpaid and paid
  const unpaidBills = filteredBills.filter(b => !billExpenseMap[b.id]?.isPaid);
  const paidBills = filteredBills.filter(b => billExpenseMap[b.id]?.isPaid);
  const displayBills = [...unpaidBills, ...paidBills];

  const handleTogglePaid = (billId: string) => {
    const match = billExpenseMap[billId];
    if (match) {
      mockToggleExpensePaid(match.periodId, match.expenseId, !match.isPaid);
    }
  };

  if (loading || activeBills.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📅</Text>
          <Text style={styles.headerTitle}>Due This Week</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Bills')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterPill,
              selectedPeriod === option.key && styles.filterPillActive,
            ]}
            onPress={() => setSelectedPeriod(option.key)}>
            <Text
              style={[
                styles.filterText,
                selectedPeriod === option.key && styles.filterTextActive,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bill Cards */}
      {displayBills.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}>
          {displayBills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              isPaid={billExpenseMap[bill.id]?.isPaid ?? false}
              onTogglePaid={() => handleTogglePaid(bill.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No bills due {PERIOD_LABELS[selectedPeriod]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },
  cardsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
