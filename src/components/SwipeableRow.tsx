import React, {useRef} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import {colors, spacing, fontSize} from '../theme';

interface Props {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SwipeableRow({children, onEdit, onDelete}: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => swipeableRef.current?.close();

  const renderRightActions = () => {
    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.action, styles.editAction]}
            onPress={() => {
              close();
              onEdit();
            }}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.action, styles.deleteAction]}
            onPress={() => {
              close();
              onDelete();
            }}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  editAction: {
    backgroundColor: colors.primary,
  },
  deleteAction: {
    backgroundColor: colors.danger,
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
