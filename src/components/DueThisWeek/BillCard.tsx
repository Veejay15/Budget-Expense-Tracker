import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {BillWithDueDate, getBillIcon, formatDueLabel} from '../../utils/billDates';
import {formatPeso} from '../../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../../theme';

interface BillCardProps {
  bill: BillWithDueDate;
  isPaid: boolean;
  onTogglePaid: () => void;
}

export function BillCard({bill, isPaid, onTogglePaid}: BillCardProps) {
  return (
    <View style={[styles.card, isPaid && styles.cardPaid]}>
      <View style={styles.topRow}>
        <View style={[styles.badge, isPaid && styles.badgePaid]}>
          <Text style={[styles.badgeText, isPaid && styles.badgeTextPaid]}>
            {isPaid ? 'PAID' : 'PAYABLE'}
          </Text>
        </View>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{getBillIcon(bill.description)}</Text>
        </View>
      </View>

      <Text style={[styles.name, isPaid && styles.textPaid]} numberOfLines={1}>
        {bill.description}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>{bill.description}</Text>

      <Text style={[styles.amount, isPaid && styles.textPaid]}>
        {formatPeso(bill.amount)}
      </Text>
      <Text style={styles.dueLabel}>{formatDueLabel(bill)}</Text>

      <TouchableOpacity style={[styles.paidBtn, isPaid && styles.paidBtnActive]} onPress={onTogglePaid}>
        <Text style={[styles.paidBtnText, isPaid && styles.paidBtnTextActive]}>
          {isPaid ? '✓ Paid' : 'Mark Paid'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_WIDTH = 165;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPaid: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgePaid: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.5,
  },
  badgeTextPaid: {
    color: colors.income,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  textPaid: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  dueLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  paidBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  paidBtnActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.income,
  },
  paidBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paidBtnTextActive: {
    color: colors.income,
  },
});
