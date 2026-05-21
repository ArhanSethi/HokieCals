import type { MealSlot, PendingOrder } from '@/types/grubhub';

export const GRUBHUB_LOGIN_URL = 'https://www.grubhub.com/login';
export const GRUBHUB_HOME_URL = 'https://www.grubhub.com';
export const GRUBHUB_HISTORY_URL = 'https://www.grubhub.com/account/history';

const ALLOWED_FLOW_PATTERNS = [
  'grubhub.com',
  'login.vt.edu',
  'virginia tech',
  'virginia-tech',
  'virginiatech',
  'hokiespa',
] as const;

function normalizeUrl(url: string) {
  try {
    return decodeURIComponent(url).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** URLs permitted during Grubhub + VT SSO login (multi-domain). */
export function isAllowedGrubhubFlowUrl(url: string) {
  if (!url) return false;
  const normalized = normalizeUrl(url);
  return ALLOWED_FLOW_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/** Virginia Tech SSO / identity provider steps before returning to Grubhub. */
export function isVtSsoFlowUrl(url: string) {
  if (!url) return false;
  const normalized = normalizeUrl(url);
  if (normalized.includes('grubhub.com')) return false;
  return (
    normalized.includes('login.vt.edu') ||
    normalized.includes('hokiespa') ||
    normalized.includes('virginia tech') ||
    normalized.includes('virginia-tech') ||
    normalized.includes('virginiatech')
  );
}

/**
 * SSO finished: user is back on Grubhub and URL has no login/auth paths.
 * Only then inject interceptors and navigate to order history.
 */
export function shouldTriggerGrubhubHistoryFetch(url: string) {
  if (!url) return false;
  const normalized = normalizeUrl(url);
  if (!normalized.includes('grubhub.com')) return false;
  if (normalized.includes('login') || normalized.includes('auth')) return false;
  return true;
}

export const GRUBHUB_INJECT_JS = `
(function() {
  if (window.__hokiecalsGrubhubInjected) return;
  window.__hokiecalsGrubhubInjected = true;

  const postOrders = (data) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'GRUBHUB_ORDERS', data })
      );
    }
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = args[0];
    if (typeof url === 'string' && url.includes('/account/history')) {
      const clone = response.clone();
      clone.json().then(postOrders).catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      if (this._url && String(this._url).includes('/account/history')) {
        try {
          postOrders(JSON.parse(this.responseText));
        } catch (e) {}
      }
    });
    return originalSend.call(this, ...args);
  };
})();
true;
`;

export type GrubhubWebViewMessage = {
  type: 'GRUBHUB_ORDERS';
  data: unknown;
};

export function isGrubhubOrdersMessage(
  payload: unknown,
): payload is GrubhubWebViewMessage {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as GrubhubWebViewMessage).type === 'GRUBHUB_ORDERS'
  );
}

function mealSlotFromTime(isoOrMs: string | number | undefined): MealSlot {
  if (!isoOrMs) return 'Dinner';
  const date = new Date(isoOrMs);
  const hour = date.getHours();
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
  if (typeof order.total === 'number') return order.total;
  return 0;
}

function extractOrders(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data !== 'object') return [];

  const root = data as Record<string, unknown>;
  const candidates = [
    root.orders,
    root.order_history,
    root.past_orders,
    (root.data as Record<string, unknown> | undefined)?.orders,
    (root.result as Record<string, unknown> | undefined)?.orders,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c as Record<string, unknown>[];
  }
  return [];
}

function parseLineItems(order: Record<string, unknown>) {
  const charges = order.charges as Record<string, unknown> | undefined;
  const lines = charges?.lines as Record<string, unknown> | undefined;
  const lineItems = lines?.line_items;
  if (!Array.isArray(lineItems)) return { names: [] as string[], itemCount: 0 };

  const names = lineItems.map((raw) => {
    const item = raw as Record<string, unknown>;
    const baseName = String(item.name ?? item.description ?? 'Item');
    const options = item.options as Array<Record<string, unknown>> | undefined;
    const optionText =
      options?.map((o) => String(o.name ?? '')).filter(Boolean).join(', ') ?? '';
    return optionText ? `${baseName} - ${optionText}` : baseName;
  });

  return { names, itemCount: names.length };
}

export function parseGrubhubHistoryPayload(data: unknown): PendingOrder[] {
  const orders = extractOrders(data);

  return orders
    .map((order, index) => {
      const orderId = String(
        order.order_id ?? order.id ?? order.orderId ?? `gh-${index}`,
      );
      const restaurant = String(
        order.restaurant_name ??
          order.merchant_name ??
          (order.restaurant as Record<string, unknown> | undefined)?.name ??
          'Grubhub Order',
      );
      const { names, itemCount } = parseLineItems(order);
      const cents = parseAmountCents(order);
      const calories =
        cents > 0
          ? Math.max(200, Math.round(cents / 100) * 12)
          : Math.max(400, itemCount * 180);
      const macros = estimateMacros(calories);
      const timePlaced =
        (order.time_placed as string | number | undefined) ??
        (order.ordered_at as string | number | undefined) ??
        (order.created_at as string | number | undefined) ??
        new Date().toISOString();

      const meal_name =
        names.length > 0
          ? `${restaurant} — ${names[0]}${names.length > 1 ? ` (+${names.length - 1})` : ''}`
          : restaurant;

      return {
        id: `gh-${orderId}`,
        meal_name,
        calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        meal_slot: mealSlotFromTime(timePlaced),
        order_time:
          typeof timePlaced === 'string'
            ? timePlaced
            : new Date(timePlaced).toISOString(),
        items: names.length > 0 ? names : [restaurant],
      } satisfies PendingOrder;
    })
    .filter((o) => o.meal_name.length > 0);
}
