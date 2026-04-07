import React from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, PayPeriod} from '../types';
import {usePayPeriods} from '../hooks/usePayPeriods';
import {PayPeriodCard} from '../components/PayPeriodCard';
import {timestampToDate} from '../utils/dates';
import {format} from 'date-fns';
import {colors, spacing, fontSize} from '../theme';

type NavProp = StackNavigationProp<RootStackParamList>;

interface Section {
  title: string;
  data: PayPeriod[];
}

export function HistoryScreen() {
  const navigation = useNavigation<NavProp>();
  const {periods, loading} = usePayPeriods();

  // Group by month
  const sections: Section[] = React.useMemo(() => {
    const grouped = new Map<string, PayPeriod[]>();

    periods.forEach(period => {
      const date = timestampToDate(period.payDate);
      const key = format(date, 'MMMM yyyy');
      const existing = grouped.get(key) || [];
      existing.push(period);
      grouped.set(key, existing);
    });

    return Array.from(grouped.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [periods]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
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
        renderSectionHeader={({section}) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pay periods yet</Text>
          </View>
        }
      />
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
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
