import type { Recipe, WeeklyPlan, GenerateMode, MealSlotData, ExcludedFoodItem } from '@/types';
import { PLAN_DAYS, emptyWeeklyPlan, getSlotKind } from '@/lib/planUtils';
import { matchesExcludedFood } from '@/lib/pantryUtils';

export interface GenerationOptions {
  prioritizeFavorites?: boolean;
  quickDinners?: boolean;
  balancedProteins?: boolean;
  glutenLight?: boolean;
  kidsFriendlyDinners?: boolean;
  prioritizeAirFryerDinners?: boolean;
  mode?: GenerateMode;
  excludedFoods?: ExcludedFoodItem[];
  rng?: () => number;
}

export interface GeneratedPlanResult {
  plan: WeeklyPlan;
  warnings: string[];
}

const GLUTEN_NAME_RE =
  /pasta\b|trigo|cuscus|couscous|espagueti|macarron|sémola|semola|pan rallado|harina de trigo|lasana|lasaña|fideos de trigo/i;

const PROTEIN_GROUPS: Array<{ id: string; tags: string[] }> = [
  { id: 'pescado', tags: ['Pescado'] },
  { id: 'carne', tags: ['Carne', 'Pollo'] },
  { id: 'legumbres', tags: ['Legumbres'] },
  { id: 'pasta', tags: ['Pasta'] },
];

export function recipeIsGlutenLight(recipe: Recipe): boolean {
  if (recipe.tags.includes('SinGluten')) return true;
  const blob = `${recipe.name} ${recipe.ingredients.map((i) => i.name).join(' ')}`;
  return !GLUTEN_NAME_RE.test(blob);
}

export function leftoverSlotCount(recipe: Recipe): number {
  if (!recipe.batchCooking) return 0;
  const life = recipe.fridgeLifeDays ?? 2;
  return Math.min(2, Math.max(1, life - 1));
}

export function isKidsFriendlyDinner(recipe: Recipe): boolean {
  if (recipe.prepTimeMinutes <= 25) return true;
  return (
    Boolean(recipe.kidsNotes) ||
    recipe.tags.includes('CenaFácil') ||
    recipe.tags.includes('Niños') ||
    recipe.tags.includes('Rápido (<20min)') ||
    recipe.tags.includes('Ligero')
  );
}

export function isAirFryerRecipe(recipe: Recipe): boolean {
  return (
    Boolean(recipe.isAirFryerFriendly) ||
    recipe.tags.some((t) => /air-?fryer/i.test(t))
  );
}

export function recipeContainsExcludedFood(recipe: Recipe, excludedFoods: ExcludedFoodItem[] = []): ExcludedFoodItem | undefined {
  if (!excludedFoods || excludedFoods.length === 0) return undefined;
  const matchName = matchesExcludedFood(recipe.name, excludedFoods);
  if (matchName) return matchName;

  for (const tag of recipe.tags) {
    const matchTag = matchesExcludedFood(tag, excludedFoods);
    if (matchTag) return matchTag;
  }

  for (const ing of recipe.ingredients) {
    const matchIng = matchesExcludedFood(ing.name, excludedFoods);
    if (matchIng) return matchIng;
  }

  return undefined;
}

