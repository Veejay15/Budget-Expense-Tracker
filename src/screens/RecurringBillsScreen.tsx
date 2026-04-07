import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import {useRecurringBills} from '../hooks/useRecurringBills';
import {
  mockAddRecurringBill,
  mockUpdateRecurringBill,
  mockDeleteRecurringBill,
} from '../services/mockData';
import {RecurringBill} from '../types';
import {formatPeso, parsePesoInput} from '../utils/currency';
import {SwipeableRow} from '../components/SwipeableRow';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function RecurringBillsScreen() {
  const {bills, totalMonthly, loading} = useRecurringBills();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [reminderDays, setReminderDays] = useState('3');

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDay('');
    setReminderDays('3');
    setEditingBill(null);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setDescription(bill.description);
    setAmount(bill.amount.toString());
    setDueDay(bill.dueDay.toString());
    setReminderDays(bill.reminderDaysBefore.toString());
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!description.trim() || !amount.trim() || !dueDay.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const day = parseInt(dueDay, 10);
    if (day < 1 || day > 31) {
      Alert.alert('Error', 'Due day must be between 1 and 31');
      return;
    }

    const data = {
      description: description.trim(),
      amount: parsePesoInput(amount),
      dueDay: day,
      frequency: 'monthly' as const,
      reminderDaysBefore: parseInt(reminderDays, 10) || 3,
      isActive: true,
    };

    if (editingBill) {
      mockUpdateRecurringBill(editingBill.id, data);
    } else {
      mockAddRecurringBill(data);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (bill: RecurringBill) => {
    Alert.alert('Delete Bill', `Delete "${bill.description}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => mockDeleteRecurringBill(bill.id),
      },
    ]);
  };

  const handleToggleActive = (bill: RecurringBill) => {
    mockUpdateRecurringBill(bill.id, {isActive: !bill.isActive});
  };

  const renderBill = ({item}: {item: RecurringBill}) => (
    <SwipeableRow
      onEdit={() => openEdit(item)}
      onDelete={() => handleDelete(item)}>
      <View style={[styles.billRow, !item.isActive && styles.billInactive]}>
        <View style={styles.billInfo}>
          <Text style={[styles.billName, !item.isActive && styles.inactiveText]}>
            {item.description}
          </Text>
          <Text style={styles.billMeta}>
            Due: Day {item.dueDay} | Remind {item.reminderDaysBefore}d before
          </Text>
        </View>
        <View style={styles.billRight}>
          <Text style={[styles.billAmount, !item.isActive && styles.inactiveText]}>
            {formatPeso(item.amount)}
          </Text>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={item.isActive ? '#fff' : '#f4f3f4'}
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

      <FlatList
        data={bills}
        keyExtractor={item => item.id}
        renderItem={renderBill}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recurring bills</Text>
            <Text style={styles.emptySubtext}>
              Add bills to get due date reminders
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBill ? 'Edit Bill' : 'Add Recurring Bill'}
            </Text>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., PLDT Internet"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Amount (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Due Day (1-31)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  placeholderTextColor={colors.textLight}
                  value={dueDay}
                  onChangeText={setDueDay}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Remind (days before)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor={colors.textLight}
                  value={reminderDays}
                  onChangeText={setReminderDays}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingBill ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.expense,
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: 80,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  billInactive: {
    backgroundColor: '#F8F9FA',
  },
  billInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  billName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  billMeta: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.expense,
    marginBottom: spacing.xs,
  },
  inactiveText: {
    color: colors.textLight,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    color: '#fff',
    fontWeight: '700',
  },
});
