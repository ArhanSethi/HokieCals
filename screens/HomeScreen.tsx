import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors } from '../theme';
import type { DaySummary, MealLogPreview } from '../data/mockHomeData';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const MACRO_RING_SIZE = 64;

function getCurrentWeekDays() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return DAY_LETTERS.map((letter, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return { letter, dateNum: date.getDate(), dayIndex: i };
  });
}

function macroColorFn(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

type MacroCardProps = {
  label: string;
  current: number;
  goal: number;
  color: string;
};

function MacroCard({ label, current, goal, color }: MacroCardProps) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const over = current > goal;

  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroRingWrap}>
        <ProgressChart
          data={{ data: [progress] }}
          width={MACRO_RING_SIZE}
          height={MACRO_RING_SIZE}
          strokeWidth={6}
          radius={24}
          chartConfig={{
            backgroundColor: Colors.macroCard,
            backgroundGradientFrom: Colors.macroCard,
            backgroundGradientTo: Colors.macroCard,
            color: macroColorFn(color),
          }}
          hideLegend
        />
        <View style={styles.macroRingLabel}>
          <Text style={[styles.macroRingGrams, over && styles.macroOver]}>
            {current}
          </Text>
        </View>
      </View>
      <Text style={styles.macroGoalText}>/ {goal}g</Text>
    </View>
  );
}

function formatSource(source: string) {
  switch (source) {
    case 'dining_hall':
      return 'Dining Hall';
    case 'grubhub':
      return 'Grubhub';
    case 'manual':
      return 'Manual';
    default:
      return source;
  }
}

type HomeScreenProps = {
  summary: DaySummary;
  recentLogs: MealLogPreview[];
  pendingCount: number;
  onPendingPress?: () => void;
  onAddPress?: () => void;
};

export default function HomeScreen({
  summary,
  recentLogs,
  pendingCount,
  onPendingPress,
  onAddPress,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const chartSize = Math.min(width - 48, 280);
  const progress = Math.min(
    Math.max(summary.consumed / summary.goal, 0),
    1,
  );
  const kcalLeft = Math.max(summary.goal - summary.consumed, 0);
  const today = new Date().getDay();
  const weekDays = useMemo(() => getCurrentWeekDays(), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>HokieCals</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddPress}
            activeOpacity={0.85}
            accessibilityLabel="Log dining hall meal">
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={Colors.white}
              size={26}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map(({ letter, dateNum, dayIndex }) => (
            <View
              key={dayIndex}
              style={[
                styles.dayCircle,
                dayIndex === today && styles.activeDay,
              ]}>
              <Text
                style={[
                  styles.dayText,
                  dayIndex === today && styles.activeDayText,
                ]}>
                {letter}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  dayIndex === today && styles.activeDayText,
                ]}>
                {dateNum}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartContainer, { height: chartSize }]}>
          <ProgressChart
            data={{ data: [progress] }}
            width={chartSize}
            height={chartSize}
            strokeWidth={16}
            radius={chartSize / 2 - 20}
            chartConfig={{
              backgroundColor: Colors.background,
              backgroundGradientFrom: Colors.background,
              backgroundGradientTo: Colors.background,
              color: (opacity = 1) => `rgba(134, 31, 65, ${opacity})`,
            }}
            hideLegend
          />
          <View style={styles.chartLabel}>
            <Text style={styles.kcalNum}>{summary.consumed}</Text>
            <Text style={styles.kcalSub}>{summary.goal} goal</Text>
            <Text style={styles.kcalRemaining}>{kcalLeft} remaining</Text>
          </View>
        </View>

        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            current={summary.p}
            goal={summary.pGoal}
            color={Colors.macroProtein}
          />
          <MacroCard
            label="Carbs"
            current={summary.c}
            goal={summary.cGoal}
            color={Colors.macroCarbs}
          />
          <MacroCard
            label="Fat"
            current={summary.f}
            goal={summary.fGoal}
            color={Colors.macroFat}
          />
        </View>

        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBadge}
            activeOpacity={0.8}
            onPress={onPendingPress}>
            <Text style={styles.pendingText}>
              {pendingCount} Orders to Review
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Recently Logged</Text>
        {recentLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logInfo}>
              <Text style={styles.logName}>{log.meal_name}</Text>
              <Text style={styles.logMeta}>
                {formatSource(log.source)} • {log.meal_slot}
              </Text>
            </View>
            <Text style={styles.logKcal}>{log.calories} kcal</Text>
          </View>
        ))}
      </ScrollView>
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
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayCircle: {
    width: 40,
    minHeight: 48,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  activeDay: {
    backgroundColor: Colors.maroon,
  },
  dayText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  dayDate: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 1,
  },
  activeDayText: {
    color: Colors.white,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  chartLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  kcalNum: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.white,
  },
  kcalSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  kcalRemaining: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  macroRingWrap: {
    width: MACRO_RING_SIZE,
    height: MACRO_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingGrams: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  macroOver: {
    color: Colors.red,
  },
  macroGoalText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: Colors.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  pendingText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  logInfo: {
    flex: 1,
    marginRight: 12,
  },
  logName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  logKcal: {
    color: Colors.maroon,
    fontSize: 16,
    fontWeight: '700',
  },
});
