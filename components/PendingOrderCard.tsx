import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/theme';
import type { PendingOrder } from '@/types/grubhub';

function formatOrderTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type Props = {
  order: PendingOrder;
  onAccept: () => void;
  onDeny: () => void;
  onEdit: () => void;
};

export default function PendingOrderCard({
  order,
  onAccept,
  onDeny,
  onEdit,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{order.meal_name}</Text>
      <Text style={styles.kcal}>{order.calories} kcal (est.)</Text>
      <Text style={styles.macros}>
        P {order.protein}g · C {order.carbs}g · F {order.fat}g
      </Text>
      <Text style={styles.meta}>
        {order.meal_slot} · {formatOrderTime(order.order_time)}
      </Text>
      {order.items.length > 0 && (
        <Text style={styles.items} numberOfLines={2}>
          {order.items.join(' · ')}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={onAccept}
          accessibilityLabel="Accept order">
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.denyBtn]}
          onPress={onDeny}
          accessibilityLabel="Deny order">
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            tintColor={Colors.white}
            size={20}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={onEdit}
          accessibilityLabel="Edit order">
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            tintColor={Colors.white}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.macroCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  kcal: {
    color: Colors.maroon,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  macros: {
    color: Colors.white,
    fontSize: 14,
    marginBottom: 4,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  items: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: Colors.green,
  },
  denyBtn: {
    backgroundColor: Colors.red,
  },
  editBtn: {
    backgroundColor: '#555',
  },
});
