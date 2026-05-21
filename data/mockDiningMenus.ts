import { DINING_LOCATIONS } from '@/theme';

export type DiningMenuItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MENU_TEMPLATES: DiningMenuItem[][] = [
  [
    { id: '1', name: 'Grilled Chicken Breast', calories: 220, protein: 38, carbs: 0, fat: 5 },
    { id: '2', name: 'Steamed Brown Rice', calories: 210, protein: 4, carbs: 45, fat: 2 },
    { id: '3', name: 'Roasted Sweet Potato', calories: 150, protein: 2, carbs: 34, fat: 0 },
    { id: '4', name: 'Garden Salad', calories: 80, protein: 3, carbs: 12, fat: 3 },
    { id: '5', name: 'Scrambled Eggs (2)', calories: 180, protein: 14, carbs: 2, fat: 12 },
    { id: '6', name: 'Whole Wheat Pancakes', calories: 320, protein: 8, carbs: 52, fat: 8 },
    { id: '7', name: 'Turkey & Swiss Wrap', calories: 480, protein: 32, carbs: 42, fat: 18 },
    { id: '8', name: 'Vegetable Stir Fry', calories: 190, protein: 6, carbs: 28, fat: 6 },
  ],
  [
    { id: '1', name: 'BBQ Pulled Pork Plate', calories: 540, protein: 36, carbs: 48, fat: 20 },
    { id: '2', name: 'Mac & Cheese', calories: 380, protein: 14, carbs: 42, fat: 18 },
    { id: '3', name: 'Grilled Cheese & Tomato Soup', calories: 520, protein: 18, carbs: 58, fat: 24 },
    { id: '4', name: 'Caesar Salad w/ Chicken', calories: 410, protein: 34, carbs: 18, fat: 22 },
    { id: '5', name: 'Oatmeal w/ Berries', calories: 290, protein: 10, carbs: 48, fat: 6 },
    { id: '6', name: 'Fish Tacos (2)', calories: 440, protein: 28, carbs: 38, fat: 16 },
    { id: '7', name: 'Veggie Burger', calories: 390, protein: 16, carbs: 44, fat: 14 },
  ],
  [
    { id: '1', name: 'Chicken Tenders & Fries', calories: 680, protein: 32, carbs: 62, fat: 32 },
    { id: '2', name: 'Pasta Marinara', calories: 420, protein: 12, carbs: 72, fat: 8 },
    { id: '3', name: 'Deli Turkey Sandwich', calories: 450, protein: 30, carbs: 46, fat: 14 },
    { id: '4', name: 'Yogurt Parfait', calories: 260, protein: 12, carbs: 38, fat: 6 },
    { id: '5', name: 'Beef Taco Bowl', calories: 560, protein: 38, carbs: 52, fat: 22 },
    { id: '6', name: 'Fruit Cup', calories: 90, protein: 1, carbs: 22, fat: 0 },
    { id: '7', name: 'Cheese Pizza (2 slices)', calories: 520, protein: 22, carbs: 58, fat: 20 },
    { id: '8', name: 'Iced Coffee', calories: 60, protein: 2, carbs: 8, fat: 2 },
  ],
];

function slugify(location: string) {
  return encodeURIComponent(location);
}

export function locationToSlug(location: string) {
  return slugify(location);
}

export function slugToLocation(slug: string) {
  const decoded = decodeURIComponent(slug);
  return DINING_LOCATIONS.find((l) => l === decoded) ?? decoded;
}

const menusByLocation = Object.fromEntries(
  DINING_LOCATIONS.map((location, index) => [
    location,
    MENU_TEMPLATES[index % MENU_TEMPLATES.length].map((item) => ({
      ...item,
      id: `${location}-${item.id}`,
    })),
  ]),
) as Record<string, DiningMenuItem[]>;

export function getMenuForLocation(location: string): DiningMenuItem[] {
  return menusByLocation[location] ?? MENU_TEMPLATES[0];
}

export function searchLocations(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [...DINING_LOCATIONS];
  return DINING_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
}
