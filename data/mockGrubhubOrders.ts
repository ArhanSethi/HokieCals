import type { PendingOrder } from '@/types/grubhub';

function hoursAgo(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function createMockImportedOrders(): PendingOrder[] {
  return [
    {
      id: 'gh-1',
      meal_name: 'Chipotle — Chicken Burrito Bowl',
      calories: 890,
      protein: 52,
      carbs: 98,
      fat: 32,
      meal_slot: 'Dinner',
      order_time: hoursAgo(26),
      items: ['Chicken', 'Brown Rice', 'Black Beans', 'Guacamole'],
    },
    {
      id: 'gh-2',
      meal_name: "Chick-fil-A — Spicy Deluxe Meal",
      calories: 720,
      protein: 38,
      carbs: 72,
      fat: 28,
      meal_slot: 'Lunch',
      order_time: hoursAgo(30),
      items: ['Spicy Deluxe Sandwich', 'Waffle Fries', 'Lemonade'],
    },
    {
      id: 'gh-3',
      meal_name: 'Pizza Hut — Large Pepperoni (3 slices)',
      calories: 1050,
      protein: 42,
      carbs: 118,
      fat: 48,
      meal_slot: 'Late Night',
      order_time: hoursAgo(8),
      items: ['Pepperoni Pizza', 'Garlic Knots'],
    },
  ];
}
