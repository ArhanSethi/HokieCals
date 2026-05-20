import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  adjustMacroSplit,
  calculateCalorieBreakdown,
  heightToCm,
  lbsToKg,
  macroGramTargets,
  type ActivityLevel,
  type CalorieBreakdown,
  type GoalType,
  type MacroGramTargets,
  type MacroRatios,
  type ProfileForGoals,
} from '@/utils/nutrition';

export type UserSettings = {
  name: string;
  age: string;
  weightLbs: string;
  heightFt: string;
  heightIn: string;
  sex: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: GoalType;
  macroRatios: MacroRatios;
};

type SettingsContextValue = {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setMacroRatio: (key: keyof MacroRatios, percent: number) => void;
  profileForCalc: ProfileForGoals | null;
  breakdown: CalorieBreakdown | null;
  macroTargets: MacroGramTargets | null;
};

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  age: '20',
  weightLbs: '170',
  heightFt: '5',
  heightIn: '10',
  sex: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  macroRatios: { protein: 30, carbs: 40, fat: 30 },
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseProfile(settings: UserSettings): ProfileForGoals | null {
  const age = parseInt(settings.age, 10);
  const weightLbs = parseFloat(settings.weightLbs);
  const heightFt = parseInt(settings.heightFt, 10);
  const heightIn = parseInt(settings.heightIn, 10);

  if (
    !Number.isFinite(age) ||
    age < 13 ||
    age > 100 ||
    !Number.isFinite(weightLbs) ||
    weightLbs <= 0 ||
    !Number.isFinite(heightFt) ||
    heightFt < 3 ||
    heightFt > 8 ||
    !Number.isFinite(heightIn) ||
    heightIn < 0 ||
    heightIn > 11
  ) {
    return null;
  }

  return {
    age,
    weightKg: lbsToKg(weightLbs),
    heightCm: heightToCm(heightFt, heightIn),
    sex: settings.sex,
    activity_level: settings.activityLevel,
    goal: settings.goal,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setMacroRatio = useCallback((key: keyof MacroRatios, percent: number) => {
    setSettings((prev) => ({
      ...prev,
      macroRatios: adjustMacroSplit(key, percent, prev.macroRatios),
    }));
  }, []);

  const profileForCalc = useMemo(
    () => parseProfile(settings),
    [settings],
  );

  const breakdown = useMemo(
    () => (profileForCalc ? calculateCalorieBreakdown(profileForCalc) : null),
    [profileForCalc],
  );

  const macroTargets = useMemo(() => {
    if (!breakdown) return null;
    return macroGramTargets(breakdown.goalCalories, settings.macroRatios);
  }, [breakdown, settings.macroRatios]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      setMacroRatio,
      profileForCalc,
      breakdown,
      macroTargets,
    }),
    [
      settings,
      updateSettings,
      setMacroRatio,
      profileForCalc,
      breakdown,
      macroTargets,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
