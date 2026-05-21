import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { MealLogPreview } from '@/data/mockHomeData';
import type { MealSlot } from '@/types/grubhub';

export type LoggedMeal = {
  id: string;
  meal_name: string;
  meal_slot: MealSlot;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'dining_hall' | 'grubhub' | 'manual';
  logged_at: string;
};

type LogMealInput = {
  meal_name: string;
  meal_slot: MealSlot;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: LoggedMeal['source'];
};

type MealLogContextValue = {
  todayLogs: LoggedMeal[];
  logMeal: (meal: LogMealInput) => LoggedMeal;
  toPreview: (log: LoggedMeal) => MealLogPreview;
};

const MealLogContext = createContext<MealLogContextValue | null>(null);

export function MealLogProvider({ children }: { children: React.ReactNode }) {
  const [todayLogs, setTodayLogs] = useState<LoggedMeal[]>([]);

  const logMeal = useCallback((meal: LogMealInput) => {
    const entry: LoggedMeal = {
      ...meal,
      id: `log-${Date.now()}`,
      logged_at: new Date().toISOString(),
    };
    setTodayLogs((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const toPreview = useCallback(
    (log: LoggedMeal): MealLogPreview => ({
      id: log.id,
      meal_name: log.meal_name,
      meal_slot: log.meal_slot,
      calories: log.calories,
      source: log.source,
    }),
    [],
  );

  const value = useMemo(
    () => ({ todayLogs, logMeal, toPreview }),
    [todayLogs, logMeal, toPreview],
  );

  return (
    <MealLogContext.Provider value={value}>{children}</MealLogContext.Provider>
  );
}

export function useMealLog() {
  const ctx = useContext(MealLogContext);
  if (!ctx) {
    throw new Error('useMealLog must be used within MealLogProvider');
  }
  return ctx;
}
