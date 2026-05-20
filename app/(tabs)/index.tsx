import { useMemo } from 'react';
import { useRouter } from 'expo-router';

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

  const summary = useMemo((): DaySummary => {
    const extra = acceptedLogs.reduce(
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
  }, [acceptedLogs, breakdown, macroTargets]);

  const recentLogs = useMemo(
    () => [
      ...acceptedLogs.map(({ protein, carbs, fat, ...log }) => log),
      ...MOCK_RECENT_LOGS,
    ],
    [acceptedLogs],
  );

  return (
    <HomeScreen
      summary={summary}
      recentLogs={recentLogs}
      pendingCount={pendingCount}
      onPendingPress={() => router.push('/pending-queue')}
    />
  );
}
