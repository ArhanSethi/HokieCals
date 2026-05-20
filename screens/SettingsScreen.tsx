import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MacroAdjustModal from '@/components/MacroAdjustModal';
import { usePendingQueue } from '@/context/PendingQueueContext';
import { useSettings } from '@/context/SettingsContext';
import { Colors } from '@/theme';
import { ACTIVITY_LEVELS, type GoalType, type MacroRatios } from '@/utils/nutrition';

const GOAL_OPTIONS: { id: GoalType; title: string; subtitle: string }[] = [
  { id: 'lose', title: 'Lose Weight', subtitle: '−500 kcal from TDEE' },
  { id: 'maintain', title: 'Maintain', subtitle: 'Stay at TDEE' },
  { id: 'gain', title: 'Gain Muscle', subtitle: '+500 kcal from TDEE' },
];

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

type PillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function Pill({ label, active, onPress }: PillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, setMacroRatio, breakdown, macroTargets } =
    useSettings();
  const { isConnected, disconnectGrubhub } = usePendingQueue();
  const [editingMacro, setEditingMacro] = useState<keyof MacroRatios | null>(
    null,
  );

  const goalAdjustmentLabel =
    breakdown?.goalAdjustment === 0
      ? '±0 kcal'
      : breakdown && breakdown.goalAdjustment > 0
        ? `+${breakdown.goalAdjustment} kcal`
        : `${breakdown?.goalAdjustment} kcal`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <SectionTitle>Profile</SectionTitle>

          <FieldLabel>Name</FieldLabel>
          <TextInput
            style={styles.input}
            value={settings.name}
            onChangeText={(name) => updateSettings({ name })}
            placeholder="Your name"
            placeholderTextColor={Colors.textSecondary}
          />

          <FieldLabel>Age</FieldLabel>
          <TextInput
            style={styles.input}
            value={settings.age}
            onChangeText={(age) => updateSettings({ age })}
            keyboardType="number-pad"
            placeholder="20"
            placeholderTextColor={Colors.textSecondary}
          />

          <FieldLabel>Weight (lbs)</FieldLabel>
          <TextInput
            style={styles.input}
            value={settings.weightLbs}
            onChangeText={(weightLbs) => updateSettings({ weightLbs })}
            keyboardType="decimal-pad"
            placeholder="170"
            placeholderTextColor={Colors.textSecondary}
          />

          <FieldLabel>Height</FieldLabel>
          <View style={styles.heightRow}>
            <View style={styles.heightField}>
              <Text style={styles.heightUnit}>ft</Text>
              <TextInput
                style={styles.input}
                value={settings.heightFt}
                onChangeText={(heightFt) => updateSettings({ heightFt })}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={styles.heightField}>
              <Text style={styles.heightUnit}>in</Text>
              <TextInput
                style={styles.input}
                value={settings.heightIn}
                onChangeText={(heightIn) => updateSettings({ heightIn })}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <FieldLabel>Sex</FieldLabel>
          <View style={styles.pillRow}>
            <Pill
              label="Male"
              active={settings.sex === 'male'}
              onPress={() => updateSettings({ sex: 'male' })}
            />
            <Pill
              label="Female"
              active={settings.sex === 'female'}
              onPress={() => updateSettings({ sex: 'female' })}
            />
          </View>

          <FieldLabel>Activity Level</FieldLabel>
          <View style={styles.pillWrap}>
            {ACTIVITY_LEVELS.map((level) => (
              <Pill
                key={level.id}
                label={level.label}
                active={settings.activityLevel === level.id}
                onPress={() => updateSettings({ activityLevel: level.id })}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Goal</SectionTitle>
          <View style={styles.goalRow}>
            {GOAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.goalCard,
                  settings.goal === opt.id && styles.goalCardActive,
                ]}
                onPress={() => updateSettings({ goal: opt.id })}
                activeOpacity={0.85}>
                <Text
                  style={[
                    styles.goalTitle,
                    settings.goal === opt.id && styles.goalTitleActive,
                  ]}>
                  {opt.title}
                </Text>
                <Text style={styles.goalSubtitle}>{opt.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {breakdown ? (
            <View style={styles.breakdownCard}>
              <Text style={styles.goalKcal}>{breakdown.goalCalories}</Text>
              <Text style={styles.goalKcalLabel}>daily calorie goal</Text>
              <Text style={styles.breakdownLine}>
                BMR {breakdown.bmr} kcal → TDEE {breakdown.tdee} kcal (×
                {breakdown.activityMultiplier}) → Goal {breakdown.goalCalories}{' '}
                kcal ({goalAdjustmentLabel})
              </Text>
            </View>
          ) : (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHint}>
                Enter a valid age, weight, and height to calculate your goal.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>Macros</SectionTitle>
          <Text style={styles.macroHint}>
            Tap a macro to adjust. Percentages always total 100%.
          </Text>
          <View style={styles.macroPillRow}>
            {(
              [
                ['protein', Colors.macroProtein],
                ['carbs', Colors.macroCarbs],
                ['fat', Colors.macroFat],
              ] as const
            ).map(([key, accent]) => (
              <TouchableOpacity
                key={key}
                style={styles.macroPill}
                onPress={() => setEditingMacro(key)}
                activeOpacity={0.8}>
                <View style={[styles.macroDot, { backgroundColor: accent }]} />
                <Text style={styles.macroPillLabel}>
                  {key === 'protein' ? 'Protein' : key === 'carbs' ? 'Carbs' : 'Fat'}
                </Text>
                <Text style={styles.macroPillPct}>
                  {settings.macroRatios[key]}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {macroTargets && breakdown && (
            <View style={styles.gramCard}>
              <Text style={styles.gramTitle}>Daily targets</Text>
              <Text style={styles.gramLine}>
                Protein {macroTargets.protein}g · Carbs {macroTargets.carbs}g ·
                Fat {macroTargets.fat}g
              </Text>
              <Text style={styles.gramSub}>
                Based on {breakdown.goalCalories} kcal goal
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>Grubhub</SectionTitle>
          <View style={styles.grubhubCard}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.statusConnected : styles.statusDisconnected,
                ]}
              />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <Text style={styles.grubhubHint}>
              {isConnected
                ? 'Orders sync to your pending queue for review.'
                : 'Connect from the Grubhub tab to import delivery orders.'}
            </Text>
            {isConnected && (
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={disconnectGrubhub}
                activeOpacity={0.85}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <MacroAdjustModal
        visible={editingMacro !== null}
        macroKey={editingMacro}
        value={editingMacro ? settings.macroRatios[editingMacro] : 0}
        onClose={() => setEditingMacro(null)}
        onChange={(percent) => {
          if (editingMacro) setMacroRatio(editingMacro, percent);
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 14,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 16,
    marginBottom: 12,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  heightField: {
    flex: 1,
  },
  heightUnit: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.macroCard,
  },
  pillActive: {
    backgroundColor: Colors.maroon,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.white,
  },
  goalRow: {
    gap: 10,
    marginBottom: 14,
  },
  goalCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardActive: {
    borderColor: Colors.maroon,
    backgroundColor: '#2a1520',
  },
  goalTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalTitleActive: {
    color: Colors.white,
  },
  goalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  breakdownCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  goalKcal: {
    color: Colors.white,
    fontSize: 40,
    fontWeight: '700',
  },
  goalKcalLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  breakdownLine: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  breakdownHint: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  macroHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  macroPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  macroPill: {
    flex: 1,
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  macroPillLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroPillPct: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  gramCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
  },
  gramTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  gramLine: {
    color: Colors.white,
    fontSize: 15,
    marginBottom: 4,
  },
  gramSub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  grubhubCard: {
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusConnected: {
    backgroundColor: Colors.green,
  },
  statusDisconnected: {
    backgroundColor: '#666',
  },
  statusText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  grubhubHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  disconnectBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.red,
  },
  disconnectText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 15,
  },
});
