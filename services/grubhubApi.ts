import {
  getGrubhubUserId,
  setGrubhubUserId,
} from '@/services/grubhubStorage';

const API_BASE =
  process.env.EXPO_PUBLIC_GRUBHUB_PROXY_URL ?? 'http://localhost:3000';
const CLIENT_ID = 'ghiphone_Vkuxbs6t0f4SZjTOW42Y52z1itJ7Li0Tw3FEcboT';
const LOGIN_DEVICE_ID = '609EC148-2425-4840-ADF1-C27697504EE0';

export class GrubhubApiError extends Error {
  code: 'invalid_credentials' | 'session_expired' | 'network' | 'unknown';

  constructor(
    code: GrubhubApiError['code'],
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

type LoginResponse = {
  session_handle?: {
    access_token?: string;
    refresh_token?: string;
  };
  credential?: {
    ud_id?: string;
  };
};

type RefreshResponse = {
  session_handle?: {
    access_token?: string;
    refresh_token?: string;
  };
};

export type GrubhubOrderSummary = {
  order_id: string;
  order_state?: string;
  order_date?: string;
};

function buildHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function parseResponse<T>(
  response: Response,
  options?: { treat401AsInvalidCredentials?: boolean },
): Promise<T> {
  if (response.status === 401) {
    if (options?.treat401AsInvalidCredentials) {
      throw new GrubhubApiError(
        'invalid_credentials',
        'Incorrect email or password.',
      );
    }
    throw new GrubhubApiError(
      'session_expired',
      'Your Grubhub session has expired. Please sign in again.',
    );
  }

  if (response.status === 403 || response.status === 400) {
    const body = await response.text();
    if (
      body.toLowerCase().includes('password') ||
      body.toLowerCase().includes('credential') ||
      body.toLowerCase().includes('invalid')
    ) {
      throw new GrubhubApiError(
        'invalid_credentials',
        'Incorrect email or password.',
      );
    }
  }

  if (!response.ok) {
    throw new GrubhubApiError(
      'unknown',
      `Grubhub request failed (${response.status}).`,
    );
  }

  return response.json() as Promise<T>;
}

async function request<T>(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...buildHeaders(accessToken),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new GrubhubApiError(
      'network',
      'Network error. Check your connection and try again.',
    );
  }

  return parseResponse<T>(response);
}

export async function grubhubLogin(userEmail: string, userPassword: string) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        client_id: CLIENT_ID,
        brand: 'GRUBHUB',
        device_id: LOGIN_DEVICE_ID,
        scope: 'diner',
        exclusive_session: false,
      }),
    });
  } catch {
    throw new GrubhubApiError(
      'network',
      'Network error. Check your connection and try again.',
    );
  }

  let data: LoginResponse;
  try {
    data = await parseResponse<LoginResponse>(response, {
      treat401AsInvalidCredentials: true,
    });
  } catch (err) {
    if (err instanceof GrubhubApiError && err.code === 'session_expired') {
      throw new GrubhubApiError(
        'invalid_credentials',
        'Incorrect email or password.',
      );
    }
    throw err;
  }

  const accessToken = data.session_handle?.access_token;
  const refreshToken = data.session_handle?.refresh_token;
  const udId = data.credential?.ud_id;

  if (!accessToken || !refreshToken || !udId) {
    throw new GrubhubApiError(
      'unknown',
      'Login succeeded but the response was missing session data.',
    );
  }

  return { accessToken, refreshToken, udId };
}

export async function grubhubRefreshToken(refreshToken: string) {
  const data = await request<RefreshResponse>('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const accessToken = data.session_handle?.access_token;
  const newRefresh = data.session_handle?.refresh_token ?? refreshToken;

  if (!accessToken) {
    throw new GrubhubApiError(
      'session_expired',
      'Could not refresh your session. Please sign in again.',
    );
  }

  return { accessToken, refreshToken: newRefresh };
}

// Returns the stored WebView session user id, or null if the user has not
// completed the WebView login. Callers should redirect to the login screen
// when this is null.
export async function ensureGrubhubUserId(): Promise<string | null> {
  return getGrubhubUserId();
}

// Registers cookies captured from the WebView login with the proxy and
// persists the generated userId locally.
export async function registerGrubhubSession(
  userId: string,
  cookies: Record<string, string>,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cookies }),
    });
  } catch {
    throw new GrubhubApiError(
      'network',
      'Network error. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    throw new GrubhubApiError(
      'unknown',
      `Could not register your Grubhub session (${response.status}).`,
    );
  }

  await setGrubhubUserId(userId);
}

// Logout: removes the user's session from the proxy.
export async function deleteGrubhubSession(userId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/session/${userId}`, { method: 'DELETE' });
  } catch {
    // Best-effort: local logout still proceeds even if this fails.
  }
}

// Appends the stored userId to a path as a query param. Every authenticated
// order call must carry it so the proxy can find the right cookie session.
async function withUserId(path: string): Promise<string> {
  const userId = await getGrubhubUserId();
  if (!userId) {
    throw new GrubhubApiError(
      'session_expired',
      'Not signed in to Grubhub. Please sign in again.',
    );
  }
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}userId=${encodeURIComponent(userId)}`;
}

export async function grubhubListOrders(
  udId: string,
  accessToken: string,
): Promise<GrubhubOrderSummary[]> {
  const data = await request<{ orders?: GrubhubOrderSummary[] }>(
    await withUserId(`/orders/${udId}`),
    { method: 'GET' },
    accessToken,
  );
  return (data.orders ?? []).filter((o) => o.order_id);
}

export async function grubhubOrderDetail(
  udId: string,
  orderId: string,
  accessToken: string,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    await withUserId(`/orders/${udId}/${orderId}`),
    { method: 'GET' },
    accessToken,
  );
}
