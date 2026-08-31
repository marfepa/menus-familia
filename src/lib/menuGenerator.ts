import type { Recipe, WeeklyPlan, GenerateMode, MealSlotData, ExcludedFoodItem, DynamicPantryItem } from '@/types';
import { PLAN_DAYS, emptyWeeklyPlan, getSlotKind } from '@/lib/planUtils';
import { matchesExcludedFood, calculateShelfLifeInfo } from '@/lib/pantryUtils';
import { normalizeText } from '@/lib/shoppingListGenerator';

export interface GenerationOptions {
  prioritizeFavorites?: boolean;
  quickDinners?: boolean;
  balancedProteins?: boolean;
  glutenLight?: boolean;
  kidsFriendlyDinners?: boolean;
  prioritizeAirFryerDinners?: boolean;
  prioritizeMeatOverFish?: boolean;
  maxFishMealsPerWeek?: number;
  maxPastaMealsPerWeek?: number;
  mode?: GenerateMode;
  excludedFoods?: ExcludedFoodItem[];
  pantry?: DynamicPantryItem[];
  rng?: () => number;
}

export interface GeneratedPlanResult {
  plan: WeeklyPlan;
  warnings: string[];
}

const GLUTEN_NAME_RE =
  /pasta\b|trigo|cuscus|couscous|espagueti|macarron|sémola|semola|pan rallado|harina de trigo|lasana|lasaña|fideos de trigo/i;

const PASTA_RE =
  /pasta\b|macarron|espagueti|espiral|tallarin|pluma|fusilli|penne|lazos|fideos/i;

const PROTEIN_GROUPS: Array<{ id: string; tags: string[] }> = [
  { id: 'pescado', tags: ['Pescado'] },
  { id: 'carne', tags: ['Carne', 'Pollo'] },
  { id: 'legumbres', tags: ['Legumbres'] },
  { id: 'pasta', tags: ['Pasta'] },
];

export function isFishRecipe(recipe: Recipe): boolean {
  return (
    recipe.tags.includes('Pescado') ||
    recipe.ingredients.some((i) => i.category === 'pescaderia') ||
    /pescado|merluza|salm[oó]n|dorada|lubina|at[uú]n|bonito|bacalao|gambas|langostinos/i.test(recipe.name)
  );
}

export function isMeatRecipe(recipe: Recipe): boolean {
  return (
    recipe.tags.includes('Carne') ||
    recipe.tags.includes('Pollo') ||
    recipe.ingredients.some((i) => i.category === 'carniceria') ||
    /carne|ternera|pollo|pavo|cerdo|lomo|hamburguesa|alb[oó]ndiga|jam[oó]n/i.test(recipe.name)
  );
}

export function isPastaRecipe(recipe: Recipe): boolean {
  return (
    recipe.tags.includes('Pasta') ||
    PASTA_RE.test(recipe.name) ||
    recipe.ingredients.some((i) => PASTA_RE.test(i.name))
  );
}

const PREFERRED_FISH_RE = /merluza|dorada|salm[oó]n|lubina|bonito|at[uú]n/i;

export function isPreferredFish(recipe: Recipe): boolean {
  if (!isFishRecipe(recipe)) return false;
  return (
    PREFERRED_FISH_RE.test(recipe.name) ||
    recipe.ingredients.some((i) => PREFERRED_FISH_RE.test(i.name))
  );
}

export function recipeIsGlutenLight(recipe: Recipe): boolean {
  if (recipe.tags.includes('SinGluten')) return true;
  const blob = `${recipe.name} ${recipe.ingredients.map((i) => i.name).join(' ')}`;
  return !GLUTEN_NAME_RE.test(blob);
}

export interface RecipePantryScore {
  matchedIngredientsCount: number;
  expiringBonus: number;
  totalBonus: number;
}

