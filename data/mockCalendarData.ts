import type { CalendarDayLog, CalendarMeal } from '@/types/calendar';
import { toDateKey } from '@/utils/calendarDates';

function dayOffset(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

function loggedAt(day: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function meal(
  partial: Omit<CalendarMeal, 'is_favorite'> & { is_favorite?: boolean },
): CalendarMeal {
  return { is_favorite: false, ...partial };
}

const MOCK_BY_DAY: Record<string, CalendarMeal[]> = {
  [dayOffset(-3)]: [
    meal({
      id: 'cal-1',
      meal_name: 'West End — Breakfast Plate',
      meal_slot: 'Breakfast',
      calories: 410,
      protein: 22,
      carbs: 48,
      fat: 14,
      source: 'dining_hall',
      logged_at: loggedAt(-3, 8, 15),
      items: [
        { name: 'Scrambled Eggs', calories: 180, protein: 14, carbs: 2, fat: 12 },
        { name: 'Whole Wheat Toast', calories: 120, protein: 4, carbs: 22, fat: 2 },
        { name: 'Orange Juice', calories: 110, protein: 2, carbs: 24, fat: 0 },
      ],
    }),
    meal({
      id: 'cal-2',
      meal_name: 'D2 — Grilled Chicken & Rice',
      meal_slot: 'Lunch',
      calories: 580,
      protein: 42,
      carbs: 62,
      fat: 12,
      source: 'dining_hall',
      logged_at: loggedAt(-3, 12, 22),
      items: [
        { name: 'Grilled Chicken Breast', calories: 220, protein: 38, carbs: 0, fat: 5 },
        { name: 'Steamed Rice', calories: 210, protein: 4, carbs: 45, fat: 1 },
        { name: 'Green Beans', calories: 50, protein: 2, carbs: 8, fat: 0 },
        { name: 'Side Salad', calories: 100, protein: 2, carbs: 9, fat: 6 },
      ],
    }),
  ],
  [dayOffset(-2)]: [
    meal({
      id: 'cal-3',
      meal_name: 'Greek Yogurt & Granola',
      meal_slot: 'Breakfast',
      calories: 340,
      protein: 18,
      carbs: 42,
      fat: 10,
      source: 'manual',
      logged_at: loggedAt(-2, 7, 32),
      items: [
        { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 8, fat: 4 },
        { name: 'Granola', calories: 190, protein: 3, carbs: 34, fat: 6 },
      ],
    }),
    meal({
      id: 'cal-4',
      meal_name: 'Chipotle — Burrito Bowl',
      meal_slot: 'Dinner',
      calories: 890,
      protein: 52,
      carbs: 98,
      fat: 32,
      source: 'grubhub',
      logged_at: loggedAt(-2, 18, 5),
      is_favorite: true,
      items: [
        { name: 'Chicken', calories: 180, protein: 32, carbs: 0, fat: 7 },
        { name: 'Brown Rice', calories: 210, protein: 4, carbs: 40, fat: 3 },
        { name: 'Black Beans', calories: 120, protein: 8, carbs: 20, fat: 1 },
        { name: 'Guacamole', calories: 230, protein: 3, carbs: 12, fat: 20 },
        { name: 'Salsa & Lettuce', calories: 150, protein: 5, carbs: 26, fat: 1 },
      ],
    }),
  ],
  [dayOffset(-1)]: [
    meal({
      id: 'cal-5',
      meal_name: "Turner Place — Omelette Station",
      meal_slot: 'Breakfast',
      calories: 380,
      protein: 28,
      carbs: 8,
      fat: 24,
      source: 'dining_hall',
      logged_at: loggedAt(-1, 9, 10),
      items: [
        { name: '3-Egg Omelette', calories: 280, protein: 24, carbs: 2, fat: 20 },
        { name: 'Spinach & Peppers', calories: 40, protein: 2, carbs: 4, fat: 0 },
        { name: 'Coffee', calories: 60, protein: 2, carbs: 2, fat: 4 },
      ],
    }),
    meal({
      id: 'cal-6',
      meal_name: 'Squires — Turkey Club',
      meal_slot: 'Lunch',
      calories: 520,
      protein: 34,
      carbs: 44,
      fat: 22,
      source: 'dining_hall',
      logged_at: loggedAt(-1, 12, 25),
      items: [
        { name: 'Turkey Club Sandwich', calories: 420, protein: 30, carbs: 38, fat: 18 },
        { name: 'Apple', calories: 100, protein: 0, carbs: 26, fat: 0 },
      ],
    }),
    meal({
      id: 'cal-7',
      meal_name: 'Protein Shake',
      meal_slot: 'Late Night',
      calories: 220,
      protein: 40,
      carbs: 8,
      fat: 3,
      source: 'manual',
      logged_at: loggedAt(-1, 22, 15),
      items: [
        { name: 'Whey Protein Shake', calories: 220, protein: 40, carbs: 8, fat: 3 },
      ],
    }),
  ],
  [dayOffset(0)]: [
    meal({
      id: 'cal-8',
      meal_name: 'Overnight Oats',
      meal_slot: 'Breakfast',
      calories: 360,
      protein: 16,
      carbs: 52,
      fat: 10,
      source: 'manual',
      logged_at: loggedAt(0, 7, 45),
      items: [
        { name: 'Oats & Almond Milk', calories: 220, protein: 8, carbs: 38, fat: 6 },
        { name: 'Banana & Peanut Butter', calories: 140, protein: 4, carbs: 18, fat: 6 },
      ],
    }),
    meal({
      id: 'cal-9',
      meal_name: 'Grilled Chicken Bowl',
      meal_slot: 'Lunch',
      calories: 620,
      protein: 48,
      carbs: 58,
      fat: 16,
      source: 'dining_hall',
      logged_at: loggedAt(0, 11, 47),
      items: [
        { name: 'Grilled Chicken', calories: 240, protein: 42, carbs: 0, fat: 6 },
        { name: 'Quinoa', calories: 220, protein: 8, carbs: 40, fat: 4 },
        { name: 'Roasted Veggies', calories: 90, protein: 3, carbs: 12, fat: 3 },
        { name: 'Balsamic Dressing', calories: 70, protein: 0, carbs: 6, fat: 5 },
      ],
    }),
  ],
  [dayOffset(1)]: [
    meal({
      id: 'cal-10',
      meal_name: 'Bagel & Cream Cheese',
      meal_slot: 'Breakfast',
      calories: 420,
      protein: 14,
      carbs: 58,
      fat: 14,
      source: 'manual',
      logged_at: loggedAt(1, 8, 0),
      items: [
        { name: 'Everything Bagel', calories: 280, protein: 10, carbs: 54, fat: 2 },
        { name: 'Cream Cheese', calories: 140, protein: 4, carbs: 4, fat: 12 },
      ],
    }),
  ],
};

export function getMockCalendarLogs(): CalendarDayLog[] {
  return Object.entries(MOCK_BY_DAY).map(([dateKey, meals]) => ({
    dateKey,
    meals,
  }));
}

export function getMockCalendarMap(): Map<string, CalendarMeal[]> {
  return new Map(Object.entries(MOCK_BY_DAY));
}
