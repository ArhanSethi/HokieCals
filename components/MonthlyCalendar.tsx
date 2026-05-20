import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/theme';
import {
  formatMonthYear,
  getMonthGrid,
  toDateKey,
  type CalendarCell,
} from '@/utils/calendarDates';

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  year: number;
  month: number;
  selectedDateKey: string;
  datesWithMeals: Set<string>;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function MonthlyCalendar({
  year,
  month,
  selectedDateKey,
  datesWithMeals,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const cells = getMonthGrid(year, month);
  const todayKey = toDateKey(new Date());

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.arrow} hitSlop={12}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonthYear(year, month)}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.arrow} hitSlop={12}>
          <SymbolView
            name={{
              ios: 'chevron.right',
              android: 'arrow_forward',
              web: 'arrow_forward',
            }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEK_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <DayCell
            key={cell.dateKey}
            cell={cell}
            isSelected={cell.dateKey === selectedDateKey}
            isToday={cell.dateKey === todayKey}
            hasMeals={datesWithMeals.has(cell.dateKey)}
            onPress={() => onSelectDate(cell.dateKey)}
          />
        ))}
      </View>
    </View>
  );
}

function DayCell({
  cell,
  isSelected,
  isToday,
  hasMeals,
  onPress,
}: {
  cell: CalendarCell;
  isSelected: boolean;
  isToday: boolean;
  hasMeals: boolean;
  onPress: () => void;
}) {
  const dayNum = cell.date.getDate();

  return (
    <TouchableOpacity
      style={styles.dayCell}
      onPress={onPress}
      activeOpacity={0.75}>
      <View
        style={[
          styles.dayInner,
          isSelected && styles.daySelected,
          isToday && !isSelected && styles.dayToday,
        ]}>
        <Text
          style={[
            styles.dayNum,
            !cell.inCurrentMonth && styles.dayNumMuted,
            isSelected && styles.dayNumSelected,
          ]}>
          {dayNum}
        </Text>
        {hasMeals && (
          <View
            style={[styles.dot, isSelected && styles.dotSelected]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayInner: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  daySelected: {
    backgroundColor: Colors.maroon,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: Colors.maroon,
  },
  dayNum: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  dayNumMuted: {
    color: '#555',
  },
  dayNumSelected: {
    color: Colors.white,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.maroon,
    marginTop: 3,
  },
  dotSelected: {
    backgroundColor: Colors.white,
  },
});
