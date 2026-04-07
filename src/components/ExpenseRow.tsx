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

export function ExpenseRow({expense, onEdit, onDelete, onTogglePaid}: Props) {
  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <TouchableOpacity
        style={[styles.container, expense.isPaid && styles.paidContainer]}
        onPress={onTogglePaid}
        activeOpacity={0.7}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.checkbox,
              expense.isPaid && styles.checkboxChecked,
            ]}>
            {expense.isPaid && <Text style={styles.checkmark}>✓</Text>}
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
        <Text
          style={[
            styles.amount,
            expense.isPaid && styles.paidText,
          ]}>
          {formatPeso(expense.amount)}
        </Text>
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
    backgroundColor: '#F8F9FA',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  textSection: {
    flex: 1,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.expense,
  },
  paidText: {
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
});
