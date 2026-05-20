import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/theme';
import type { CalendarMeal } from '@/types/calendar';

function formatSource(source: CalendarMeal['source']) {
  switch (source) {
    case 'dining_hall':
      return 'Dining Hall';
    case 'grubhub':
      return 'Grubhub';
    case 'manual':
      return 'Manual';
  }
}

type Props = {
  visible: boolean;
  meal: CalendarMeal | null;
  onClose: () => void;
  onToggleFavorite: () => void;
};

export default function MealDetailSheet({
  visible,
  meal,
  onClose,
  onToggleFavorite,
}: Props) {
  if (!meal) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {meal.meal_name}
              </Text>
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={styles.bookmarkBtn}
                hitSlop={12}
                accessibilityLabel={
                  meal.is_favorite ? 'Remove favorite' : 'Add favorite'
                }>
                <SymbolView
                  name={{
                    ios: meal.is_favorite ? 'bookmark.fill' : 'bookmark',
                    android: meal.is_favorite ? 'bookmark' : 'bookmark_border',
                    web: meal.is_favorite ? 'bookmark' : 'bookmark_border',
                  }}
                  tintColor={meal.is_favorite ? Colors.maroon : Colors.textSecondary}
                  size={26}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.meta}>
              {formatSource(meal.source)} · {meal.meal_slot}
            </Text>

            <View style={styles.macroSummary}>
              <MacroPill label="Calories" value={`${meal.calories}`} unit="kcal" />
              <MacroPill label="Protein" value={`${meal.protein}`} unit="g" />
              <MacroPill label="Carbs" value={`${meal.carbs}`} unit="g" />
              <MacroPill label="Fat" value={`${meal.fat}`} unit="g" />
            </View>

            <Text style={styles.sectionLabel}>Items</Text>
            <ScrollView
              style={styles.itemsScroll}
              showsVerticalScrollIndicator={false}>
              {meal.items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemKcal}>{item.calories} kcal</Text>
                  <Text style={styles.itemMacros}>
                    P {item.protein}g · C {item.carbs}g · F {item.fat}g
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MacroPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroPillLabel}>{label}</Text>
      <Text style={styles.macroPillValue}>
        {value}
        <Text style={styles.macroPillUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '85%',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  bookmarkBtn: {
    paddingTop: 2,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  macroSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  macroPill: {
    backgroundColor: Colors.macroCard,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: '47%',
    flexGrow: 1,
  },
  macroPillLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroPillValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  macroPillUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  itemsScroll: {
    maxHeight: 220,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemKcal: {
    color: Colors.maroon,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemMacros: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  closeBtn: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  closeText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
