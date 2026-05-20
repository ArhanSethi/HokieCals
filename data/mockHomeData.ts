export type DaySummary = {
  goal: number;
  consumed: number;
  p: number;
  pGoal: number;
  c: number;
  cGoal: number;
  f: number;
  fGoal: number;
};

export type MealLogPreview = {
  id: string;
  meal_name: string;
  meal_slot: string;
  calories: number;
  source: string;
};

export const MOCK_SUMMARY: DaySummary = {
  goal: 2400,
  consumed: 1650,
  p: 118,
  pGoal: 180,
  c: 195,
  cGoal: 240,
  f: 52,
  fGoal: 80,
};

export const MOCK_RECENT_LOGS: MealLogPreview[] = [
  {
    id: '1',
    meal_name: 'Grilled Chicken Bowl',
    meal_slot: 'Lunch',
    calories: 620,
    source: 'dining_hall',
  },
  {
    id: '2',
    meal_name: 'Chipotle — Chicken Burrito',
    meal_slot: 'Dinner',
    calories: 890,
    source: 'grubhub',
  },
  {
    id: '3',
    meal_name: 'Greek Yogurt & Granola',
    meal_slot: 'Breakfast',
    calories: 340,
    source: 'manual',
  },
];
