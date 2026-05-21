import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { MealLogPreview } from '@/data/mockHomeData';
import type { PendingOrder, PendingOrderUpdates } from '@/types/grubhub';

export type AcceptedMealLog = MealLogPreview & {
  protein: number;
  carbs: number;
  fat: number;
};

type PendingQueueContextValue = {
  isConnected: boolean;
  isConnecting: boolean;
  pendingOrders: PendingOrder[];
  acceptedLogs: AcceptedMealLog[];
  pendingCount: number;
  setGrubhubConnecting: (connecting: boolean) => void;
  importGrubhubOrders: (orders: PendingOrder[]) => void;
  disconnectGrubhub: () => void;
  acceptOrder: (id: string) => void;
  denyOrder: (id: string) => void;
  updateOrder: (id: string, updates: PendingOrderUpdates) => void;
};

const PendingQueueContext = createContext<PendingQueueContextValue | null>(
  null,
);

export function PendingQueueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [acceptedLogs, setAcceptedLogs] = useState<AcceptedMealLog[]>([]);

  const setGrubhubConnecting = useCallback((connecting: boolean) => {
    setIsConnecting(connecting);
  }, []);

  const importGrubhubOrders = useCallback((orders: PendingOrder[]) => {
    setIsConnected(true);
    setIsConnecting(false);
    setPendingOrders(orders);
  }, []);

  const disconnectGrubhub = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setPendingOrders([]);
  }, []);

  const acceptOrder = useCallback((id: string) => {
    setPendingOrders((prev) => {
      const order = prev.find((o) => o.id === id);
      if (!order) return prev;

      const log: AcceptedMealLog = {
        id: `accepted-${order.id}-${Date.now()}`,
        meal_name: order.meal_name,
        meal_slot: order.meal_slot,
        calories: order.calories,
        protein: order.protein,
        carbs: order.carbs,
        fat: order.fat,
        source: 'grubhub',
      };
      setAcceptedLogs((logs) => [log, ...logs]);
      return prev.filter((o) => o.id !== id);
    });
  }, []);

  const denyOrder = useCallback((id: string) => {
    setPendingOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateOrder = useCallback((id: string, updates: PendingOrderUpdates) => {
    setPendingOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      isConnecting,
      pendingOrders,
      acceptedLogs,
      pendingCount: pendingOrders.length,
      setGrubhubConnecting,
      importGrubhubOrders,
      disconnectGrubhub,
      acceptOrder,
      denyOrder,
      updateOrder,
    }),
    [
      isConnected,
      isConnecting,
      pendingOrders,
      acceptedLogs,
      setGrubhubConnecting,
      importGrubhubOrders,
      disconnectGrubhub,
      acceptOrder,
      denyOrder,
      updateOrder,
    ],
  );

  return (
    <PendingQueueContext.Provider value={value}>
      {children}
    </PendingQueueContext.Provider>
  );
}

export function usePendingQueue() {
  const ctx = useContext(PendingQueueContext);
  if (!ctx) {
    throw new Error('usePendingQueue must be used within PendingQueueProvider');
  }
  return ctx;
}
