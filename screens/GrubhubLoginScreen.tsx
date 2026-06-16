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
import { Colors } from '@/theme';

const LOGIN_URL = 'https://www.grubhub.com/login';
const GRUBHUB_ORIGIN = 'https://www.grubhub.com';

const WEB_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Injected after login is detected. Reads all JS-accessible cookies and
// localStorage, then posts them back via ReactNativeWebView.postMessage.
// HttpOnly cookies are not accessible to JS, but Grubhub's web app stores
// its auth token in non-HttpOnly cookies and localStorage.
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

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SESSION_CAPTURE',
      cookies: cookies,
      localStorage: storage,
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
      // Trigger JS extraction; result arrives via onMessage.
      webViewRef.current?.injectJavaScript(EXTRACT_JS);
    }
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    if (handledRef.current) return;

    let payload: { type: string; cookies?: Record<string, string>; localStorage?: Record<string, string | null>; error?: string };
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

      // Merge any auth-relevant localStorage values as synthetic cookie entries
      // so the server can forward them. Grubhub web often stores the bearer
      // token in localStorage under keys like 'access_token' or 'gh_access_token'.
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
        userAgent={WEB_USER_AGENT}
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
