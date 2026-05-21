import { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { useMealLog } from '@/context/MealLogContext';
import { usePendingQueue } from '@/context/PendingQueueContext';
import { useSettings } from '@/context/SettingsContext';
import {
  MOCK_RECENT_LOGS,
  MOCK_SUMMARY,
  type DaySummary,
} from '@/data/mockHomeData';
import HomeScreen from '@/screens/HomeScreen';

export default function HomeTab() {
  const router = useRouter();
  const { pendingCount, acceptedLogs } = usePendingQueue();
  const { breakdown, macroTargets } = useSettings();
  const { todayLogs, toPreview } = useMealLog();

  const summary = useMemo((): DaySummary => {
    const allLogs = [
      ...todayLogs,
      ...acceptedLogs.map((log) => ({
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
      })),
    ];
    const extra = allLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        p: acc.p + log.protein,
        c: acc.c + log.carbs,
        f: acc.f + log.fat,
      }),
      { calories: 0, p: 0, c: 0, f: 0 },
    );
    return {
      goal: breakdown?.goalCalories ?? MOCK_SUMMARY.goal,
      consumed: MOCK_SUMMARY.consumed + extra.calories,
      p: MOCK_SUMMARY.p + extra.p,
      pGoal: macroTargets?.protein ?? MOCK_SUMMARY.pGoal,
      c: MOCK_SUMMARY.c + extra.c,
      cGoal: macroTargets?.carbs ?? MOCK_SUMMARY.cGoal,
      f: MOCK_SUMMARY.f + extra.f,
      fGoal: macroTargets?.fat ?? MOCK_SUMMARY.fGoal,
    };
  }, [todayLogs, acceptedLogs, breakdown, macroTargets]);

  const recentLogs = useMemo(
    () => [
      ...todayLogs.map(toPreview),
      ...acceptedLogs.map(({ protein, carbs, fat, ...log }) => log),
      ...MOCK_RECENT_LOGS,
    ],
    [todayLogs, acceptedLogs, toPreview],
  );

  return (
    <HomeScreen
      summary={summary}
      recentLogs={recentLogs}
      pendingCount={pendingCount}
      onPendingPress={() => router.push('/pending-queue')}
      onAddPress={() => router.push('/dining-hall')}
    />
  );
}
