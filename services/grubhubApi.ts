import { getOrCreateDeviceIds } from '@/services/grubhubStorage';

const API_BASE = 'https://api-gtm.grubhub.com';
const CLIENT_ID = 'ghiphone_Vkuxbs6t0f4SZjTOW42Y52z1itJ7Li0Tw3FEcboT';

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

async function buildHeaders(accessToken?: string, browserId?: string) {
  const ids = await getOrCreateDeviceIds();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'user-agent': 'GrubHub/2026.19 (iPhone; iOS 26.4.1; Scale/3.00)',
    'x-gh-browser-id': browserId ?? ids.browserId,
    'x-gh-features': '0=phone;1=Grubhub 2026.19.0;2=iOS 26.4.1;60=24061',
    'x-px-os': 'iOS',
    brand: 'GRUBHUB',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
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
        ...(await buildHeaders(accessToken)),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new GrubhubApiError(
      'network',
      'Network error. Check your connection and try again.',
    );
  }

  if (response.status === 401) {
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

export async function grubhubLogin(email: string, password: string) {
  const { deviceId, browserId } = await getOrCreateDeviceIds();

  let data: LoginResponse;
  try {
    data = await request<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        headers: await buildHeaders(undefined, browserId),
        body: JSON.stringify({
          email,
          password,
          client_id: CLIENT_ID,
          brand: 'GRUBHUB',
          device_id: deviceId,
          scope: 'diner',
          exclusive_session: false,
        }),
      },
    );
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
  const data = await request<RefreshResponse>('/auth/refresh', {
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

export async function grubhubListOrders(
  udId: string,
  accessToken: string,
): Promise<GrubhubOrderSummary[]> {
  const data = await request<{ orders?: GrubhubOrderSummary[] }>(
    `/tapingo/diners/${udId}/orders`,
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
    `/tapingo/diners/${udId}/order-history/${orderId}`,
    { method: 'GET' },
    accessToken,
  );
}
