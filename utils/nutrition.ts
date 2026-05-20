export type ProfileForGoals = {
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  activity_level: string;
  goal: 'lose' | 'maintain' | 'gain';
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function calculateGoals(profile: ProfileForGoals): number {
  const { weight, height, age, sex, activity_level, goal } = profile;

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr = sex === 'male' ? bmr + 5 : bmr - 161;

  let tdee = bmr * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2);

  if (goal === 'lose') tdee -= 500;
  if (goal === 'gain') tdee += 500;

  return Math.round(tdee);
}
