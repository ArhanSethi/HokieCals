export const MEAL_SLOTS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Late Night',
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export type PendingOrder = {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_slot: MealSlot;
  order_time: string;
  items: string[];
};

export type PendingOrderUpdates = Partial<
  Pick<
    PendingOrder,
    | 'meal_name'
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'meal_slot'
    | 'items'
  >
>;
