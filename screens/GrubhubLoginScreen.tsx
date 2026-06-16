import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { useRouter } from 'expo-router';

import { registerGrubhubSession } from '@/services/grubhubApi';
import { Colors } from '@/theme';

const LOGIN_URL = 'https://www.grubhub.com/login';
const GRUBHUB_ORIGIN = 'https://www.grubhub.com';

// A desktop-class UA tends to get a cleaner web login form than the default
// in-app WebView UA.
const WEB_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// RFC4122-ish v4 id. Good enough to key a server session.
function makeUserId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function GrubhubLoginScreen() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ensures we only attempt the capture once per successful login.
  const handledRef = useRef(false);

  const captureSession = async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setRegistering(true);
    setError(null);

    try {
      // CookieManager returns HttpOnly cookies too — `document.cookie` from
      // injected JS cannot see the auth/session cookies we actually need.
      const all = await CookieManager.get(GRUBHUB_ORIGIN, true);
      const cookies: Record<string, string> = {};
      for (const [name, cookie] of Object.entries(all)) {
        if (cookie?.value) cookies[name] = cookie.value;
      }

      // No cookies yet — the redirect probably fired mid-flow. Let the user
      // keep going and try again on the next navigation.
      if (Object.keys(cookies).length === 0) {
        handledRef.current = false;
        setRegistering(false);
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

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    // Grubhub redirects away from /login once the user is authenticated.
    if (
      nav.url &&
      nav.url.startsWith(GRUBHUB_ORIGIN) &&
      !nav.url.includes('/login') &&
      !nav.loading
    ) {
      captureSession();
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
        source={{ uri: LOGIN_URL }}
        onNavigationStateChange={onNavigationStateChange}
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
