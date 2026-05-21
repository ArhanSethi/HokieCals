import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'grubhub_access_token',
  refreshToken: 'grubhub_refresh_token',
  udId: 'grubhub_ud_id',
  lastOrderId: 'grubhub_last_order_id',
  deviceId: 'grubhub_device_id',
  browserId: 'grubhub_browser_id',
} as const;

export type GrubhubStoredSession = {
  accessToken: string;
  refreshToken: string;
  udId: string;
  lastOrderId: string | null;
};

export async function loadGrubhubSession(): Promise<GrubhubStoredSession | null> {
  const accessToken = await SecureStore.getItemAsync(KEYS.accessToken);
  const refreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
  const udId = await SecureStore.getItemAsync(KEYS.udId);
  if (!accessToken || !refreshToken || !udId) return null;

  const lastOrderId = await SecureStore.getItemAsync(KEYS.lastOrderId);
  return { accessToken, refreshToken, udId, lastOrderId };
}

export async function saveGrubhubSession(session: GrubhubStoredSession) {
  await SecureStore.setItemAsync(KEYS.accessToken, session.accessToken);
  await SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken);
  await SecureStore.setItemAsync(KEYS.udId, session.udId);
  if (session.lastOrderId) {
    await SecureStore.setItemAsync(KEYS.lastOrderId, session.lastOrderId);
  } else {
    await SecureStore.deleteItemAsync(KEYS.lastOrderId);
  }
}

export async function updateLastOrderId(orderId: string) {
  await SecureStore.setItemAsync(KEYS.lastOrderId, orderId);
}

export async function clearGrubhubSession() {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}

function randomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

export async function getOrCreateDeviceIds() {
  let deviceId = await SecureStore.getItemAsync(KEYS.deviceId);
  let browserId = await SecureStore.getItemAsync(KEYS.browserId);

  if (!deviceId) {
    deviceId = randomUuid();
    await SecureStore.setItemAsync(KEYS.deviceId, deviceId);
  }
  if (!browserId) {
    browserId = randomUuid();
    await SecureStore.setItemAsync(KEYS.browserId, browserId);
  }

  return { deviceId, browserId };
}
