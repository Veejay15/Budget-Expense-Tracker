import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BillWithDueDate, getBillIcon, formatDueLabel} from '../../utils/billDates';
import {formatPeso} from '../../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../../theme';

interface BillCardProps {
  bill: BillWithDueDate;
}

export function BillCard({bill}: BillCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PAYABLE</Text>
        </View>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{getBillIcon(bill.description)}</Text>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>{bill.description}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{bill.description}</Text>

      <Text style={styles.amount}>{formatPeso(bill.amount)}</Text>
      <Text style={styles.dueLabel}>{formatDueLabel(bill)}</Text>
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
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.5,
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
});
