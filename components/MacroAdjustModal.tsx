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
import type { MacroRatios } from '@/utils/nutrition';

const MACRO_LABELS: Record<keyof MacroRatios, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

type Props = {
  visible: boolean;
  macroKey: keyof MacroRatios | null;
  value: number;
  onClose: () => void;
  onChange: (percent: number) => void;
};

export default function MacroAdjustModal({
  visible,
  macroKey,
  value,
  onClose,
  onChange,
}: Props) {
  if (!macroKey) return null;

  const label = MACRO_LABELS[macroKey];

  const step = (delta: number) => {
    onChange(value + delta);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.subtitle}>Adjust percentage (others auto-balance to 100%)</Text>

          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => step(-5)}
              activeOpacity={0.8}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.value}>{value}%</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => step(5)}
              activeOpacity={0.8}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
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
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.macroCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  value: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
