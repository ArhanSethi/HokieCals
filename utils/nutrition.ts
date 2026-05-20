export const ACTIVITY_LEVELS = [
  { id: 'sedentary' as const, label: 'Sedentary', multiplier: 1.2 },
  { id: 'light' as const, label: 'Lightly Active', multiplier: 1.375 },
  { id: 'moderate' as const, label: 'Moderate', multiplier: 1.55 },
  { id: 'active' as const, label: 'Very Active', multiplier: 1.725 },
];

export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]['id'];
export type GoalType = 'lose' | 'maintain' | 'gain';

export type ProfileForGoals = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
  activity_level: ActivityLevel;
  goal: GoalType;
};

export type CalorieBreakdown = {
  bmr: number;
  activityMultiplier: number;
  tdee: number;
  goalAdjustment: number;
  goalCalories: number;
};

export type MacroRatios = {
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroGramTargets = {
  protein: number;
  carbs: number;
  fat: number;
};

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

export function lbsToKg(lbs: number) {
  return lbs * 0.453592;
}

export function heightToCm(feet: number, inches: number) {
  return (feet * 12 + inches) * 2.54;
}

export function calculateBmr(profile: ProfileForGoals): number {
  const { weightKg, heightCm, age, sex } = profile;
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? bmr + 5 : bmr - 161);
}

export function getActivityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((a) => a.id === level)?.multiplier ?? 1.2;
}

export function calculateCalorieBreakdown(
  profile: ProfileForGoals,
): CalorieBreakdown {
  const bmr = calculateBmr(profile);
  const activityMultiplier = getActivityMultiplier(profile.activity_level);
  const tdee = Math.round(bmr * activityMultiplier);
  const goalAdjustment = GOAL_ADJUSTMENTS[profile.goal];
  const goalCalories = Math.max(1200, tdee + goalAdjustment);

  return {
    bmr,
    activityMultiplier,
    tdee,
    goalAdjustment,
    goalCalories,
  };
}

export function calculateGoals(profile: ProfileForGoals): number {
  return calculateCalorieBreakdown(profile).goalCalories;
}

export function macroGramTargets(
  goalCalories: number,
  ratios: MacroRatios,
): MacroGramTargets {
  const total = ratios.protein + ratios.carbs + ratios.fat || 100;
  const pPct = ratios.protein / total;
  const cPct = ratios.carbs / total;
  const fPct = ratios.fat / total;

  return {
    protein: Math.round((goalCalories * pPct) / 4),
    carbs: Math.round((goalCalories * cPct) / 4),
    fat: Math.round((goalCalories * fPct) / 9),
  };
}

export function adjustMacroSplit(
  key: keyof MacroRatios,
  newPercent: number,
  current: MacroRatios,
): MacroRatios {
  const clamped = Math.round(Math.max(0, Math.min(100, newPercent)));
  const otherKeys = (['protein', 'carbs', 'fat'] as const).filter(
    (k) => k !== key,
  );
  const otherSum = otherKeys.reduce((sum, k) => sum + current[k], 0);
  const remainder = 100 - clamped;

  const next: MacroRatios = { ...current, [key]: clamped };

  if (otherSum === 0) {
    const half = Math.floor(remainder / 2);
    next[otherKeys[0]] = half;
    next[otherKeys[1]] = remainder - half;
    return next;
  }

  let allocated = 0;
  otherKeys.forEach((k, index) => {
    if (index === otherKeys.length - 1) {
      next[k] = remainder - allocated;
    } else {
      const share = Math.round((current[k] / otherSum) * remainder);
      next[k] = share;
      allocated += share;
    }
  });

  const drift =
    100 - (next.protein + next.carbs + next.fat);
  if (drift !== 0) {
    next[otherKeys[otherKeys.length - 1]] += drift;
  }

  return next;
}
