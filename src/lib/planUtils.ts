import type { DayOfWeek, MealSlotData, MealSlotKind, WeeklyPlan } from '@/types';

export const PLAN_DAYS: DayOfWeek[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

export function emptyWeeklyPlan(weekStartDate: string): WeeklyPlan {
  return {
    id: `plan-${weekStartDate}`,
    weekStartDate,
    days: {
      lunes: {},
      martes: {},
      miercoles: {},
      jueves: {},
      viernes: {},
      sabado: {},
      domingo: {},
    },
  };
}

export function getSlotKind(slot?: MealSlotData): MealSlotKind | 'empty' {
  if (!slot) return 'empty';
  if (slot.kind) return slot.kind;
  if (slot.recipeId) return 'recipe';
  if (slot.customName) return 'custom';
  return 'empty';
}

export function isSlotFilled(slot?: MealSlotData): boolean {
  return getSlotKind(slot) !== 'empty';
}

/** Solo las cocciones nuevas cuentan para la lista (las sobras ya se compraron el día de cocinar). */
export function slotNeedsIngredients(slot?: MealSlotData): boolean {
  const kind = getSlotKind(slot);
  return kind === 'recipe';
}

export function isPlanEmpty(plan: WeeklyPlan): boolean {
  return PLAN_DAYS.every((day) => {
    const d = plan.days[day];
    return !isSlotFilled(d?.lunch) && !isSlotFilled(d?.dinner);
  });
}

export function clonePlanForWeek(source: WeeklyPlan, newWeekStart: string): WeeklyPlan {
  return {
    id: `plan-${newWeekStart}`,
    weekStartDate: newWeekStart,
    days: JSON.parse(JSON.stringify(source.days)),
  };
}

export function countPlannedSlots(plan: WeeklyPlan): number {
  let n = 0;
  PLAN_DAYS.forEach((day) => {
    if (isSlotFilled(plan.days[day]?.lunch)) n += 1;
    if (isSlotFilled(plan.days[day]?.dinner)) n += 1;
  });
  return n;
}

export function removeRecipeFromPlans(
  plans: Record<string, WeeklyPlan>,
  recipeId: string
): Record<string, WeeklyPlan> {
  const next: Record<string, WeeklyPlan> = {};
  Object.entries(plans).forEach(([week, plan]) => {
    const days = { ...plan.days };
    PLAN_DAYS.forEach((day) => {
      const dayPlan = { ...days[day] };
      (['lunch', 'dinner'] as const).forEach((meal) => {
        const slot = dayPlan[meal];
        if (slot?.recipeId === recipeId) {
          dayPlan[meal] = undefined;
        }
      });
      days[day] = dayPlan;
    });
    next[week] = { ...plan, days };
  });
  return next;
}
