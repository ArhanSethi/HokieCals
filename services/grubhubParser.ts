import type { MealSlot, PendingOrder } from '@/types/grubhub';

export type ParsedLineItem = {
  name: string;
  options: string[];
};

/** Meal slots by time_placed hour (campus dining). */
export function mealSlotFromTimePlaced(
  isoOrMs: string | number | undefined,
): MealSlot {
  if (!isoOrMs) return 'Dinner';
  const hour = new Date(isoOrMs).getHours();
  if (hour >= 6 && hour < 10) return 'Breakfast';
  if (hour >= 10 && hour < 15) return 'Lunch';
  if (hour >= 15 && hour < 21) return 'Dinner';
  return 'Late Night';
}

function estimateMacros(calories: number) {
  return {
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

function parseAmountCents(order: Record<string, unknown>): number {
  const charges = order.charges as Record<string, unknown> | undefined;
  const lines = charges?.lines as Record<string, unknown> | undefined;
  const dinerTotal = lines?.diner_total ?? lines?.total;
  if (typeof dinerTotal === 'number') return dinerTotal;
  if (typeof order.amount === 'number') return order.amount;
  return 0;
}

export function extractLineItems(
  order: Record<string, unknown>,
): ParsedLineItem[] {
  const charges = order.charges as Record<string, unknown> | undefined;
  const lines = charges?.lines as Record<string, unknown> | undefined;
  const lineItems = lines?.line_items;
  if (!Array.isArray(lineItems)) return [];

  return lineItems.map((raw) => {
    const item = raw as Record<string, unknown>;
    const name = String(item.name ?? item.description ?? 'Item');
    const optionsRaw = item.options;
    const options = Array.isArray(optionsRaw)
      ? optionsRaw
          .map((o) => String((o as Record<string, unknown>).name ?? ''))
          .filter(Boolean)
      : [];
    return { name, options };
  });
}

export function formatItemLabel(item: ParsedLineItem) {
  if (item.options.length === 0) return item.name;
  return `${item.name} - ${item.options.join(', ')}`;
}

export function parseOrderDetailToPending(
  order: Record<string, unknown>,
): PendingOrder | null {
  const orderId = String(order.order_id ?? order.id ?? '');
  if (!orderId) return null;

  const lineItems = extractLineItems(order);
  const itemLabels = lineItems.map(formatItemLabel);
  const restaurant = String(
    order.restaurant_name ??
      order.merchant_name ??
      (order.restaurant as Record<string, unknown> | undefined)?.name ??
      'Grubhub Order',
  );

  const cents = parseAmountCents(order);
  const calories =
    cents > 0
      ? Math.max(200, Math.round(cents / 100) * 12)
      : Math.max(400, lineItems.length * 180);
  const macros = estimateMacros(calories);

  const timePlaced =
    (order.time_placed as string | number | undefined) ??
    (order.order_date as string | number | undefined) ??
    (order.ordered_at as string | number | undefined) ??
    new Date().toISOString();

  const meal_name =
    itemLabels.length > 0
      ? `${restaurant} — ${itemLabels[0]}${itemLabels.length > 1 ? ` (+${itemLabels.length - 1})` : ''}`
      : restaurant;

  return {
    id: `gh-${orderId}`,
    meal_name,
    calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    meal_slot: mealSlotFromTimePlaced(timePlaced),
    order_time:
      typeof timePlaced === 'string'
        ? timePlaced
        : new Date(timePlaced).toISOString(),
    items: itemLabels.length > 0 ? itemLabels : [restaurant],
  };
}

/** True if `candidate` is newer than `last` (monotonic order IDs). */
export function isOrderIdNewer(
  candidate: string,
  last: string | null,
): boolean {
  if (!last) return true;
  const a = Number(candidate);
  const b = Number(last);
  if (Number.isFinite(a) && Number.isFinite(b)) return a > b;
  return candidate > last;
}

export function maxOrderId(orderIds: string[]): string | null {
  if (orderIds.length === 0) return null;
  return orderIds.reduce((max, id) =>
    isOrderIdNewer(id, max) ? id : max,
  );
}
