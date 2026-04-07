import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSettings} from '../hooks/useSettings';
import {mockCreatePayPeriod, mockAddExpense, MockTimestamp, getSettings, mockOnRecurringBills} from '../services/mockData';
import {scheduleBillReminder} from '../services/localNotifications';
import {RecurringBill} from '../types';
import {parsePesoInput} from '../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function AddPayPeriodScreen() {
  const navigation = useNavigation();
  const settings = useSettings();

  const [selectedClient, setSelectedClient] = useState<'client1' | 'client2'>('client1');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [day, setDay] = useState(new Date().getDate().toString());
  const [salary, setSalary] = useState('');

  // Update salary default when client changes
  const handleClientSelect = (client: 'client1' | 'client2') => {
    setSelectedClient(client);
    const s = getSettings();
    setSalary(client === 'client1' ? s.client1Salary.toString() : s.client2Salary.toString());
  };

  // Set salary default on first render
  React.useEffect(() => {
    const s = getSettings();
    setSalary(s.client1Salary.toString());
  }, []);

  const handleSave = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1; // JS months are 0-indexed
    const d = parseInt(day, 10);

    if (!y || m < 0 || m > 11 || !d || d < 1 || d > 31) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    const parsedSalary = parsePesoInput(salary);
    if (parsedSalary <= 0) {
      Alert.alert('Error', 'Please enter a valid salary amount');
      return;
    }

    const payDate = new Date(y, m, d);
    const s = getSettings();
    const clientName = selectedClient === 'client1' ? s.client1Name : s.client2Name;

    // Create label
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[m]} ${d} Pay`;

    // Simple period range: 2 weeks before pay date
    const startDate = new Date(payDate);
    startDate.setDate(startDate.getDate() - 14);

    const periodId = mockCreatePayPeriod({
      label,
      type: selectedClient,
      startDate: MockTimestamp.fromDate(startDate) as any,
      endDate: MockTimestamp.fromDate(payDate) as any,
      payDate: MockTimestamp.fromDate(payDate) as any,
      salary: parsedSalary,
      createdBy: 'mock_user',
    });

    // Auto-populate recurring bills as expenses
    const bills: RecurringBill[] = [];
    const unsub = mockOnRecurringBills(items => { bills.push(...items); });
    unsub(); // just need the snapshot

    for (const bill of bills) {
      if (bill.isActive) {
        mockAddExpense(periodId, {
          description: bill.description,
          amount: bill.amount,
          isPaid: false,
          category: 'Bills',
          createdBy: 'mock_user',
        });

        // Schedule notification for this bill
        scheduleBillReminder(
          bill.id, bill.description, bill.amount, bill.dueDay, bill.reminderDaysBefore,
        ).catch(() => {});
      }
    }

    navigation.goBack();
  };

  const c1Name = settings?.client1Name || 'Client 1';
  const c2Name = settings?.client2Name || 'Client 2';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Client Selection */}
        <Text style={styles.label}>Select Client</Text>
        <View style={styles.clientRow}>
          <TouchableOpacity
            style={[styles.clientChip, selectedClient === 'client1' && styles.clientChipActive]}
            onPress={() => handleClientSelect('client1')}>
            <Text style={styles.clientIcon}>💼</Text>
            <Text style={[styles.clientText, selectedClient === 'client1' && styles.clientTextActive]}>
              {c1Name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.clientChip, selectedClient === 'client2' && styles.clientChipActive2]}
            onPress={() => handleClientSelect('client2')}>
            <Text style={styles.clientIcon}>🏢</Text>
            <Text style={[styles.clientText, selectedClient === 'client2' && styles.clientTextActive]}>
              {c2Name}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pay Date */}
        <Text style={styles.label}>Pay Date</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Year</Text>
            <TextInput style={styles.dateInput} value={year} onChangeText={setYear}
              keyboardType="numeric" maxLength={4} />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Month</Text>
            <TextInput style={styles.dateInput} value={month} onChangeText={setMonth}
              keyboardType="numeric" maxLength={2} />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Day</Text>
            <TextInput style={styles.dateInput} value={day} onChangeText={setDay}
              keyboardType="numeric" maxLength={2} />
          </View>
        </View>

        {/* Salary */}
        <Text style={styles.label}>Salary Amount (₱)</Text>
        <TextInput style={styles.input} value={salary} onChangeText={setSalary}
          keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textMuted} />

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Create Pay Period</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.lg},
  label: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary,
    marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  clientRow: {flexDirection: 'row', gap: spacing.md},
  clientChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  clientChipActive: {borderColor: colors.primary, backgroundColor: colors.surfaceHighlight},
  clientChipActive2: {borderColor: '#8B5CF6', backgroundColor: colors.surfaceHighlight},
  clientIcon: {fontSize: 20},
  clientText: {fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600'},
  clientTextActive: {color: colors.text},
  dateRow: {flexDirection: 'row', gap: spacing.md},
  dateField: {flex: 1},
  dateLabel: {fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs},
  dateInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.lg,
    color: colors.text, textAlign: 'center', fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.lg,
    color: colors.text, fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl,
  },
  saveButtonText: {color: colors.background, fontSize: fontSize.md, fontWeight: '700'},
});