export function analyzePlanWarnings(
  plan: WeeklyPlan,
  recipes: Recipe[],
  excludedFoods: ExcludedFoodItem[] = []
): string[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const warnings: string[] = [];
  let leftoverCount = 0;
  let slowDinners = 0;
  let glutenMeals = 0;
  let dinnersWithoutKids = 0;
  let dinnerCount = 0;
  const excludedViolations: string[] = [];

  PLAN_DAYS.forEach((day) => {
    const lunch = plan.days[day]?.lunch;
    const dinner = plan.days[day]?.dinner;
    if (getSlotKind(lunch) === 'leftover') leftoverCount += 1;
    if (getSlotKind(dinner) === 'leftover') leftoverCount += 1;

    const dinnerRecipe = dinner?.recipeId ? recipeMap.get(dinner.recipeId) : undefined;
    if (dinnerRecipe && getSlotKind(dinner) === 'recipe') {
      dinnerCount += 1;
      if (dinnerRecipe.prepTimeMinutes > 25) slowDinners += 1;
      if (!isKidsFriendlyDinner(dinnerRecipe)) dinnersWithoutKids += 1;
    }

    [
      { slot: lunch, mealLabel: 'comida' },
      { slot: dinner, mealLabel: 'cena' },
    ].forEach(({ slot, mealLabel }) => {
      if (getSlotKind(slot) !== 'recipe' || !slot?.recipeId) return;
      const rec = recipeMap.get(slot.recipeId);
      if (rec && !recipeIsGlutenLight(rec)) glutenMeals += 1;
      if (rec && excludedFoods.length > 0) {
        const match = recipeContainsExcludedFood(rec, excludedFoods);
        if (match) {
          excludedViolations.push(`${rec.name} (${day}, ${mealLabel} contiene '${match.name}')`);
        }
      }
    });
  });

  if (excludedViolations.length > 0) {
    warnings.push(`⚠️ Platos con alimentos vetados: ${excludedViolations.join('; ')}.`);
  }

  const hasCookedSlots = PLAN_DAYS.some((day) => {
    const d = plan.days[day];
    return getSlotKind(d?.lunch) === 'recipe' || getSlotKind(d?.dinner) === 'recipe';
  });
  if (hasCookedSlots && leftoverCount === 0) {
    warnings.push('No se han encadenado sobras: cocina una receta batch para resolver 2–3 comidas.');
  }
  if (slowDinners > 0) {
    warnings.push(`${slowDinners} cena${slowDinners > 1 ? 's' : ''} supera(n) 25 min de preparación.`);
  }
  if (glutenMeals > 0) {
    warnings.push(`${glutenMeals} plato${glutenMeals > 1 ? 's' : ''} no es gluten-light.`);
  }
  if (dinnerCount > 0 && dinnersWithoutKids > 0) {
    warnings.push(`${dinnersWithoutKids} cena${dinnersWithoutKids > 1 ? 's' : ''} poco amable(s) para los niños.`);
  }
  return warnings;
}

function proteinGroup(recipe: Recipe): string | null {
  for (const group of PROTEIN_GROUPS) {
    if (group.tags.some((t) => recipe.tags.includes(t))) return group.id;
  }
  return null;
}

export function generateSmartWeeklyPlan(
  weekStartDate: string,
  recipes: Recipe[],
  options: GenerationOptions = {}
): WeeklyPlan {
  return generateSmartWeeklyPlanWithMeta(weekStartDate, recipes, options).plan;
}

