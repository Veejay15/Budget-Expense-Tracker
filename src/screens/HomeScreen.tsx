import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {useCurrentPayPeriods} from '../hooks/usePayPeriods';
import {PayPeriodCard} from '../components/PayPeriodCard';
import {mockCreatePayPeriod, MockTimestamp} from '../services/mockData';
import {getUpcomingPayDates} from '../services/paySchedule';
import {formatPeso} from '../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../theme';

type NavProp = StackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const {periods, loading} = useCurrentPayPeriods();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleCreatePeriod = useCallback(() => {
    const upcoming = getUpcomingPayDates(new Date(), 1);
    if (upcoming.length === 0) {return;}
    const next = upcoming[0];
    mockCreatePayPeriod({
      label: next.label,
      type: next.type,
      startDate: MockTimestamp.fromDate(next.start) as any,
      endDate: MockTimestamp.fromDate(next.end) as any,
      payDate: MockTimestamp.fromDate(next.date) as any,
      salary: 0,
      createdBy: 'mock_user',
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Calculate totals across all visible periods
  const totalSalary = useMemo(
    () => periods.reduce((sum, p) => sum + p.salary, 0),
    [periods],
  );

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
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

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatPeso(totalSalary)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.income}]} />
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.expense}]} />
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.balanceStat}>
              <View style={[styles.statDot, {backgroundColor: colors.primary}]} />
              <Text style={styles.statLabel}>Savings</Text>
            </View>
          </View>
        </View>

        {/* Pay Periods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pay Periods</Text>
          <TouchableOpacity onPress={handleCreatePeriod}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {periods.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No pay periods yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "+ Add" to create your first pay period
            </Text>
          </View>
        ) : (
          periods.map(item => (
            <PayPeriodCard
              key={item.id}
              payPeriod={item}
              onPress={() =>
                navigation.navigate('PayPeriod', {
                  periodId: item.id,
                  label: item.label,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    fontSize: 22,
  },
  // Balance Card
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
