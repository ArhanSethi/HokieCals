import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { usePendingQueue } from '@/context/PendingQueueContext';
import {
  GRUBHUB_HISTORY_URL,
  GRUBHUB_HOME_URL,
  GRUBHUB_INJECT_JS,
  GRUBHUB_LOGIN_URL,
  isAllowedGrubhubFlowUrl,
  isGrubhubOrdersMessage,
  isVtSsoFlowUrl,
  parseGrubhubHistoryPayload,
  shouldTriggerGrubhubHistoryFetch,
} from '@/services/grubhub';
import { Colors } from '@/theme';

const HISTORY_NAV_JS = `window.location.href = ${JSON.stringify(GRUBHUB_HISTORY_URL)}; true;`;

export default function GrubhubConnectScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const postAuthHandled = useRef(false);
  const historyCaptureStarted = useRef(false);
  const ordersImported = useRef(false);

  const resetWebViewSession = () => {
    postAuthHandled.current = false;
    historyCaptureStarted.current = false;
    ordersImported.current = false;
  };

  const {
    isConnected,
    isConnecting,
    pendingCount,
    setGrubhubConnecting,
    importGrubhubOrders,
  } = usePendingQueue();

  const [showWebView, setShowWebView] = useState(false);
  const [webViewUri, setWebViewUri] = useState(GRUBHUB_LOGIN_URL);
  const [statusMessage, setStatusMessage] = useState('');

  const handleConnect = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Grubhub login',
        'Grubhub connect requires the iOS or Android app. Web preview does not support the login WebView.',
      );
      return;
    }

    resetWebViewSession();
    setWebViewUri(GRUBHUB_LOGIN_URL);
    setStatusMessage('Sign in to your Grubhub account…');
    setGrubhubConnecting(true);
    setShowWebView(true);
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
    setGrubhubConnecting(false);
    setStatusMessage('');
    resetWebViewSession();
  };

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    return isAllowedGrubhubFlowUrl(request.url);
  }, []);

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      const url = navState.url ?? '';
      if (navState.loading) return;

      if (isVtSsoFlowUrl(url)) {
        setStatusMessage('Completing Virginia Tech sign-in…');
        return;
      }

      const normalized = url.toLowerCase();
      if (normalized.includes('grubhub.com') && normalized.includes('login')) {
        setStatusMessage('Sign in to Grubhub…');
        return;
      }

      if (url.includes('/account/history')) {
        if (historyCaptureStarted.current) return;
        historyCaptureStarted.current = true;
        setStatusMessage('Fetching orders…');
        webViewRef.current?.injectJavaScript(GRUBHUB_INJECT_JS);
        setTimeout(() => {
          webViewRef.current?.reload();
        }, 150);
        return;
      }

      if (shouldTriggerGrubhubHistoryFetch(url) && !postAuthHandled.current) {
        postAuthHandled.current = true;
        setStatusMessage('Loading order history…');
        webViewRef.current?.injectJavaScript(GRUBHUB_INJECT_JS);
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(HISTORY_NAV_JS);
        }, 100);
      }
    },
    [],
  );

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      if (ordersImported.current) return;

      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (!isGrubhubOrdersMessage(payload)) return;

        const orders = parseGrubhubHistoryPayload(payload.data);
        ordersImported.current = true;
        importGrubhubOrders(orders);
        setShowWebView(false);
        setStatusMessage('');

        if (orders.length > 0) {
          router.push('/pending-queue');
        } else {
          Alert.alert(
            'No orders found',
            'We reached your order history but could not parse any orders. Try syncing again after placing an order.',
          );
        }
      } catch {
        setGrubhubConnecting(false);
        Alert.alert(
          'Import failed',
          'Could not read order data from Grubhub. Please try again.',
        );
      }
    },
    [importGrubhubOrders, router, setGrubhubConnecting],
  );

  const handleSyncAgain = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Grubhub sync', 'Use the iOS or Android app to sync orders.');
      return;
    }
    resetWebViewSession();
    setWebViewUri(GRUBHUB_HOME_URL);
    setGrubhubConnecting(true);
    setStatusMessage('Syncing order history…');
    setShowWebView(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.header}>Grubhub</Text>
        <Text style={styles.subtitle}>
          Sign in with Grubhub to import delivery orders into your pending
          queue for review.
        </Text>

        <View style={styles.iconWrap}>
          <SymbolView
            name={{
              ios: 'bag.fill',
              android: 'shopping_cart',
              web: 'shopping_cart',
            }}
            tintColor={Colors.maroon}
            size={72}
          />
        </View>

        {isConnected ? (
          <View style={styles.statusCard}>
            <View style={styles.connectedRow}>
              <SymbolView
                name={{
                  ios: 'checkmark.circle.fill',
                  android: 'check_circle',
                  web: 'check_circle',
                }}
                tintColor={Colors.green}
                size={24}
              />
              <Text style={styles.connectedText}>Grubhub connected</Text>
            </View>
            {pendingCount > 0 ? (
              <TouchableOpacity
                style={styles.queueBtn}
                onPress={() => router.push('/pending-queue')}>
                <Text style={styles.queueBtnText}>
                  Review {pendingCount} pending{' '}
                  {pendingCount === 1 ? 'order' : 'orders'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.emptyHint}>
                No orders waiting for review.
              </Text>
            )}
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleSyncAgain}
              activeOpacity={0.85}>
              <Text style={styles.syncBtnText}>Sync orders again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.connectBtn, isConnecting && styles.connectBtnDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
            activeOpacity={0.85}>
            {isConnecting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.connectBtnText}>Connect Grubhub</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Your session stays in the WebView. Order history is intercepted locally
          and never sent to our servers.
        </Text>
      </View>

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleCloseWebView}>
        <SafeAreaView style={styles.webViewSafe} edges={['top', 'bottom']}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={handleCloseWebView} hitSlop={12}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor={Colors.white}
                size={22}
              />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Grubhub Sign In</Text>
            <View style={styles.headerSpacer} />
          </View>

          {statusMessage.length > 0 && (
            <View style={styles.statusBar}>
              <ActivityIndicator color={Colors.maroon} size="small" />
              <Text style={styles.statusBarText}>{statusMessage}</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: webViewUri }}
            key={webViewUri}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            onNavigationStateChange={handleNavigationChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            domStorageEnabled
            javaScriptEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator color={Colors.maroon} size="large" />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  connectBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  connectBtnDisabled: {
    opacity: 0.7,
  },
  connectBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 14,
    padding: 20,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  connectedText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  queueBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  queueBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  syncBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.maroon,
  },
  syncBtnText: {
    color: Colors.maroon,
    fontWeight: '600',
    fontSize: 15,
  },
  emptyHint: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  note: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
    textAlign: 'center',
  },
  webViewSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  webViewTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 22,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.macroCard,
  },
  statusBarText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
