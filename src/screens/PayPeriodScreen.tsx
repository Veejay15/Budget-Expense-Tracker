import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {usePayPeriod} from '../hooks/usePayPeriod';
import {
  mockUpdatePayPeriod,
  mockDeleteExpense,
  mockToggleExpensePaid,
} from '../services/mockData';
import {ExpenseRow} from '../components/ExpenseRow';
import {RemainingBudget} from '../components/RemainingBudget';
import {parsePesoInput, formatPeso} from '../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'PayPeriod'>;
type RoutePropType = RouteProp<RootStackParamList, 'PayPeriod'>;

export function PayPeriodScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const {periodId} = route.params;
  const {payPeriod, expenses, totalExpenses, remaining, loading} =
    usePayPeriod(periodId);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');

  const handleSaveSalary = () => {
    const amount = parsePesoInput(salaryInput);
    mockUpdatePayPeriod(periodId, {salary: amount});
    setEditingSalary(false);
  };

  const handleDeleteExpense = (expenseId: string, description: string) => {
    Alert.alert('Delete Expense', `Delete "${description}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => mockDeleteExpense(periodId, expenseId),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ExpenseRow
            expense={item}
            onEdit={() =>
              navigation.navigate('AddExpense', {periodId, expense: item})
            }
            onDelete={() => handleDeleteExpense(item.id, item.description)}
            onTogglePaid={() =>
              mockToggleExpensePaid(periodId, item.id, !item.isPaid)
            }
          />
        )}
        ListHeaderComponent={
          <View>
            {/* Salary Input */}
            <TouchableOpacity
              style={styles.salarySection}
              onPress={() => {
                setSalaryInput(payPeriod?.salary?.toString() ?? '0');
                setEditingSalary(true);
              }}>
              {editingSalary ? (
                <View style={styles.salaryEditRow}>
                  <Text style={styles.salaryLabel}>Salary: ₱</Text>
                  <TextInput
                    style={styles.salaryInput}
                    value={salaryInput}
                    onChangeText={setSalaryInput}
                    keyboardType="numeric"
                    autoFocus
                    onBlur={handleSaveSalary}
                    onSubmitEditing={handleSaveSalary}
                  />
                </View>
              ) : (
                <View style={styles.salaryEditRow}>
                  <View style={styles.salaryLeft}>
                    <Text style={styles.salaryIcon}>💰</Text>
                    <Text style={styles.salaryLabel}>Salary</Text>
                  </View>
                  <Text style={styles.salaryValue}>
                    {formatPeso(payPeriod?.salary ?? 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <RemainingBudget
              salary={payPeriod?.salary ?? 0}
              totalExpenses={totalExpenses}
            />

            <Text style={styles.expensesHeader}>
              Expenses ({expenses.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense', {periodId})}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background},
  list: {paddingBottom: 80},
  salarySection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  salaryEditRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  salaryLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  salaryIcon: {fontSize: 20},
  salaryLabel: {fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600'},
  salaryValue: {fontSize: fontSize.xl, fontWeight: '700', color: colors.income},
  salaryInput: {
    fontSize: fontSize.xl, fontWeight: '700', color: colors.income,
    borderBottomWidth: 2, borderBottomColor: colors.primary,
    padding: 0, minWidth: 120, textAlign: 'right',
  },
  expensesHeader: {
    fontSize: fontSize.md, fontWeight: '700', color: colors.text,
    marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs,
  },
  empty: {alignItems: 'center', paddingVertical: spacing.xl},
  emptyIcon: {fontSize: 40, marginBottom: spacing.sm},
  emptyText: {fontSize: fontSize.md, color: colors.textSecondary},
  emptySubtext: {fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs},
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
  },
  fabText: {color: colors.background, fontSize: 28, fontWeight: '600', marginTop: -2},
});
