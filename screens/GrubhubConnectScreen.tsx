import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useGrubhubAuth } from '@/context/GrubhubAuthContext';
import { usePendingQueue } from '@/context/PendingQueueContext';
import { Colors } from '@/theme';

export default function GrubhubConnectScreen() {
  const router = useRouter();
  const { pendingCount } = usePendingQueue();
  const {
    isConnected,
    isConnecting,
    sessionExpired,
    networkError,
    loginError,
    login,
    syncOrders,
    disconnect,
    clearLoginError,
    dismissNetworkError,
  } = useGrubhubAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password || isConnecting) return;
    await login(email.trim(), password);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Grubhub</Text>
          <Text style={styles.subtitle}>
            Sign in with your campus Grubhub account to import orders into your
            pending queue.
          </Text>

          {sessionExpired && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Session expired — sign in again to keep syncing orders.
              </Text>
            </View>
          )}

          {networkError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                Network error. Check your connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  dismissNetworkError();
                  handleSignIn();
                }}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearLoginError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@vt.edu"
              placeholderTextColor={Colors.textSecondary}
              editable={!isConnecting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearLoginError();
              }}
              secureTextEntry
              textContentType="password"
              placeholder="Password"
              placeholderTextColor={Colors.textSecondary}
              editable={!isConnecting}
            />

            {loginError ? (
              <Text style={styles.inlineError}>{loginError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.signInBtn, isConnecting && styles.signInBtnDisabled]}
              onPress={handleSignIn}
              disabled={isConnecting || !email.trim() || !password}
              activeOpacity={0.85}>
              {isConnecting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.signInBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {isConnected && !sessionExpired && (
            <View style={styles.statusCard}>
              <View style={styles.connectedRow}>
                <View style={styles.statusDot} />
                <Text style={styles.connectedText}>Signed in</Text>
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
                  No new orders in your pending queue.
                </Text>
              )}

              <TouchableOpacity
                style={styles.syncBtn}
                onPress={syncOrders}
                disabled={isConnecting}
                activeOpacity={0.85}>
                {isConnecting ? (
                  <ActivityIndicator color={Colors.maroon} />
                ) : (
                  <Text style={styles.syncBtnText}>Sync orders</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={disconnect}
                activeOpacity={0.85}>
                <Text style={styles.disconnectText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.note}>
            Credentials are sent only to Grubhub. Tokens are stored securely on
            your device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
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
    marginBottom: 24,
  },
  banner: {
    backgroundColor: '#3a2020',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.maroon,
  },
  bannerText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.maroon,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 16,
    marginBottom: 16,
  },
  inlineError: {
    color: Colors.red,
    fontSize: 14,
    marginBottom: 12,
  },
  signInBtn: {
    backgroundColor: Colors.maroon,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
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
    marginBottom: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  syncBtnText: {
    color: Colors.maroon,
    fontWeight: '600',
    fontSize: 15,
  },
  disconnectBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  disconnectText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center',
  },
});
