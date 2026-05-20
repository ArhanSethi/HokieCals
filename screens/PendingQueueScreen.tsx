import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import EditPendingOrderSheet from '@/components/EditPendingOrderSheet';
import PendingOrderCard from '@/components/PendingOrderCard';
import { usePendingQueue } from '@/context/PendingQueueContext';
import { Colors } from '@/theme';
import type { PendingOrder } from '@/types/grubhub';

export default function PendingQueueScreen() {
  const router = useRouter();
  const { pendingOrders, acceptOrder, denyOrder, updateOrder } =
    usePendingQueue();
  const [editingOrder, setEditingOrder] = useState<PendingOrder | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}>
          <SymbolView
            name={{
              ios: 'chevron.left',
              android: 'arrow_back',
              web: 'arrow_back',
            }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Pending Queue</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.hint}>
        Accept to add to your log, deny to discard, or edit before accepting.
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {pendingOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>
              No Grubhub orders waiting for review.
            </Text>
          </View>
        ) : (
          pendingOrders.map((order) => (
            <PendingOrderCard
              key={order.id}
              order={order}
              onAccept={() => acceptOrder(order.id)}
              onDeny={() => denyOrder(order.id)}
              onEdit={() => setEditingOrder(order)}
            />
          ))
        )}
      </ScrollView>

      <EditPendingOrderSheet
        visible={editingOrder !== null}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={(updates) => {
          if (editingOrder) {
            updateOrder(editingOrder.id, updates);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