export function calculateRecipePantryScore(
  recipe: Recipe,
  pantry: DynamicPantryItem[] = [],
  referenceDateStr?: string
): RecipePantryScore {
  if (!pantry || pantry.length === 0 || !recipe.ingredients || recipe.ingredients.length === 0) {
    return { matchedIngredientsCount: 0, expiringBonus: 0, totalBonus: 0 };
  }

  let matchedIngredientsCount = 0;
  let expiringBonus = 0;

  for (const ing of recipe.ingredients) {
    const ingNorm = normalizeText(ing.name);
    const matchingPantryItem = pantry.find((pItem) => {
      if (!pItem.inStock) return false;
      const keywords = pItem.matchKeywords && pItem.matchKeywords.length > 0 ? pItem.matchKeywords : [pItem.name];
      return keywords.some((kw) => {
        const kwNorm = normalizeText(kw);
        if (kwNorm.length <= 3) {
          return new RegExp(`(^|[^a-z0-9])${kwNorm}([^a-z0-9]|$)`).test(ingNorm);
        }
        return ingNorm.includes(kwNorm);
      });
    });

    if (matchingPantryItem) {
      matchedIngredientsCount += 1;
      const shelfInfo = calculateShelfLifeInfo(matchingPantryItem, referenceDateStr);
      if (shelfInfo.status === 'critical') {
        expiringBonus += 6; // Muy urgente de consumir
      } else if (shelfInfo.status === 'medium') {
        expiringBonus += 3; // Próximo a caducar
      }
    }
  }

  const totalBonus = matchedIngredientsCount * 2 + expiringBonus;
  return { matchedIngredientsCount, expiringBonus, totalBonus };
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
  let pastaMeals = 0;
  let nonPastaGlutenMeals = 0;
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
      if (!rec) return;
      if (isPastaRecipe(rec)) {
        pastaMeals += 1;
      } else if (!recipeIsGlutenLight(rec)) {
        nonPastaGlutenMeals += 1;
      }
      if (excludedFoods.length > 0) {
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
  if (pastaMeals > 3) {
    warnings.push(`${pastaMeals} platos de pasta superan la recomendación de máx. 3 raciones semanales.`);
  }
  if (nonPastaGlutenMeals > 0) {
    warnings.push(`${nonPastaGlutenMeals} plato${nonPastaGlutenMeals > 1 ? 's' : ''} no es gluten-light.`);
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
  const opts: Required<Omit<GenerationOptions, 'rng' | 'pantry'>> & {
    pantry?: DynamicPantryItem[];
    rng: () => number;
  } = {
    prioritizeFavorites: options.prioritizeFavorites ?? true,
    quickDinners: options.quickDinners ?? true,
    balancedProteins: options.balancedProteins ?? true,
    glutenLight: options.glutenLight ?? true,
    kidsFriendlyDinners: options.kidsFriendlyDinners ?? true,
    prioritizeAirFryerDinners: options.prioritizeAirFryerDinners ?? false,
    prioritizeMeatOverFish: options.prioritizeMeatOverFish ?? true,
    maxFishMealsPerWeek: options.maxFishMealsPerWeek ?? 2,
    maxPastaMealsPerWeek: options.maxPastaMealsPerWeek ?? 3,
    mode: options.mode ?? 'full',
    excludedFoods: options.excludedFoods ?? [],
    pantry: options.pantry ?? [],
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
  let fishCookedCount = 0;
  let pastaCookedCount = 0;

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

    if (opts.glutenLight) {
      apply((r) => recipeIsGlutenLight(r) || (isPastaRecipe(r) && pastaCookedCount < opts.maxPastaMealsPerWeek));
    }
    if (pastaCookedCount >= opts.maxPastaMealsPerWeek) {
      const nonPasta = available.filter((r) => !isPastaRecipe(r));
      if (nonPasta.length > 0) {
        available = nonPasta;
      } else {
        const poolNonPasta = pool.filter((r) => !isPastaRecipe(r));
        if (poolNonPasta.length > 0) {
          available = poolNonPasta;
        }
      }
    }
    if (ctx.requireTupper) apply((r) => Boolean(r.isTupperFriendly));
    if (ctx.isDinner && opts.quickDinners) {
      apply((r) => r.prepTimeMinutes <= 25 || r.tags.includes('Ligero'));
    }
    if (ctx.isDinner && opts.kidsFriendlyDinners) apply(isKidsFriendlyDinner);
    if (ctx.previousMealRecipe && opts.balancedProteins) {
      const prevGroup = proteinGroup(ctx.previousMealRecipe);
      if (prevGroup) {
        const nonPrev = available.filter((r) => proteinGroup(r) !== prevGroup);
        if (opts.prioritizeMeatOverFish && fishCookedCount >= opts.maxFishMealsPerWeek) {
          const nonPrevNonFish = nonPrev.filter((r) => !isFishRecipe(r));
          if (nonPrevNonFish.length > 0) {
            available = nonPrevNonFish;
          }
        } else if (nonPrev.length > 0) {
          available = nonPrev;
        }
      }
    }

    if (opts.prioritizeMeatOverFish && fishCookedCount >= opts.maxFishMealsPerWeek) {
      const nonFish = available.filter((r) => !isFishRecipe(r));
      if (nonFish.length > 0) {
        available = nonFish;
      } else {
        const poolNonFish = pool.filter((r) => !isFishRecipe(r));
        if (poolNonFish.length > 0) {
          available = poolNonFish;
        }
      }
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
      if (opts.prioritizeMeatOverFish) {
        if (isMeatRecipe(r)) weight += 5;
        if (isFishRecipe(r) && isPreferredFish(r)) weight += 1;
      }
      if (isPastaRecipe(r) && ctx.dayIndex <= 4 && pastaCookedCount < opts.maxPastaMealsPerWeek) {
        weight += 3; // Impulso para pasta entre semana (L-V)
      }
      if (opts.pantry && opts.pantry.length > 0) {
        const pantryScore = calculateRecipePantryScore(r, opts.pantry, weekStartDate);
        weight += pantryScore.totalBonus;
      }
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
    if (isFishRecipe(recipe)) {
      fishCookedCount += 1;
    }
    if (isPastaRecipe(recipe)) {
      pastaCookedCount += 1;
    }
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
