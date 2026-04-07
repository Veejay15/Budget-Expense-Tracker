import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {mockAddExpense, mockUpdateExpense} from '../services/mockData';
import {parsePesoInput} from '../utils/currency';
import {colors, spacing, fontSize, borderRadius} from '../theme';

type RoutePropType = RouteProp<RootStackParamList, 'AddExpense'>;

const CATEGORIES = [
  {name: 'Bills', icon: '🧾'},
  {name: 'Food', icon: '🍔'},
  {name: 'Transport', icon: '🚗'},
  {name: 'Shopping', icon: '🛍️'},
  {name: 'Health', icon: '💊'},
  {name: 'Entertainment', icon: '🎬'},
  {name: 'Other', icon: '📦'},
];

export function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const {periodId, expense} = route.params;
  const isEditing = !!expense;

  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [category, setCategory] = useState(expense?.category ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!description.trim()) { Alert.alert('Error', 'Please enter a description'); return; }
    const parsedAmount = parsePesoInput(amount);
    if (parsedAmount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }

    setSaving(true);
    try {
      if (isEditing && expense) {
        mockUpdateExpense(periodId, expense.id, {
          description: description.trim(), amount: parsedAmount, category: category || undefined,
        });
      } else {
        mockAddExpense(periodId, {
          description: description.trim(), amount: parsedAmount,
          isPaid: false, category: category || undefined, createdBy: 'mock_user',
        });
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input} placeholder="e.g., Electric bill, Groceries"
          placeholderTextColor={colors.textMuted} value={description}
          onChangeText={setDescription} autoFocus
        />

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input} placeholder="0.00"
          placeholderTextColor={colors.textMuted} value={amount}
          onChangeText={setAmount} keyboardType="numeric"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.categoryChip, category === cat.name && styles.categoryChipActive]}
              onPress={() => setCategory(category === cat.name ? '' : cat.name)}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryText, category === cat.name && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
          </Text>
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
    marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, color: colors.text,
  },
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  categoryChipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  categoryIcon: {fontSize: 14},
  categoryText: {fontSize: fontSize.sm, color: colors.textSecondary},
  categoryTextActive: {color: colors.background, fontWeight: '600'},
  saveButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl,
  },
  saveButtonDisabled: {opacity: 0.6},
  saveButtonText: {color: colors.background, fontSize: fontSize.md, fontWeight: '700'},
});
