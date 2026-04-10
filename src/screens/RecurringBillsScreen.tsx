import React, {useState, useMemo} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, Switch, ScrollView,
} from 'react-native';
import {useRecurringBills} from '../hooks/useRecurringBills';
import {usePayPeriods} from '../hooks/usePayPeriods';
import {useSettings} from '../hooks/useSettings';
import {
  mockAddRecurringBill, mockUpdateRecurringBill, mockDeleteRecurringBill,
  mockAddExpense,
} from '../services/mockData';
import {RecurringBill, PayPeriod} from '../types';
import {scheduleBillReminder} from '../services/localNotifications';
import notifee from '@notifee/react-native';
import {formatPeso, parsePesoInput} from '../utils/currency';
import {SwipeableRow} from '../components/SwipeableRow';
import {colors, spacing, fontSize, borderRadius} from '../theme';
import {isSameMonth} from 'date-fns';

export function RecurringBillsScreen() {
  const {bills, totalMonthly} = useRecurringBills();
  const {periods} = usePayPeriods();
  const settings = useSettings();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [reminderDays, setReminderDays] = useState('3');
  const [selectedClientType, setSelectedClientType] = useState<'client1' | 'client2' | undefined>(undefined);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);

  const c1Name = settings?.client1Name || 'Client 1';
  const c2Name = settings?.client2Name || 'Client 2';

  // Get paydays filtered by selected client
  const availablePaydays = useMemo(() => {
    if (!selectedClientType) return [];
    return periods.filter(p => p.type === selectedClientType);
  }, [periods, selectedClientType]);

  const resetForm = () => {
    setDescription(''); setAmount(''); setDueDay(''); setReminderDays('3');
    setEditingBill(null); setSelectedClientType(undefined); setSelectedPeriodId(undefined);
  };

  const openEdit = (bill: RecurringBill) => {
    setEditingBill(bill); setDescription(bill.description); setAmount(bill.amount.toString());
    setDueDay(bill.dueDay.toString()); setReminderDays(bill.reminderDaysBefore.toString());
    setSelectedClientType(bill.clientType); setSelectedPeriodId(undefined);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!description.trim() || !amount.trim() || !dueDay.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    const day = parseInt(dueDay, 10);
    if (day < 1 || day > 31) { Alert.alert('Error', 'Due day must be between 1 and 31'); return; }
    const data = {
      description: description.trim(), amount: parsePesoInput(amount), dueDay: day,
      frequency: 'monthly' as const, reminderDaysBefore: parseInt(reminderDays, 10) || 3,
      isActive: true, clientType: selectedClientType,
    };
    let billId: string;
    if (editingBill) { mockUpdateRecurringBill(editingBill.id, data); billId = editingBill.id; }
    else { billId = mockAddRecurringBill(data); }

    // If a specific payday was selected, auto-add as expense to that period
    if (!editingBill && selectedPeriodId) {
      mockAddExpense(selectedPeriodId, {
        description: data.description,
        amount: data.amount,
        isPaid: false,
        category: 'Bills',
        createdBy: 'mock_user',
      });
    }

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

  const handleClientSelect = (client: 'client1' | 'client2') => {
    if (selectedClientType === client) {
      setSelectedClientType(undefined);
      setSelectedPeriodId(undefined);
    } else {
      setSelectedClientType(client);
      setSelectedPeriodId(undefined);
    }
  };

  const getPaydayLabel = (period: PayPeriod) => {
    const payDate = (period.payDate as any)._date || (period.payDate as any).toDate?.();
    if (!payDate) return period.label;
    return period.label;
  };

  const renderBill = ({item}: {item: RecurringBill}) => (
    <SwipeableRow onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)}>
      <View style={[styles.billRow, !item.isActive && styles.billInactive]}>
        <View style={styles.billLeft}>
          <View style={styles.billIcon}><Text style={{fontSize: 18}}>🧾</Text></View>
          <View style={styles.billInfo}>
            <Text style={[styles.billName, !item.isActive && styles.inactiveText]}>{item.description}</Text>
            <Text style={styles.billMeta}>
              Due: Day {item.dueDay} · Remind {item.reminderDaysBefore}d before
            </Text>
            {item.clientType && (
              <View style={[styles.clientTag, item.clientType === 'client2' && styles.clientTag2]}>
                <Text style={[styles.clientTagText, item.clientType === 'client2' && styles.clientTagText2]}>
                  {item.clientType === 'client1' ? c1Name : c2Name}
                </Text>
              </View>
            )}
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
            <ScrollView showsVerticalScrollIndicator={false}>
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

              {/* Client Selection */}
              <Text style={styles.inputLabel}>Assign to Client (optional)</Text>
              <View style={styles.clientRow}>
                <TouchableOpacity
                  style={[styles.clientChip, selectedClientType === 'client1' && styles.clientChipActive]}
                  onPress={() => handleClientSelect('client1')}>
                  <Text style={styles.clientIcon}>💼</Text>
                  <Text style={[styles.clientChipText, selectedClientType === 'client1' && styles.clientChipTextActive]}>
                    {c1Name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.clientChip, selectedClientType === 'client2' && styles.clientChipActive2]}
                  onPress={() => handleClientSelect('client2')}>
                  <Text style={styles.clientIcon}>🏢</Text>
                  <Text style={[styles.clientChipText, selectedClientType === 'client2' && styles.clientChipTextActive]}>
                    {c2Name}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Payday Selection (only when adding, not editing) */}
              {!editingBill && selectedClientType && availablePaydays.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Add to Payday</Text>
                  <View style={styles.paydayList}>
                    {availablePaydays.map(period => (
                      <TouchableOpacity
                        key={period.id}
                        style={[
                          styles.paydayChip,
                          selectedPeriodId === period.id && styles.paydayChipActive,
                        ]}
                        onPress={() => setSelectedPeriodId(
                          selectedPeriodId === period.id ? undefined : period.id,
                        )}>
                        <Text style={[
                          styles.paydayChipText,
                          selectedPeriodId === period.id && styles.paydayChipTextActive,
                        ]}>
                          {getPaydayLabel(period)}
                        </Text>
                        <Text style={styles.paydaySalary}>{formatPeso(period.salary)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {!editingBill && selectedClientType && availablePaydays.length === 0 && (
                <Text style={styles.noPaydays}>
                  No paydays found for {selectedClientType === 'client1' ? c1Name : c2Name}. Create a payday first.
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editingBill ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  clientTag: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: 'rgba(232, 168, 56, 0.15)',
    paddingHorizontal: spacing.sm, paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  clientTag2: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  clientTagText: {
    fontSize: 9, fontWeight: '700', color: colors.primary, letterSpacing: 0.3,
  },
  clientTagText2: {
    color: '#8B5CF6',
  },
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
  // Client selection
  clientRow: {flexDirection: 'row', gap: spacing.sm},
  clientChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  clientChipActive: {borderColor: colors.primary, backgroundColor: 'rgba(232, 168, 56, 0.1)'},
  clientChipActive2: {borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)'},
  clientIcon: {fontSize: 16},
  clientChipText: {fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600'},
  clientChipTextActive: {color: colors.text},
  // Payday selection
  paydayList: {gap: spacing.sm},
  paydayChip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  paydayChipActive: {borderColor: colors.primary, backgroundColor: 'rgba(232, 168, 56, 0.1)'},
  paydayChipText: {fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600'},
  paydayChipTextActive: {color: colors.text},
  paydaySalary: {fontSize: fontSize.xs, color: colors.textMuted},
  noPaydays: {fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.xs},
  // Buttons
  modalButtons: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg},
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: {fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600'},
  saveBtn: {flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center'},
  saveBtnText: {fontSize: fontSize.md, color: colors.background, fontWeight: '700'},
});
