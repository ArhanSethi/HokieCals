import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  accessToken: 'grubhub_access_token',
  refreshToken: 'grubhub_refresh_token',
  udId: 'grubhub_ud_id',
  lastOrderId: 'grubhub_last_order_id',
  deviceId: 'grubhub_device_id',
  browserId: 'grubhub_browser_id',
  sessionUserId: 'grubhub_session_user_id',
  // udId captured during WebView login (may differ from credential login udId)
  webViewUdId: 'grubhub_webview_ud_id',
} as const;

export type GrubhubStoredSession = {
  accessToken: string;
  refreshToken: string;
  udId: string;
  lastOrderId: string | null;
};

export async function loadGrubhubSession(): Promise<GrubhubStoredSession | null> {
  const accessToken = await AsyncStorage.getItem(KEYS.accessToken);
  const refreshToken = await AsyncStorage.getItem(KEYS.refreshToken);
  const udId = await AsyncStorage.getItem(KEYS.udId);
  if (!accessToken || !refreshToken || !udId) return null;

  const lastOrderId = await AsyncStorage.getItem(KEYS.lastOrderId);
  return { accessToken, refreshToken, udId, lastOrderId };
}

export async function saveGrubhubSession(session: GrubhubStoredSession) {
  await AsyncStorage.setItem(KEYS.accessToken, session.accessToken);
  await AsyncStorage.setItem(KEYS.refreshToken, session.refreshToken);
  await AsyncStorage.setItem(KEYS.udId, session.udId);
  if (session.lastOrderId) {
    await AsyncStorage.setItem(KEYS.lastOrderId, session.lastOrderId);
  } else {
    await AsyncStorage.removeItem(KEYS.lastOrderId);
  }
}

export async function updateLastOrderId(orderId: string) {
  await AsyncStorage.setItem(KEYS.lastOrderId, orderId);
}

export async function clearGrubhubSession() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// --- WebView session user id ---
// Identifies the user's cookie session stored on the proxy. Absence of this
// value means the user must go through the WebView login again.

export async function getGrubhubUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.sessionUserId);
}

export async function setGrubhubUserId(userId: string) {
  await AsyncStorage.setItem(KEYS.sessionUserId, userId);
}

export async function clearGrubhubUserId() {
  await AsyncStorage.removeItem(KEYS.sessionUserId);
}

export async function getWebViewUdId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.webViewUdId);
}

export async function setWebViewUdId(udId: string) {
  await AsyncStorage.setItem(KEYS.webViewUdId, udId);
}

export async function clearWebViewUdId() {
  await AsyncStorage.removeItem(KEYS.webViewUdId);
}

function randomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

export async function getOrCreateDeviceIds() {
  let deviceId = await AsyncStorage.getItem(KEYS.deviceId);
  let browserId = await AsyncStorage.getItem(KEYS.browserId);

  if (!deviceId) {
    deviceId = randomUuid();
    await AsyncStorage.setItem(KEYS.deviceId, deviceId);
  }
  if (!browserId) {
    browserId = randomUuid();
    await AsyncStorage.setItem(KEYS.browserId, browserId);
  }

  return { deviceId, browserId };
}
