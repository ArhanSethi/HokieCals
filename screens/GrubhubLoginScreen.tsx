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
import { useGrubhubAuth } from '@/context/GrubhubAuthContext';
import { Colors } from '@/theme';

const LOGIN_URL = 'https://www.grubhub.com/login';
const GRUBHUB_ORIGIN = 'https://www.grubhub.com';

// Injected once Grubhub redirects away from /login. Captures all JS-readable
// cookies (non-HttpOnly), all localStorage, and attempts to find the user's
// ud_id so we can make mobile API calls directly.
const EXTRACT_JS = `
(function() {
  try {
    var cookies = {};
    document.cookie.split(';').forEach(function(pair) {
      var idx = pair.indexOf('=');
      if (idx < 0) return;
      var key = pair.slice(0, idx).trim();
      var val = pair.slice(idx + 1).trim();
      if (key) cookies[key] = val;
    });

    var storage = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k) storage[k] = localStorage.getItem(k);
    }

    // Try to find the user's Grubhub diner ID (a UUID) in localStorage.
    // It may be stored directly or inside a JSON-serialised Redux blob.
    var udId = null;
    var uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    var directKeys = ['ud_id','user_id','userId','diner_id','dinerId','gh_ud_id'];
    for (var d = 0; d < directKeys.length; d++) {
      var dv = localStorage.getItem(directKeys[d]);
      if (dv && uuidRe.test(dv.trim())) { udId = dv.trim(); break; }
    }
    if (!udId) {
      for (var j = 0; j < localStorage.length; j++) {
        var jk = localStorage.key(j);
        if (!jk) continue;
        var raw = localStorage.getItem(jk);
        if (!raw) continue;
        try {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            var fields = ['ud_id','user_id','userId','diner_id','dinerId'];
            for (var f = 0; f < fields.length; f++) {
              var fv = parsed[fields[f]];
              if (fv && uuidRe.test(String(fv))) { udId = String(fv); break; }
            }
          }
        } catch(e) {}
        if (udId) break;
      }
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SESSION_CAPTURE',
      cookies: cookies,
      localStorage: storage,
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
      const cookies: Record<string, string> = payload.cookies ?? {};

      // Pull auth-relevant localStorage entries into the cookie map so the
      // proxy can forward them as needed.
      const ls = payload.localStorage ?? {};
      for (const [k, v] of Object.entries(ls)) {
        if (v && (k.includes('token') || k.includes('session') || k.includes('auth'))) {
          cookies[`__ls_${k}`] = v;
        }
      }

      if (Object.keys(cookies).length === 0) {
        handledRef.current = false;
        setRegistering(false);
        setError('No session found after login. Please try again.');
        return;
      }

      const userId = makeUserId();
      await registerGrubhubSession(userId, cookies);
      // Mark the context as connected (and pass udId if we found it).
      await connectViaWebView(userId, payload.udId ?? null);
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
