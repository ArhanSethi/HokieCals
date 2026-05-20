import { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { usePendingQueue } from '@/context/PendingQueueContext';
import {
  MOCK_RECENT_LOGS,
  MOCK_SUMMARY,
  type DaySummary,
} from '@/data/mockHomeData';
import HomeScreen from '@/screens/HomeScreen';

export default function HomeTab() {
  const router = useRouter();
  const { pendingCount, acceptedLogs } = usePendingQueue();

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
      ...MOCK_SUMMARY,
      consumed: MOCK_SUMMARY.consumed + extra.calories,
      p: MOCK_SUMMARY.p + extra.p,
      c: MOCK_SUMMARY.c + extra.c,
      f: MOCK_SUMMARY.f + extra.f,
    };
  }, [acceptedLogs]);

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
