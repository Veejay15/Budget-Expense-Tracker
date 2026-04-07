import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView,
} from 'react-native';
import {mockSignOut, getMockCurrentUser} from '../hooks/useAuth';
import {useSettings} from '../hooks/useSettings';
import {updateSettings} from '../services/mockData';
import {setClient2Anchor} from '../services/paySchedule';
import {format, isFriday, parse} from 'date-fns';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function SettingsScreen() {
  const user = getMockCurrentUser();
  const settings = useSettings();

  const [client1Name, setClient1Name] = useState('');
  const [client2Name, setClient2Name] = useState('');
  const [client1Salary, setClient1Salary] = useState('');
  const [client2Salary, setClient2Salary] = useState('');
  const [anchorDate, setAnchorDate] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync from settings when loaded
  useEffect(() => {
    if (settings) {
      setClient1Name(settings.client1Name);
      setClient2Name(settings.client2Name);
      setClient1Salary(settings.client1Salary.toString());
      setClient2Salary(settings.client2Salary.toString());
      setAnchorDate(settings.client2AnchorDate);
    }
  }, [settings?.client1Name, settings?.client2Name, settings?.client1Salary, settings?.client2Salary, settings?.client2AnchorDate]);

  const handleSaveAll = () => {
    const s1 = parseFloat(client1Salary) || 0;
    const s2 = parseFloat(client2Salary) || 0;

    updateSettings({
      client1Name: client1Name.trim() || 'Client 1',
      client2Name: client2Name.trim() || 'Client 2',
      client1Salary: s1,
      client2Salary: s2,
      client2AnchorDate: anchorDate,
    });

    // Also update the pay schedule anchor if valid
    const parsed = parse(anchorDate, 'yyyy-MM-dd', new Date());
    if (!isNaN(parsed.getTime()) && isFriday(parsed)) {
      setClient2Anchor(parsed);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: mockSignOut},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account */}
      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.displayName ?? '—'}</Text>
        </View>
      </View>

      {/* Client Configuration */}
      <Text style={styles.sectionTitle}>INCOME SOURCES</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>Set client names and default salaries. These will appear on your dashboard and pay period cards.</Text>

        <Text style={styles.inputLabel}>Client 1 Name (5th & 18th)</Text>
        <TextInput style={styles.input} value={client1Name} onChangeText={setClient1Name}
          placeholder="e.g., Company ABC" placeholderTextColor={colors.textMuted} />

        <Text style={styles.inputLabel}>Client 1 Default Salary (₱)</Text>
        <TextInput style={styles.input} value={client1Salary} onChangeText={setClient1Salary}
          placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>Client 2 Name (Bi-weekly Friday)</Text>
        <TextInput style={styles.input} value={client2Name} onChangeText={setClient2Name}
          placeholder="e.g., Freelance XYZ" placeholderTextColor={colors.textMuted} />

        <Text style={styles.inputLabel}>Client 2 Default Salary (₱)</Text>
        <TextInput style={styles.input} value={client2Salary} onChangeText={setClient2Salary}
          placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
      </View>

      {/* Pay Schedule */}
      <Text style={styles.sectionTitle}>PAY SCHEDULE</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{client1Name || 'Client 1'}</Text>
          <Text style={styles.value}>5th & 18th</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.label}>{client2Name || 'Client 2'} (Bi-weekly)</Text>
        <Text style={styles.hint}>Enter a known payday Friday to calculate the bi-weekly cycle</Text>
        <TextInput style={styles.input} value={anchorDate} onChangeText={setAnchorDate}
          placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
      </View>

      {/* Save All Button */}
      <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveAll}>
        <Text style={styles.saveAllText}>{saved ? '✓ All Settings Saved!' : 'Save All Settings'}</Text>
      </TouchableOpacity>

      {/* About */}
      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.card}>
        <Text style={styles.aboutTitle}>💰 Budget + Expense Tracker</Text>
        <Text style={styles.aboutSub}>Built for Veejay & Claire</Text>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.md, paddingBottom: spacing.xl * 2},
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm},
  label: {fontSize: fontSize.md, color: colors.text, fontWeight: '600'},
  value: {fontSize: fontSize.md, color: colors.textSecondary},
  divider: {height: 1, backgroundColor: colors.border, marginVertical: spacing.sm},
  hint: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm},
  inputLabel: {fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs},
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surfaceLight,
  },
  saveAllButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  saveAllText: {color: colors.background, fontWeight: '700', fontSize: fontSize.md},
  aboutTitle: {fontSize: fontSize.md, fontWeight: '700', color: colors.text},
  aboutSub: {fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs},
  signOutButton: {
    marginTop: spacing.lg, backgroundColor: 'transparent', borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.danger,
  },
  signOutText: {color: colors.danger, fontSize: fontSize.md, fontWeight: '700'},
});
