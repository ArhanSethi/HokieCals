import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MealDetailSheet from '@/components/MealDetailSheet';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import { getMockCalendarMap } from '@/data/mockCalendarData';
import { MEAL_SLOTS } from '@/types/grubhub';
import type { CalendarMeal } from '@/types/calendar';
import { Colors } from '@/theme';
import { addMonths, parseDateKey, toDateKey } from '@/utils/calendarDates';

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

function formatDayHeading(dateKey: string) {
  return parseDateKey(dateKey).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(now));
  const [mealMap, setMealMap] = useState(() => getMockCalendarMap());
  const [detailMeal, setDetailMeal] = useState<CalendarMeal | null>(null);

  const datesWithMeals = useMemo(() => new Set(mealMap.keys()), [mealMap]);

  const selectedMeals = mealMap.get(selectedDateKey) ?? [];

  const mealsBySlot = useMemo(() => {
    const grouped: Record<string, CalendarMeal[]> = {};
    for (const slot of MEAL_SLOTS) {
      grouped[slot] = [];
    }
    for (const meal of selectedMeals) {
      grouped[meal.meal_slot].push(meal);
    }
    return MEAL_SLOTS.map((slot) => ({
      slot,
      meals: grouped[slot],
      totalKcal: grouped[slot].reduce((sum, m) => sum + m.calories, 0),
    })).filter((s) => s.meals.length > 0);
  }, [selectedMeals]);

  const goPrevMonth = () => {
    const next = addMonths(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
  };

  const goNextMonth = () => {
    const next = addMonths(year, month, 1);
    setYear(next.year);
    setMonth(next.month);
  };

  const handleToggleFavorite = () => {
    if (!detailMeal) return;
    const updated = { ...detailMeal, is_favorite: !detailMeal.is_favorite };
    setDetailMeal(updated);
    setMealMap((prev) => {
      const next = new Map(prev);
      const dayMeals = next.get(selectedDateKey);
      if (!dayMeals) return prev;
      next.set(
        selectedDateKey,
        dayMeals.map((m) => (m.id === updated.id ? updated : m)),
      );
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Calendar</Text>

        <MonthlyCalendar
          year={year}
          month={month}
          selectedDateKey={selectedDateKey}
          datesWithMeals={datesWithMeals}
          onSelectDate={setSelectedDateKey}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />

        <View style={styles.timeline}>
          <Text style={styles.dayHeading}>{formatDayHeading(selectedDateKey)}</Text>

          {mealsBySlot.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No meals logged this day.</Text>
              <Text style={styles.emptyHint}>
                FoodPro dining data will fill in here when halls reopen.
              </Text>
            </View>
          ) : (
            mealsBySlot.map(({ slot, meals, totalKcal }) => (
              <View key={slot} style={styles.slotSection}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>{slot}</Text>
                  <Text style={styles.slotKcal}>{totalKcal} kcal</Text>
                </View>
                {meals.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealCard}
                    activeOpacity={0.8}
                    onPress={() => setDetailMeal(meal)}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.meal_name}</Text>
                      <Text style={styles.mealMeta}>
                        {formatSource(meal.source)} · {meal.items.length}{' '}
                        {meal.items.length === 1 ? 'item' : 'items'}
                      </Text>
                      <Text style={styles.mealItems} numberOfLines={2}>
                        {meal.items.map((i) => i.name).join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.mealRight}>
                      {meal.is_favorite && (
                        <Text style={styles.favMark}>★</Text>
                      )}
                      <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <MealDetailSheet
        visible={detailMeal !== null}
        meal={detailMeal}
        onClose={() => setDetailMeal(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 8,
    marginBottom: 20,
  },
  timeline: {
    marginTop: 8,
  },
  dayHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 16,
  },
  slotSection: {
    marginBottom: 20,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  slotKcal: {
    color: Colors.maroon,
    fontSize: 15,
    fontWeight: '700',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  mealInfo: {
    flex: 1,
    marginRight: 12,
  },
  mealName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  mealItems: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  favMark: {
    color: Colors.maroon,
    fontSize: 14,
    marginBottom: 4,
  },
  mealKcal: {
    color: Colors.maroon,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 20,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
