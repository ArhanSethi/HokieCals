import type { MealSlot } from '@/types/grubhub';

export type CalendarMealItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type CalendarMeal = {
  id: string;
  meal_name: string;
  meal_slot: MealSlot;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'dining_hall' | 'grubhub' | 'manual';
  logged_at: string;
  items: CalendarMealItem[];
  is_favorite: boolean;
};

export type CalendarDayLog = {
  dateKey: string;
  meals: CalendarMeal[];
};
