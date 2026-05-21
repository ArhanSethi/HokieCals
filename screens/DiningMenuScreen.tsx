import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import MealSlotPickerModal from '@/components/MealSlotPickerModal';
import { useMealLog } from '@/context/MealLogContext';
import {
  getMenuForLocation,
  slugToLocation,
  type DiningMenuItem,
} from '@/data/mockDiningMenus';
import { Colors } from '@/theme';
import type { MealSlot } from '@/types/grubhub';

export default function DiningMenuScreen() {
  const router = useRouter();
  const { location: locationSlug } = useLocalSearchParams<{ location: string }>();
  const locationName = slugToLocation(locationSlug ?? '');
  const menu = getMenuForLocation(locationName);
  const { logMeal } = useMealLog();

  const [selectedItem, setSelectedItem] = useState<DiningMenuItem | null>(null);

  const handleSelectSlot = (slot: MealSlot) => {
    if (!selectedItem) return;

    logMeal({
      meal_name: `${locationName} — ${selectedItem.name}`,
      meal_slot: slot,
      calories: selectedItem.calories,
      protein: selectedItem.protein,
      carbs: selectedItem.carbs,
      fat: selectedItem.fat,
      source: 'dining_hall',
    });

    setSelectedItem(null);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
        <Text style={styles.header} numberOfLines={1}>
          {locationName}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>Today's menu (mock)</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {menu.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            activeOpacity={0.8}
            onPress={() => setSelectedItem(item)}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMacros}>
                P {item.protein}g · C {item.carbs}g · F {item.fat}g
              </Text>
            </View>
            <Text style={styles.itemKcal}>{item.calories} kcal</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <MealSlotPickerModal
        visible={selectedItem !== null}
        itemName={selectedItem?.name ?? ''}
        onClose={() => setSelectedItem(null)}
        onSelectSlot={handleSelectSlot}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMacros: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  itemKcal: {
    color: Colors.maroon,
    fontSize: 16,
    fontWeight: '700',
  },
});
