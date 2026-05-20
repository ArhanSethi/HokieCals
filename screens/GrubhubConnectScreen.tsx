import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { usePendingQueue } from '@/context/PendingQueueContext';
import { Colors } from '@/theme';

export default function GrubhubConnectScreen() {
  const router = useRouter();
  const {
    isConnected,
    isConnecting,
    pendingCount,
    connectGrubhub,
  } = usePendingQueue();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleConnect = async () => {
    setShowLoginModal(true);
    await connectGrubhub();
  };

  const handleConnectComplete = () => {
    setShowLoginModal(false);
    router.push('/pending-queue');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.header}>Grubhub</Text>
        <Text style={styles.subtitle}>
          Import your campus delivery orders automatically. Review each order
          before it counts toward your daily log.
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
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.connectBtn, isConnecting && styles.connectBtnDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
            activeOpacity={0.85}>
            <Text style={styles.connectBtnText}>Connect Grubhub</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          In production, this opens a secure WebView login. For now, tap connect
          to simulate sign-in and load sample orders.
        </Text>
      </View>

      <Modal visible={showLoginModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Grubhub Sign In</Text>
            <View style={styles.fakeBrowser}>
              <ActivityIndicator color={Colors.maroon} size="large" />
              <Text style={styles.loginMessage}>
                {isConnecting
                  ? 'Signing in and fetching recent orders…'
                  : 'Import complete!'}
              </Text>
            </View>
            {!isConnecting && (
              <TouchableOpacity
                style={styles.loginDoneBtn}
                onPress={handleConnectComplete}>
                <Text style={styles.loginDoneText}>View pending orders</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  },
  queueBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyHint: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  note: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  loginTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  fakeBrowser: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  loginMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  loginDoneBtn: {
    marginTop: 20,
    backgroundColor: Colors.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginDoneText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
