import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/theme';
import { MEAL_SLOTS, type MealSlot, type PendingOrder } from '@/types/grubhub';

type Props = {
  visible: boolean;
  order: PendingOrder | null;
  onClose: () => void;
  onSave: (updates: {
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meal_slot: MealSlot;
    items: string[];
  }) => void;
};

function parseIntField(value: string, fallback: number) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function EditPendingOrderSheet({
  visible,
  order,
  onClose,
  onSave,
}: Props) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealSlot, setMealSlot] = useState<MealSlot>('Lunch');
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!order) return;
    setMealName(order.meal_name);
    setCalories(String(order.calories));
    setProtein(String(order.protein));
    setCarbs(String(order.carbs));
    setFat(String(order.fat));
    setMealSlot(order.meal_slot);
    setItems([...order.items]);
    setNewItem('');
  }, [order]);

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, trimmed]);
    setNewItem('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!order) return;
    onSave({
      meal_name: mealName.trim() || order.meal_name,
      calories: parseIntField(calories, order.calories),
      protein: parseIntField(protein, order.protein),
      carbs: parseIntField(carbs, order.carbs),
      fat: parseIntField(fat, order.fat),
      meal_slot: mealSlot,
      items,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit Order</Text>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Meal name</Text>
            <TextInput
              style={styles.input}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Meal name"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>Macros</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>kcal</Text>
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>P (g)</Text>
                <TextInput
                  style={styles.input}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>C (g)</Text>
                <TextInput
                  style={styles.input}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>F (g)</Text>
                <TextInput
                  style={styles.input}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <Text style={styles.label}>Meal slot</Text>
            <View style={styles.slotRow}>
              {MEAL_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotChip,
                    mealSlot === slot && styles.slotChipActive,
                  ]}
                  onPress={() => setMealSlot(slot)}>
                  <Text
                    style={[
                      styles.slotChipText,
                      mealSlot === slot && styles.slotChipTextActive,
                    ]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Items</Text>
            {items.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(index)}
                  hitSlop={8}>
                  <Text style={styles.itemRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, styles.addItemInput]}
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Add drink or side..."
                placeholderTextColor={Colors.textSecondary}
                onSubmitEditing={handleAddItem}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 420,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.macroCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  macroField: {
    flex: 1,
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.macroCard,
  },
  slotChipActive: {
    backgroundColor: Colors.maroon,
  },
  slotChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  slotChipTextActive: {
    color: Colors.white,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.macroCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemText: {
    color: Colors.white,
    fontSize: 15,
    flex: 1,
  },
  itemRemove: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '600',
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
  },
  addBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.macroCard,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.white,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.maroon,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
