import React, {useState} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, Switch,
} from 'react-native';
import {useRecurringBills} from '../hooks/useRecurringBills';
import {mockAddRecurringBill, mockUpdateRecurringBill, mockDeleteRecurringBill} from '../services/mockData';
import {RecurringBill} from '../types';
import {scheduleBillReminder} from '../services/localNotifications';
import notifee from '@notifee/react-native';
import {formatPeso, parsePesoInput} from '../utils/currency';
import {SwipeableRow} from '../components/SwipeableRow';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function RecurringBillsScreen() {
  const {bills, totalMonthly} = useRecurringBills();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [reminderDays, setReminderDays] = useState('3');

  const resetForm = () => { setDescription(''); setAmount(''); setDueDay(''); setReminderDays('3'); setEditingBill(null); };

  const openEdit = (bill: RecurringBill) => {
    setEditingBill(bill); setDescription(bill.description); setAmount(bill.amount.toString());
    setDueDay(bill.dueDay.toString()); setReminderDays(bill.reminderDaysBefore.toString());
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!description.trim() || !amount.trim() || !dueDay.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    const day = parseInt(dueDay, 10);
    if (day < 1 || day > 31) { Alert.alert('Error', 'Due day must be between 1 and 31'); return; }
    const data = {
      description: description.trim(), amount: parsePesoInput(amount), dueDay: day,
      frequency: 'monthly' as const, reminderDaysBefore: parseInt(reminderDays, 10) || 3, isActive: true,
    };
    let billId: string;
    if (editingBill) { mockUpdateRecurringBill(editingBill.id, data); billId = editingBill.id; }
    else { billId = mockAddRecurringBill(data); }

    // Schedule push notification for this bill
    scheduleBillReminder(billId, data.description, data.amount, data.dueDay, data.reminderDaysBefore)
      .catch(() => {});

    setModalVisible(false); resetForm();
  };

  const handleDelete = (bill: RecurringBill) => {
    Alert.alert('Delete Bill', `Delete "${bill.description}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        mockDeleteRecurringBill(bill.id);
        notifee.cancelNotification(`bill-${bill.id}`).catch(() => {});
      }},
    ]);
  };

  const renderBill = ({item}: {item: RecurringBill}) => (
    <SwipeableRow onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)}>
      <View style={[styles.billRow, !item.isActive && styles.billInactive]}>
        <View style={styles.billLeft}>
          <View style={styles.billIcon}><Text style={{fontSize: 18}}>🧾</Text></View>
          <View style={styles.billInfo}>
            <Text style={[styles.billName, !item.isActive && styles.inactiveText]}>{item.description}</Text>
            <Text style={styles.billMeta}>Due: Day {item.dueDay} · Remind {item.reminderDaysBefore}d before</Text>
          </View>
        </View>
        <View style={styles.billRight}>
          <Text style={[styles.billAmount, !item.isActive && styles.inactiveText]}>{formatPeso(item.amount)}</Text>
          <Switch
            value={item.isActive}
            onValueChange={() => mockUpdateRecurringBill(item.id, {isActive: !item.isActive})}
            trackColor={{false: colors.surfaceLight, true: colors.primary}}
            thumbColor="#fff"
          />
        </View>
      </View>
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Monthly Bills</Text>
        <Text style={styles.summaryAmount}>{formatPeso(totalMonthly)}</Text>
      </View>

      <FlatList data={bills} keyExtractor={item => item.id} renderItem={renderBill}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{fontSize: 48}}>📋</Text>
            <Text style={styles.emptyText}>No recurring bills</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingBill ? 'Edit Bill' : 'Add Recurring Bill'}</Text>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.input} placeholder="e.g., PLDT Internet" placeholderTextColor={colors.textMuted}
              value={description} onChangeText={setDescription} />

            <Text style={styles.inputLabel}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textMuted}
              value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <View style={styles.inputRow}>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Due Day (1-31)</Text>
                <TextInput style={styles.input} placeholder="15" placeholderTextColor={colors.textMuted}
                  value={dueDay} onChangeText={setDueDay} keyboardType="numeric" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Remind (days)</Text>
                <TextInput style={styles.input} placeholder="3" placeholderTextColor={colors.textMuted}
                  value={reminderDays} onChangeText={setReminderDays} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingBill ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  summary: {
    backgroundColor: colors.surface, padding: spacing.lg, margin: spacing.lg,
    borderRadius: borderRadius.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  summaryLabel: {fontSize: fontSize.sm, color: colors.textSecondary},
  summaryAmount: {fontSize: fontSize.xxl, fontWeight: '700', color: colors.expense, marginTop: spacing.xs},
  list: {paddingBottom: 80},
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  billInactive: {opacity: 0.5},
  billLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm},
  billIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  billInfo: {flex: 1},
  billName: {fontSize: fontSize.md, color: colors.text, fontWeight: '600'},
  billMeta: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2},
  billRight: {alignItems: 'flex-end'},
  billAmount: {fontSize: fontSize.md, fontWeight: '700', color: colors.expense, marginBottom: spacing.xs},
  inactiveText: {color: colors.textMuted},
  empty: {alignItems: 'center', paddingVertical: spacing.xl * 2},
  emptyText: {fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing.md},
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  fabText: {color: colors.background, fontSize: 28, fontWeight: '600', marginTop: -2},
  modalOverlay: {flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '85%',
  },
  modalTitle: {fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center'},
  inputLabel: {fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm},
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surfaceLight,
  },
  inputRow: {flexDirection: 'row', gap: spacing.md},
  modalButtons: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg},
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: {fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600'},
  saveBtn: {flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center'},
  saveBtnText: {fontSize: fontSize.md, color: colors.background, fontWeight: '700'},
});
