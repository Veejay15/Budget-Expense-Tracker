import React, {useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView,
} from 'react-native';
import {mockSignOut, getMockCurrentUser} from '../hooks/useAuth';
import {getClient2Anchor, setClient2Anchor} from '../services/paySchedule';
import {format, isFriday, parse} from 'date-fns';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function SettingsScreen() {
  const user = getMockCurrentUser();
  const [anchorDate, setAnchorDate] = useState(format(getClient2Anchor(), 'yyyy-MM-dd'));
  const [client1Name, setClient1Name] = useState('Client 1');
  const [client2Name, setClient2Name] = useState('Client 2');
  const [saved, setSaved] = useState(false);
  const [namesSaved, setNamesSaved] = useState(false);

  const handleSaveAnchor = () => {
    const parsed = parse(anchorDate, 'yyyy-MM-dd', new Date());
    if (isNaN(parsed.getTime())) { Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD.'); return; }
    if (!isFriday(parsed)) { Alert.alert('Error', 'The anchor date must be a Friday.'); return; }
    setClient2Anchor(parsed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveNames = () => {
    setNamesSaved(true);
    setTimeout(() => setNamesSaved(false), 2000);
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
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName ?? '—'}</Text>
        </View>
      </View>

      {/* Client Names */}
      <Text style={styles.sectionTitle}>CLIENT NAMES</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>Customize the names for your income sources</Text>
        <Text style={styles.inputLabel}>Client 1 (5th & 18th)</Text>
        <TextInput
          style={styles.input} value={client1Name} onChangeText={setClient1Name}
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.inputLabel}>Client 2 (Bi-weekly Friday)</Text>
        <TextInput
          style={styles.input} value={client2Name} onChangeText={setClient2Name}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveNames}>
          <Text style={styles.saveButtonText}>{namesSaved ? '✓ Saved!' : 'Save Names'}</Text>
        </TouchableOpacity>
      </View>

      {/* Pay Schedule */}
      <Text style={styles.sectionTitle}>PAY SCHEDULE</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{client1Name}</Text>
          <Text style={styles.value}>5th & 18th of each month</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.label}>{client2Name} (Bi-weekly Friday)</Text>
        <Text style={styles.hint}>Enter a known payday Friday to calculate the bi-weekly cycle</Text>
        <View style={styles.anchorRow}>
          <TextInput style={styles.anchorInput} value={anchorDate} onChangeText={setAnchorDate}
            placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          <TouchableOpacity style={styles.anchorButton} onPress={handleSaveAnchor}>
            <Text style={styles.anchorButtonText}>{saved ? '✓' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.card}>
        <Text style={styles.aboutTitle}>💰 Budget + Expense Tracker</Text>
        <Text style={styles.aboutSub}>Built for Veejay & Claire</Text>
        <Text style={styles.aboutMuted}>Running in local mock mode</Text>
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
  content: {padding: spacing.md, paddingBottom: spacing.xl},
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm,
  },
  label: {fontSize: fontSize.md, color: colors.text, fontWeight: '600'},
  value: {fontSize: fontSize.md, color: colors.textSecondary},
  divider: {height: 1, backgroundColor: colors.border, marginVertical: spacing.xs},
  hint: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm},
  inputLabel: {fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs},
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surfaceLight,
  },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.sm, alignItems: 'center', marginTop: spacing.md,
  },
  saveButtonText: {color: colors.background, fontWeight: '700', fontSize: fontSize.sm},
  anchorRow: {flexDirection: 'row', gap: spacing.sm},
  anchorInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surfaceLight,
  },
  anchorButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, justifyContent: 'center',
  },
  anchorButtonText: {color: colors.background, fontWeight: '700', fontSize: fontSize.sm},
  aboutTitle: {fontSize: fontSize.md, fontWeight: '700', color: colors.text},
  aboutSub: {fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs},
  aboutMuted: {fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs},
  signOutButton: {
    marginTop: spacing.xl, backgroundColor: 'transparent', borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.danger,
  },
  signOutText: {color: colors.danger, fontSize: fontSize.md, fontWeight: '700'},
});
