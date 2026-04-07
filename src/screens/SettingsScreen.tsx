import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import {mockSignOut, getMockCurrentUser} from '../hooks/useAuth';
import {
  getClient2Anchor,
  setClient2Anchor,
} from '../services/paySchedule';
import {format, isFriday, parse} from 'date-fns';
import {colors, spacing, fontSize, borderRadius} from '../theme';

export function SettingsScreen() {
  const user = getMockCurrentUser();
  const [anchorDate, setAnchorDate] = useState(
    format(getClient2Anchor(), 'yyyy-MM-dd'),
  );
  const [saved, setSaved] = useState(false);

  const handleSaveAnchor = () => {
    const parsed = parse(anchorDate, 'yyyy-MM-dd', new Date());
    if (isNaN(parsed.getTime())) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD.');
      return;
    }
    if (!isFriday(parsed)) {
      Alert.alert('Error', 'The anchor date must be a Friday.');
      return;
    }
    setClient2Anchor(parsed);
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
      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName ?? '—'}</Text>
        </View>
      </View>

      {/* Pay Schedule Section */}
      <Text style={styles.sectionTitle}>Pay Schedule</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Client 1</Text>
          <Text style={styles.value}>5th & 18th of each month</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Client 2 (Bi-weekly Friday)</Text>
        <Text style={styles.hint}>
          Enter a known payday Friday to calculate the bi-weekly cycle
        </Text>
        <View style={styles.anchorRow}>
          <TextInput
            style={styles.anchorInput}
            value={anchorDate}
            onChangeText={setAnchorDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity
            style={styles.saveAnchorButton}
            onPress={handleSaveAnchor}>
            <Text style={styles.saveAnchorText}>
              {saved ? 'Saved!' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <Text style={styles.aboutText}>Budget + Expense Tracker</Text>
        <Text style={styles.aboutSubtext}>
          Built for Veejay & Yana
        </Text>
        <Text style={[styles.aboutSubtext, {marginTop: 4}]}>
          Running in local mock mode (no Firebase)
        </Text>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  value: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  anchorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  anchorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  saveAnchorButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  saveAnchorText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  aboutText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  aboutSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  signOutButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
