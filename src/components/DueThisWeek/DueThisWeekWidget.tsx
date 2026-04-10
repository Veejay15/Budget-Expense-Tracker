import React, {useMemo, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecurringBills} from '../../hooks/useRecurringBills';
import {filterBillsByPeriod, FilterPeriod} from '../../utils/billDates';
import {formatPeso} from '../../utils/currency';
import {BillCard} from './BillCard';
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

export function DueThisWeekWidget() {
  const navigation = useNavigation<any>();
  const {activeBills, loading} = useRecurringBills();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('week');

  const filteredBills = useMemo(
    () => filterBillsByPeriod(activeBills, selectedPeriod),
    [activeBills, selectedPeriod],
  );

  const totalAmount = useMemo(
    () => filteredBills.reduce((sum, b) => sum + b.amount, 0),
    [filteredBills],
  );

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
      {filteredBills.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}>
          {filteredBills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No bills due {PERIOD_LABELS[selectedPeriod]}
          </Text>
        </View>
      )}

      {/* AI Summary Card */}
      {filteredBills.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeDot}>●</Text>
            <Text style={styles.summaryBadgeText}>STEWARDLY AI</Text>
          </View>
          <Text style={styles.summaryTitle}>
            {filteredBills.length} payment{filteredBills.length !== 1 ? 's' : ''} due{' '}
            {PERIOD_LABELS[selectedPeriod]}
          </Text>
          <Text style={styles.summarySubtext}>
            {formatPeso(totalAmount)} needs to go out soon. Stay ahead of your deadlines.
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
  // Header
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
  // Filter Tabs
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
  // Cards
  cardsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  // Empty State
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  // AI Summary Card
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.cardGradientStart,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  summaryBadgeDot: {
    fontSize: 8,
    color: '#2DD4BF',
  },
  summaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summarySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