export function generateSmartWeeklyPlanWithMeta(
  weekStartDate: string,
  recipes: Recipe[],
  options: GenerationOptions = {}
): GeneratedPlanResult {
  const opts: Required<Omit<GenerationOptions, 'rng'>> & { rng: () => number } = {
    prioritizeFavorites: options.prioritizeFavorites ?? true,
    quickDinners: options.quickDinners ?? true,
    balancedProteins: options.balancedProteins ?? true,
    glutenLight: options.glutenLight ?? true,
    kidsFriendlyDinners: options.kidsFriendlyDinners ?? true,
    prioritizeAirFryerDinners: options.prioritizeAirFryerDinners ?? false,
    mode: options.mode ?? 'full',
    excludedFoods: options.excludedFoods ?? [],
    rng: options.rng ?? Math.random,
  };

  const plan = emptyWeeklyPlan(weekStartDate);
  if (recipes.length === 0) {
    return { plan, warnings: ['No hay recetas en el recetario.'] };
  }

  const excluded = opts.excludedFoods || [];
  const allowedRecipes = excluded.length > 0
    ? recipes.filter((r) => !recipeContainsExcludedFood(r, excluded))
    : recipes;

  const candidatePool = allowedRecipes.length > 0 ? allowedRecipes : recipes;

  const lunchPool = candidatePool.filter((r) => r.mealType === 'lunch' || r.mealType === 'both');
  const dinnerPool = candidatePool.filter((r) => r.mealType === 'dinner' || r.mealType === 'both');
  const validLunch = lunchPool.length > 0 ? lunchPool : candidatePool;
  const validDinner = dinnerPool.length > 0 ? dinnerPool : candidatePool;

  const usedRecipeIds = new Set<string>();
  const lastCookedDay = new Map<string, number>();

  const getSlot = (dayIdx: number, meal: 'lunch' | 'dinner'): MealSlotData | undefined =>
    plan.days[PLAN_DAYS[dayIdx]][meal];

  const setSlot = (dayIdx: number, meal: 'lunch' | 'dinner', slot: MealSlotData) => {
    plan.days[PLAN_DAYS[dayIdx]] = {
      ...plan.days[PLAN_DAYS[dayIdx]],
      [meal]: slot,
    };
  };

  const slotEmpty = (dayIdx: number, meal: 'lunch' | 'dinner') =>
    dayIdx >= 0 && dayIdx < 7 && !getSlot(dayIdx, meal)?.recipeId && !getSlot(dayIdx, meal)?.customName && getSlotKind(getSlot(dayIdx, meal)) === 'empty';

  const canReuse = (recipe: Recipe, dayIdx: number): boolean => {
    const last = lastCookedDay.get(recipe.id);
    if (last === undefined) return true;
    return dayIdx > last + leftoverSlotCount(recipe);
  };

  function pickBestRecipe(
    pool: Recipe[],
    ctx: {
      isDinner: boolean;
      dayIndex: number;
      previousMealRecipe?: Recipe;
      requireTupper?: boolean;
    }
  ): Recipe | null {
    let available = pool.filter((r) => canReuse(r, ctx.dayIndex));
    if (available.length === 0) available = [...pool];

    const apply = (pred: (r: Recipe) => boolean) => {
      const next = available.filter(pred);
      if (next.length > 0) available = next;
    };

    if (opts.glutenLight) apply(recipeIsGlutenLight);
    if (ctx.requireTupper) apply((r) => Boolean(r.isTupperFriendly));
    if (ctx.isDinner && opts.quickDinners) {
      apply((r) => r.prepTimeMinutes <= 25 || r.tags.includes('Ligero'));
    }
    if (ctx.isDinner && opts.kidsFriendlyDinners) apply(isKidsFriendlyDinner);
    if (ctx.previousMealRecipe && opts.balancedProteins) {
      const prevGroup = proteinGroup(ctx.previousMealRecipe);
      if (prevGroup) apply((r) => proteinGroup(r) !== prevGroup);
    }

    const unused = available.filter((r) => !usedRecipeIds.has(r.id));
    if (unused.length > 0) available = unused;

    const weighted: Recipe[] = [];
    available.forEach((r) => {
      let weight = 1;
      if (r.favorite && opts.prioritizeFavorites) weight += 3;
      if (r.tags.includes('Rápido (<20min)')) weight += 2;
      if (r.tags.includes('AltoEnProteina')) weight += 2;
      if (!ctx.isDinner && r.isTupperFriendly) weight += 3;
      if (r.batchCooking) weight += 3;
      if (ctx.isDinner && r.kidsNotes) weight += 2;
      if (ctx.isDinner && opts.prioritizeAirFryerDinners && isAirFryerRecipe(r)) weight += 4;
      if (r.rating >= 4) weight += r.rating - 3;
      for (let i = 0; i < weight; i++) weighted.push(r);
    });

    if (weighted.length === 0) return available[0] || pool[0] || null;
    return weighted[Math.floor(opts.rng() * weighted.length)] || available[0];
  }

  function placeLeftovers(cookDay: number, cookMeal: 'lunch' | 'dinner', recipe: Recipe) {
    const extra = leftoverSlotCount(recipe);
    for (let offset = 1; offset <= extra; offset++) {
      const targetDay = cookDay + offset;
      if (targetDay > 6) break;

      let placed = false;
      if (opts.mode === 'dinners') {
        if (slotEmpty(targetDay, 'dinner')) {
          setSlot(targetDay, 'dinner', leftoverSlot(recipe, cookDay, cookMeal));
          placed = true;
        }
      } else if (opts.mode === 'tuppers') {
        if (targetDay <= 4 && slotEmpty(targetDay, 'lunch')) {
          setSlot(targetDay, 'lunch', leftoverSlot(recipe, cookDay, cookMeal));
          placed = true;
        }
      } else if (cookMeal === 'lunch') {
        if (targetDay <= 4 && slotEmpty(targetDay, 'lunch')) {
          setSlot(targetDay, 'lunch', leftoverSlot(recipe, cookDay, cookMeal));
          placed = true;
        }
      } else if (targetDay <= 4 && slotEmpty(targetDay, 'lunch')) {
        setSlot(targetDay, 'lunch', leftoverSlot(recipe, cookDay, cookMeal));
        placed = true;
      } else if (slotEmpty(targetDay, 'dinner')) {
        setSlot(targetDay, 'dinner', leftoverSlot(recipe, cookDay, cookMeal));
        placed = true;
      }
      if (!placed) break;
    }
  }

  function leftoverSlot(recipe: Recipe, cookDay: number, cookMeal: 'lunch' | 'dinner'): MealSlotData {
    return {
      kind: 'leftover',
      recipeId: recipe.id,
      leftoverFromDay: PLAN_DAYS[cookDay],
      leftoverFromMeal: cookMeal,
    };
  }

  function assignFresh(
    dayIdx: number,
    meal: 'lunch' | 'dinner',
    pool: Recipe[],
    extra?: { previous?: Recipe; requireTupper?: boolean }
  ) {
    if (!slotEmpty(dayIdx, meal)) return;
    const recipe = pickBestRecipe(pool, {
      isDinner: meal === 'dinner',
      dayIndex: dayIdx,
      previousMealRecipe: extra?.previous,
      requireTupper: extra?.requireTupper,
    });
    if (!recipe) return;
    setSlot(dayIdx, meal, { kind: 'recipe', recipeId: recipe.id });
    usedRecipeIds.add(recipe.id);
    lastCookedDay.set(recipe.id, dayIdx);
    placeLeftovers(dayIdx, meal, recipe);
  }

  const fillLunches = opts.mode === 'full' || opts.mode === 'tuppers';
  const fillDinners = opts.mode === 'full' || opts.mode === 'dinners';

  if (fillLunches) {
    for (let d = 0; d <= 4; d++) {
      assignFresh(d, 'lunch', validLunch, { requireTupper: true });
    }
  }

  if (fillDinners) {
    for (let d = 0; d <= 6; d++) {
      const lunchRecipeId = plan.days[PLAN_DAYS[d]].lunch?.recipeId;
      const lunchRecipe = lunchRecipeId ? recipes.find((r) => r.id === lunchRecipeId) : undefined;
      assignFresh(d, 'dinner', validDinner, { previous: lunchRecipe });
    }
  }

  if (opts.mode === 'full') {
    for (let d = 5; d <= 6; d++) {
      assignFresh(d, 'lunch', validLunch);
    }
  }

  const generatedWarnings = analyzePlanWarnings(plan, recipes, opts.excludedFoods);
  if (allowedRecipes.length === 0 && recipes.length > 0 && excluded.length > 0) {
    generatedWarnings.unshift('⚠️ No hay suficientes recetas sin los alimentos vetados seleccionados.');
  }

  return { plan, warnings: generatedWarnings };
}
