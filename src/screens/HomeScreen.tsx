import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {useCurrentPayPeriods} from '../hooks/usePayPeriods';
import {PayPeriodCard} from '../components/PayPeriodCard';
import {mockCreatePayPeriod, MockTimestamp} from '../services/mockData';
import {getUpcomingPayDates} from '../services/paySchedule';
import {colors, spacing, fontSize} from '../theme';

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={periods}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <PayPeriodCard
            payPeriod={item}
            onPress={() =>
              navigation.navigate('PayPeriod', {
                periodId: item.id,
                label: item.label,
              })
            }
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pay periods yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first pay period
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Current Pay Periods</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePeriod}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  list: {
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});
