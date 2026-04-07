import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Expense} from '../types';
import {formatPeso} from '../utils/currency';
import {SwipeableRow} from './SwipeableRow';
import {colors, spacing, fontSize} from '../theme';

interface Props {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Bills: '🧾',
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Health: '💊',
  Entertainment: '🎬',
  Other: '📦',
};

export function ExpenseRow({expense, onEdit, onDelete, onTogglePaid}: Props) {
  const icon = CATEGORY_ICONS[expense.category ?? ''] ?? '📦';

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <TouchableOpacity
        style={[styles.container, expense.isPaid && styles.paidContainer]}
        onPress={onTogglePaid}
        activeOpacity={0.7}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.categoryIcon}>{icon}</Text>
          </View>
          <View style={styles.textSection}>
            <Text
              style={[
                styles.description,
                expense.isPaid && styles.paidText,
              ]}
              numberOfLines={1}>
              {expense.description}
            </Text>
            {expense.category && (
              <Text style={styles.category}>{expense.category}</Text>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text
            style={[
              styles.amount,
              expense.isPaid && styles.paidAmount,
            ]}>
            {formatPeso(expense.amount)}
          </Text>
          {expense.isPaid && (
            <Text style={styles.paidBadge}>Paid</Text>
          )}
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paidContainer: {
    opacity: 0.6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  categoryIcon: {
    fontSize: 18,
  },
  textSection: {
    flex: 1,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.expense,
  },
  paidText: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  paidAmount: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  paidBadge: {
    fontSize: fontSize.xs,
    color: colors.income,
    fontWeight: '600',
    marginTop: 2,
  },
});
