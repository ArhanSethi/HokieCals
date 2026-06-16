import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { usePendingQueue } from '@/context/PendingQueueContext';
import {
  deleteGrubhubSession,
  GrubhubApiError,
  grubhubListOrders,
  grubhubLogin,
  grubhubOrderDetail,
  grubhubRefreshToken,
} from '@/services/grubhubApi';
import {
  isOrderIdNewer,
  maxOrderId,
  parseOrderDetailToPending,
} from '@/services/grubhubParser';
import {
  clearGrubhubSession,
  clearGrubhubUserId,
  clearWebViewUdId,
  getGrubhubUserId,
  getWebViewUdId,
  loadGrubhubSession,
  saveGrubhubSession,
  setWebViewUdId,
  updateLastOrderId,
} from '@/services/grubhubStorage';
import type { PendingOrder } from '@/types/grubhub';

type GrubhubAuthContextValue = {
  isConnected: boolean;
  isConnecting: boolean;
  sessionExpired: boolean;
  networkError: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  connectViaWebView: (userId: string, udId: string | null) => Promise<void>;
  syncOrders: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearLoginError: () => void;
  dismissNetworkError: () => void;
};

const GrubhubAuthContext = createContext<GrubhubAuthContextValue | null>(null);

export function GrubhubAuthProvider({ children }: { children: React.ReactNode }) {
  const {
    setGrubhubConnecting,
    importGrubhubOrders,
    appendGrubhubOrders,
    restoreGrubhubConnection,
    disconnectGrubhub,
  } = usePendingQueue();

  const [hasSession, setHasSession] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const setConnecting = useCallback(
    (value: boolean) => {
      setIsConnecting(value);
      setGrubhubConnecting(value);
    },
    [setGrubhubConnecting],
  );

  const handleSessionExpired = useCallback(async () => {
    await clearGrubhubSession();
    setHasSession(false);
    setSessionExpired(true);
    disconnectGrubhub();
  }, [disconnectGrubhub]);

  const fetchWithRefresh = useCallback(
    async <T,>(fn: (accessToken: string, udId: string) => Promise<T>): Promise<T> => {
      const session = await loadGrubhubSession();
      if (!session) {
        await handleSessionExpired();
        throw new GrubhubApiError(
          'session_expired',
          'Not signed in to Grubhub.',
        );
      }

      try {
        return await fn(session.accessToken, session.udId);
      } catch (err) {
        if (
          err instanceof GrubhubApiError &&
          err.code === 'session_expired'
        ) {
          const refreshed = await grubhubRefreshToken(session.refreshToken);
          const next = {
            ...session,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
          };
          await saveGrubhubSession(next);
          return fn(next.accessToken, next.udId);
        }
        throw err;
      }
    },
    [handleSessionExpired],
  );

  const fetchAndParseOrders = useCallback(
    async (orderIds: string[]): Promise<PendingOrder[]> => {
      const parsed: PendingOrder[] = [];

      for (const orderId of orderIds) {
        const detail = await fetchWithRefresh((token, udId) =>
          grubhubOrderDetail(udId, orderId, token),
        );
        const pending = parseOrderDetailToPending(detail);
        if (pending) parsed.push(pending);
      }

      return parsed;
    },
    [fetchWithRefresh],
  );

  // Called by GrubhubLoginScreen after a successful WebView login.
  // Saves the user id (and optional udId) so the app shows as connected
  // without needing the credential-based access/refresh tokens.
  const connectViaWebView = useCallback(
    async (userId: string, udId: string | null) => {
      if (udId) await setWebViewUdId(udId);
      setHasSession(true);
      setSessionExpired(false);
      setNetworkError(false);
      restoreGrubhubConnection();
    },
    [restoreGrubhubConnection],
  );

  const syncOrders = useCallback(
    async (options?: { full?: boolean }) => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      setConnecting(true);
      setNetworkError(false);

      try {
        const session = await loadGrubhubSession();
        const webViewUserId = await getGrubhubUserId();

        // No credential session — check for WebView session before expiring.
        if (!session) {
          if (webViewUserId) {
            // In WebView mode: try to sync using the webview udId if we have it.
            const wvUdId = await getWebViewUdId();
            if (!wvUdId) {
              // Connected but can't sync without a udId yet. Show as connected,
              // don't expire — the user just can't auto-sync orders.
              setHasSession(true);
              return;
            }
            // Fall through to do a cookie-based sync using empty access token.
            // The proxy will use the stored cookies for auth.
            try {
              const summaries = await grubhubListOrders(wvUdId, '');
              const lastOrderId = null;
              const toFetch = summaries
                .map((o) => String(o.order_id))
                .filter((id) => isOrderIdNewer(id, lastOrderId));
              if (toFetch.length > 0) {
                const parsed: PendingOrder[] = [];
                for (const orderId of toFetch) {
                  const detail = await grubhubOrderDetail(wvUdId, orderId, '');
                  const pending = parseOrderDetailToPending(detail);
                  if (pending) parsed.push(pending);
                }
                if (options?.full) {
                  importGrubhubOrders(parsed);
                } else if (parsed.length > 0) {
                  appendGrubhubOrders(parsed);
                }
              }
              setHasSession(true);
              setSessionExpired(false);
            } catch (err) {
              if (err instanceof GrubhubApiError && err.code === 'network') {
                setNetworkError(true);
              }
              // Other errors (401/403 from proxy) — stay connected, don't expire.
              setHasSession(true);
            }
            return;
          }
          await handleSessionExpired();
          return;
        }

        const summaries = await fetchWithRefresh((token, udId) =>
          grubhubListOrders(udId, token),
        );

        const lastId = options?.full ? null : session.lastOrderId;
        const toFetch = summaries
          .map((o) => String(o.order_id))
          .filter((id) => isOrderIdNewer(id, lastId));

        if (toFetch.length === 0) {
          setHasSession(true);
          return;
        }

        const pending = await fetchAndParseOrders(toFetch);
        const newest = maxOrderId([
          ...(session.lastOrderId ? [session.lastOrderId] : []),
          ...toFetch,
        ]);

        if (newest) {
          await updateLastOrderId(newest);
          await saveGrubhubSession({ ...session, lastOrderId: newest });
        }

        if (options?.full) {
          importGrubhubOrders(pending);
        } else if (pending.length > 0) {
          appendGrubhubOrders(pending);
        }
        setHasSession(true);
        setSessionExpired(false);
      } catch (err) {
        if (err instanceof GrubhubApiError) {
          if (err.code === 'session_expired') {
            await handleSessionExpired();
          } else if (err.code === 'network') {
            setNetworkError(true);
          }
        } else {
          setNetworkError(true);
        }
      } finally {
        syncingRef.current = false;
        setConnecting(false);
      }
    },
    [
      appendGrubhubOrders,
      fetchAndParseOrders,
      fetchWithRefresh,
      handleSessionExpired,
      importGrubhubOrders,
      setConnecting,
    ],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setConnecting(true);
      setLoginError(null);
      setNetworkError(false);
      setSessionExpired(false);

      try {
        const { accessToken, refreshToken, udId } = await grubhubLogin(
          email.trim(),
          password,
        );
        await saveGrubhubSession({
          accessToken,
          refreshToken,
          udId,
          lastOrderId: null,
        });
        setHasSession(true);
        await syncOrders({ full: true });
      } catch (err) {
        if (err instanceof GrubhubApiError) {
          if (err.code === 'invalid_credentials') {
            setLoginError(err.message);
          } else if (err.code === 'network') {
            setNetworkError(true);
          } else if (err.code === 'session_expired') {
            setSessionExpired(true);
          } else {
            setLoginError(err.message);
          }
        } else {
          setNetworkError(true);
        }
      } finally {
        setConnecting(false);
      }
    },
    [setConnecting, syncOrders],
  );

  const disconnect = useCallback(async () => {
    const userId = await getGrubhubUserId();
    if (userId) {
      await deleteGrubhubSession(userId);
      await clearGrubhubUserId();
    }
    await clearWebViewUdId();
    await clearGrubhubSession();
    setHasSession(false);
    setSessionExpired(false);
    setNetworkError(false);
    setLoginError(null);
    disconnectGrubhub();
  }, [disconnectGrubhub]);

  useEffect(() => {
    (async () => {
      const session = await loadGrubhubSession();
      if (session) {
        setHasSession(true);
        setSessionExpired(false);
        restoreGrubhubConnection();
        return;
      }
      // Also restore from a WebView session persisted across app restarts.
      const userId = await getGrubhubUserId();
      if (userId) {
        setHasSession(true);
        setSessionExpired(false);
        restoreGrubhubConnection();
      }
    })();
  }, [restoreGrubhubConnection]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && hasSession && !sessionExpired) {
        syncOrders();
      }
    });
    return () => sub.remove();
  }, [hasSession, sessionExpired, syncOrders]);

  const value = useMemo(
    () => ({
      isConnected: hasSession && !sessionExpired,
      isConnecting,
      sessionExpired,
      networkError,
      loginError,
      login,
      connectViaWebView,
      syncOrders: () => syncOrders(),
      disconnect,
      clearLoginError: () => setLoginError(null),
      dismissNetworkError: () => setNetworkError(false),
    }),
    [
      hasSession,
      sessionExpired,
      isConnecting,
      networkError,
      loginError,
      login,
      connectViaWebView,
      syncOrders,
      disconnect,
    ],
  );

  return (
    <GrubhubAuthContext.Provider value={value}>
      {children}
    </GrubhubAuthContext.Provider>
  );
}

export function useGrubhubAuth() {
  const ctx = useContext(GrubhubAuthContext);
  if (!ctx) {
    throw new Error('useGrubhubAuth must be used within GrubhubAuthProvider');
  }
  return ctx;
}
