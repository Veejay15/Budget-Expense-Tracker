import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, fontSize} from '../theme';
import {formatPeso} from '../utils/currency';

interface Props {
  salary: number;
  totalExpenses: number;
}

export function RemainingBudget({salary, totalExpenses}: Props) {
  const remaining = salary - totalExpenses;
  const color =
    remaining > 0
      ? colors.remaining.positive
      : remaining < 0
      ? colors.remaining.negative
      : colors.remaining.zero;

  const percentage = salary > 0 ? (totalExpenses / salary) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Salary</Text>
        <Text style={[styles.amount, {color: colors.income}]}>
          {formatPeso(salary)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Total Expenses</Text>
        <Text style={[styles.amount, {color: colors.expense}]}>
          {formatPeso(totalExpenses)}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.remainingLabel}>Remaining</Text>
        <Text style={[styles.remainingAmount, {color}]}>
          {formatPeso(remaining)}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: percentage > 90 ? colors.danger : colors.primary,
            },
          ]}
        />
      </View>
      <Text style={styles.percentageText}>
        {percentage.toFixed(0)}% of salary spent
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  remainingLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  remainingAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});
