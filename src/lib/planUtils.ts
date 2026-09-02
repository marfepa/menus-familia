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

export interface MealSlotLocation {
  day: DayOfWeek;
  meal: 'lunch' | 'dinner';
}

export interface SlotCookingContext {
  isFreshCook: boolean;
  isLeftover: boolean;
  totalInstances: number; // 1 + sobras dependientes
  leftoverCount: number; // Número de sobras que dependen de esta cocción
  leftoverSlots: MealSlotLocation[];
  parentCookDay?: DayOfWeek;
  parentCookMeal?: 'lunch' | 'dinner';
}

export const CHRONOLOGICAL_MEAL_SLOTS: MealSlotLocation[] = [
  { day: 'lunes', meal: 'lunch' },
  { day: 'lunes', meal: 'dinner' },
  { day: 'martes', meal: 'lunch' },
  { day: 'martes', meal: 'dinner' },
  { day: 'miercoles', meal: 'lunch' },
  { day: 'miercoles', meal: 'dinner' },
  { day: 'jueves', meal: 'lunch' },
  { day: 'jueves', meal: 'dinner' },
  { day: 'viernes', meal: 'lunch' },
  { day: 'viernes', meal: 'dinner' },
  { day: 'sabado', meal: 'lunch' },
  { day: 'sabado', meal: 'dinner' },
  { day: 'domingo', meal: 'lunch' },
  { day: 'domingo', meal: 'dinner' },
];

/**
 * Analiza un plan semanal y determina para cada hueco cuántas tomas cubre
 * (cocción fresca + sobras enlazadas) o de qué cocción previa procede si es una sobra.
 */
export function getPlanCookingSessions(plan: WeeklyPlan): Map<string, SlotCookingContext> {
  const map = new Map<string, SlotCookingContext>();

  // Paso 1: Identificar todas las cocciones frescas
  CHRONOLOGICAL_MEAL_SLOTS.forEach(({ day, meal }) => {
    const slot = plan.days[day]?.[meal];
    const kind = getSlotKind(slot);
    const key = `${day}-${meal}`;

    if (kind === 'recipe' && slot?.recipeId) {
      map.set(key, {
        isFreshCook: true,
        isLeftover: false,
        totalInstances: 1,
        leftoverCount: 0,
        leftoverSlots: [],
      });
    } else if (kind === 'leftover' && slot?.recipeId) {
      map.set(key, {
        isFreshCook: false,
        isLeftover: true,
        totalInstances: 1,
        leftoverCount: 0,
        leftoverSlots: [],
      });
    }
  });

  // Paso 2: Asociar cada hueco de sobra a su cocción fresca correspondiente
  CHRONOLOGICAL_MEAL_SLOTS.forEach((loc, currentIndex) => {
    const slot = plan.days[loc.day]?.[loc.meal];
    if (getSlotKind(slot) !== 'leftover' || !slot?.recipeId) return;

    const leftoverKey = `${loc.day}-${loc.meal}`;
    const leftoverCtx = map.get(leftoverKey);
    if (!leftoverCtx) return;

    let parentKey: string | null = null;

    // A) Enlace explícito por leftoverFromDay / leftoverFromMeal
    if (slot.leftoverFromDay && slot.leftoverFromMeal) {
      const explicitKey = `${slot.leftoverFromDay}-${slot.leftoverFromMeal}`;
      const explicitParent = map.get(explicitKey);
      if (explicitParent && explicitParent.isFreshCook) {
        parentKey = explicitKey;
      }
    }

    // B) Si no hay enlace explícito, buscar hacia atrás la cocción fresca más reciente del mismo recipeId
    if (!parentKey) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevLoc = CHRONOLOGICAL_MEAL_SLOTS[i];
        const prevSlot = plan.days[prevLoc.day]?.[prevLoc.meal];
        if (getSlotKind(prevSlot) === 'recipe' && prevSlot?.recipeId === slot.recipeId) {
          parentKey = `${prevLoc.day}-${prevLoc.meal}`;
          break;
        }
      }
    }

    if (parentKey) {
      const parentCtx = map.get(parentKey);
      if (parentCtx) {
        parentCtx.leftoverCount += 1;
        parentCtx.totalInstances += 1;
        parentCtx.leftoverSlots.push(loc);

        const [pDay, pMeal] = parentKey.split('-') as [DayOfWeek, 'lunch' | 'dinner'];
        leftoverCtx.parentCookDay = pDay;
        leftoverCtx.parentCookMeal = pMeal;
      }
    }
  });

  // Paso 3: Sincronizar totalInstances en los slots de sobras con su padre
  CHRONOLOGICAL_MEAL_SLOTS.forEach(({ day, meal }) => {
    const key = `${day}-${meal}`;
    const ctx = map.get(key);
    if (ctx?.isLeftover && ctx.parentCookDay && ctx.parentCookMeal) {
      const parentCtx = map.get(`${ctx.parentCookDay}-${ctx.parentCookMeal}`);
      if (parentCtx) {
        ctx.totalInstances = parentCtx.totalInstances;
      }
    }
  });

  return map;
}

