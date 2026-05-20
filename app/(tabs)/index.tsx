import HomeScreen from '@/screens/HomeScreen';
import {
  MOCK_PENDING_COUNT,
  MOCK_RECENT_LOGS,
  MOCK_SUMMARY,
} from '@/data/mockHomeData';

export default function HomeTab() {
  return (
    <HomeScreen
      summary={MOCK_SUMMARY}
      recentLogs={MOCK_RECENT_LOGS}
      pendingCount={MOCK_PENDING_COUNT}
    />
  );
}
