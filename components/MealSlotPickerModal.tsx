import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';

import { Colors } from '@/theme';
import { MEAL_SLOTS, type MealSlot } from '@/types/grubhub';

type Props = {
  visible: boolean;
  itemName: string;
  onClose: () => void;
  onSelectSlot: (slot: MealSlot) => void;
};

export default function MealSlotPickerModal({
  visible,
  itemName,
  onClose,
  onSelectSlot,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Log meal</Text>
          <Text style={styles.itemName} numberOfLines={2}>
            {itemName}
          </Text>
          <Text style={styles.subtitle}>Choose a meal slot</Text>

          <View style={styles.slots}>
            {MEAL_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={styles.slotBtn}
                onPress={() => onSelectSlot(slot)}
                activeOpacity={0.85}>
                <Text style={styles.slotText}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemName: {
    color: Colors.maroon,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 14,
  },
  slots: {
    gap: 10,
    marginBottom: 16,
  },
  slotBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  slotText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
