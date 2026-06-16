import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import { useRouter } from 'expo-router';

import { registerGrubhubSession } from '@/services/grubhubApi';
import { saveGrubhubSession } from '@/services/grubhubStorage';
import { useGrubhubAuth } from '@/context/GrubhubAuthContext';
import { Colors } from '@/theme';

const LOGIN_URL = 'https://www.grubhub.com/login';
const GRUBHUB_ORIGIN = 'https://www.grubhub.com';

// Injected once Grubhub redirects away from /login.
// Pulls every piece of auth data we can reach via JS:
//   - document.cookie  (non-HttpOnly cookies)
//   - localStorage     (all keys, including Redux-persist blobs)
//   - access_token     extracted from any of the above
//   - ud_id            extracted from any of the above
// HttpOnly session cookies are not accessible but the Bearer token
// (which is what the mobile Tapingo API actually needs) is usually
// stored in localStorage so JS *can* reach it.
const EXTRACT_JS = `
(function() {
  try {
    var uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    // --- cookies ---
    var cookies = {};
    document.cookie.split(';').forEach(function(pair) {
      var idx = pair.indexOf('=');
      if (idx < 0) return;
      var key = pair.slice(0, idx).trim();
      var val = pair.slice(idx + 1).trim();
      if (key) cookies[key] = val;
    });

    // --- full localStorage dump ---
    var storage = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k) storage[k] = localStorage.getItem(k);
    }

    // --- helpers ---
    function tryJson(s) {
      if (!s || typeof s !== 'string') return null;
      try { return JSON.parse(s); } catch(e) { return null; }
    }

    // Recursively look for a field in an object tree up to 4 levels deep.
    function dig(obj, fields, depth) {
      if (!obj || typeof obj !== 'object' || depth > 4) return null;
      for (var fi = 0; fi < fields.length; fi++) {
        var v = obj[fields[fi]];
        if (v && typeof v === 'string' && v.length > 4) return v;
      }
      var keys = Object.keys(obj);
      for (var ki = 0; ki < keys.length; ki++) {
        var child = obj[keys[ki]];
        // Redux Persist double-encodes nested slices as JSON strings
        var parsed = (typeof child === 'string') ? tryJson(child) : child;
        var found = dig(parsed || child, fields, depth + 1);
        if (found) return found;
      }
      return null;
    }

    var TOKEN_FIELDS = [
      'access_token','accessToken','bearer_token','bearerToken',
      'auth_token','authToken','id_token','idToken','token'
    ];
    var UD_FIELDS = [
      'ud_id','udId','user_id','userId','diner_id','dinerId','gh_ud_id','id'
    ];

    // --- extract from cookies first ---
    var accessToken = null;
    var udId = null;
    for (var tf = 0; tf < TOKEN_FIELDS.length; tf++) {
      if (cookies[TOKEN_FIELDS[tf]]) { accessToken = cookies[TOKEN_FIELDS[tf]]; break; }
    }
    for (var uf = 0; uf < UD_FIELDS.length; uf++) {
      var cv = cookies[UD_FIELDS[uf]];
      if (cv && uuidRe.test(cv)) { udId = cv; break; }
    }

    // --- extract from localStorage (direct + nested) ---
    var lsKeys = Object.keys(storage);
    for (var li = 0; li < lsKeys.length; li++) {
      var lk = lsKeys[li];
      var lv = storage[lk];
      if (!lv) continue;

      // Direct string match for token keys
      if (!accessToken && TOKEN_FIELDS.indexOf(lk) >= 0 && lv.length > 20) {
        accessToken = lv;
      }
      // Direct string match for udId keys
      if (!udId && UD_FIELDS.indexOf(lk) >= 0 && uuidRe.test(lv.trim())) {
        udId = lv.trim();
      }

      // Parse JSON (Redux Persist slices, etc.)
      var obj = tryJson(lv);
      if (obj) {
        if (!accessToken) {
          var t = dig(obj, TOKEN_FIELDS, 0);
          if (t && t.length > 20) accessToken = t;
        }
        if (!udId) {
          var u = dig(obj, UD_FIELDS, 0);
          if (u && uuidRe.test(u)) udId = u;
        }
      }
      if (accessToken && udId) break;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SESSION_CAPTURE',
      cookies: cookies,
      localStorage: storage,
      accessToken: accessToken,
      udId: udId,
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SESSION_CAPTURE_ERROR',
      error: String(e),
    }));
  }
})(); true;
`;

function makeUserId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function GrubhubLoginScreen() {
  const router = useRouter();
  const { connectViaWebView } = useGrubhubAuth();
  const webViewRef = useRef<WebView>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    if (
      nav.url &&
      nav.url.startsWith(GRUBHUB_ORIGIN) &&
      !nav.url.includes('/login') &&
      !nav.loading &&
      !handledRef.current
    ) {
      webViewRef.current?.injectJavaScript(EXTRACT_JS);
    }
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    if (handledRef.current) return;

    let payload: {
      type: string;
      cookies?: Record<string, string>;
      localStorage?: Record<string, string | null>;
      accessToken?: string | null;
      udId?: string | null;
      error?: string;
    };
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (payload.type !== 'SESSION_CAPTURE') return;

    handledRef.current = true;
    setRegistering(true);
    setError(null);

    try {
      const ls = payload.localStorage ?? {};
      const rawCookies: Record<string, string> = payload.cookies ?? {};

      // Collect all auth-related localStorage values so the proxy can forward
      // them as a last resort if the Bearer token path doesn't work.
      for (const [k, v] of Object.entries(ls)) {
        if (v && (k.includes('token') || k.includes('session') || k.includes('auth'))) {
          rawCookies[`__ls_${k}`] = v;
        }
      }

      // --- Best path: extracted Bearer token + udId ---
      // If we got both, save them as a real credential session. The existing
      // Bearer-token sync flow then works without any special-casing.
      const accessToken = payload.accessToken ?? null;
      const udId = payload.udId ?? null;

      if (accessToken && udId) {
        await saveGrubhubSession({
          accessToken,
          refreshToken: '', // web sessions have no refresh token we can use
          udId,
          lastOrderId: null,
        });
      }

      // Always register the cookie session on the proxy too so the server-side
      // Cookie header fallback is available if Bearer auth fails.
      if (Object.keys(rawCookies).length > 0) {
        const userId = makeUserId();
        await registerGrubhubSession(userId, rawCookies);
        await connectViaWebView(userId, udId);
      } else {
        await connectViaWebView('', udId);
      }

      router.replace('/(tabs)');
    } catch {
      handledRef.current = false;
      setRegistering(false);
      setError('Could not connect your account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: LOGIN_URL }}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={onMessage}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        originWhitelist={['https://*']}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.maroon} size="large" />
          </View>
        )}
      />

      {registering && (
        <View style={styles.overlay}>
          <ActivityIndicator color={Colors.white} size="large" />
          <Text style={styles.overlayText}>Connecting your account…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  overlayText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#3a2020',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
  },
});
