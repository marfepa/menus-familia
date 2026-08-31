import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Recipe, DynamicPantryItem } from '@/types';
import {
  generateSmartWeeklyPlanWithMeta,
  leftoverSlotCount,
  recipeIsGlutenLight,
  isKidsFriendlyDinner,
  isFishRecipe,
  isMeatRecipe,
  isPastaRecipe,
  calculateRecipePantryScore,
} from '@/lib/menuGenerator';
import { INITIAL_RECIPES } from '@/data/initialRecipes';
import { getSlotKind, PLAN_DAYS } from '@/lib/planUtils';
import { generateShoppingListFromPlan } from '@/lib/shoppingListGenerator';

function recipe(partial: Partial<Recipe> & Pick<Recipe, 'id' | 'name'>): Recipe {
  return {
    description: '',
    prepTimeMinutes: 20,
    servings: 4,
    mealType: 'both',
    tags: ['SinGluten', 'AltoEnProteina'],
    ingredients: [
      { id: `${partial.id}-i1`, name: 'Pechuga de pollo en dados', quantity: 400, unit: 'g', category: 'carniceria' },
    ],
    instructions: ['Cocinar'],
    rating: 4,
    ...partial,
  };
}

const rng = () => 0.1;

const batchLunch = recipe({
  id: 'batch-lentejas',
  name: 'Lentejas batch',
  mealType: 'lunch',
  batchCooking: true,
  fridgeLifeDays: 3,
  isTupperFriendly: true,
  tags: ['SinGluten', 'Legumbres', 'AptoTupper', 'BatchCooking'],
  ingredients: [
    { id: 'bl-1', name: 'Lentejas pardinas cocidas', quantity: 800, unit: 'g', category: 'despensa' },
  ],
});

const batchDinner = recipe({
  id: 'batch-pollo',
  name: 'Pollo batch',
  mealType: 'dinner',
  batchCooking: true,
  fridgeLifeDays: 2,
  prepTimeMinutes: 15,
  kidsNotes: 'Tiras blandas',
  tags: ['SinGluten', 'Pollo', 'CenaFácil', 'Rápido (<20min)'],
  ingredients: [
    { id: 'bd-1', name: 'Pechuga de pollo en dados', quantity: 500, unit: 'g', category: 'carniceria' },
  ],
});

const quickFish = recipe({
  id: 'cena-pescado',
  name: 'Merluza rápida',
  mealType: 'dinner',
  prepTimeMinutes: 18,
  fridgeLifeDays: 2,
  kidsNotes: 'Sin espinas',
  tags: ['SinGluten', 'Pescado', 'CenaFácil', 'Rápido (<20min)'],
  ingredients: [
    { id: 'cf-1', name: 'Merluza', quantity: 400, unit: 'g', category: 'pescaderia' },
  ],
});

const glutenPasta = recipe({
  id: 'pasta-trigo',
  name: 'Espaguetis de trigo',
  mealType: 'dinner',
  prepTimeMinutes: 40,
  tags: ['Pasta', 'Carne'],
  ingredients: [
    { id: 'pt-1', name: 'Espaguetis de trigo', quantity: 400, unit: 'g', category: 'despensa' },
  ],
});

const slowDinner = recipe({
  id: 'lenta',
  name: 'Estofado largo',
  mealType: 'dinner',
  prepTimeMinutes: 90,
  tags: ['SinGluten', 'Carne'],
});

describe('menuGenerator', () => {
  it('calcula huecos de sobra según fridgeLifeDays', () => {
    assert.equal(leftoverSlotCount(batchLunch), 2);
    assert.equal(leftoverSlotCount(batchDinner), 1);
    assert.equal(leftoverSlotCount(quickFish), 0);
  });

  it('detecta gluten-light y cenas amables', () => {
    assert.equal(recipeIsGlutenLight(batchLunch), true);
    assert.equal(recipeIsGlutenLight(glutenPasta), false);
    assert.equal(isKidsFriendlyDinner(quickFish), true);
    assert.equal(isKidsFriendlyDinner(slowDinner), false);
  });

  it('encadena recetas batch en huecos consecutivos de sobra', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta('2026-08-31', [batchLunch, batchDinner, quickFish], {
      mode: 'full',
      rng,
    });

    const leftovers: string[] = [];
    (['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).forEach((day) => {
      if (getSlotKind(plan.days[day].lunch) === 'leftover') leftovers.push(`${day}-lunch`);
      if (getSlotKind(plan.days[day].dinner) === 'leftover') leftovers.push(`${day}-dinner`);
    });
    assert.ok(leftovers.length >= 1);

    const mondayLunch = plan.days.lunes.lunch;
    assert.equal(mondayLunch?.recipeId, 'batch-lentejas');
    assert.equal(getSlotKind(mondayLunch), 'recipe');
    assert.equal(getSlotKind(plan.days.martes.lunch), 'leftover');
    assert.equal(plan.days.martes.lunch?.recipeId, 'batch-lentejas');
  });

  it('no recuenta ingredientes de las sobras en la lista de compra', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta('2026-08-31', [batchLunch, batchDinner, quickFish], {
      mode: 'full',
      rng,
    });
    const list = generateShoppingListFromPlan(plan, [batchLunch, batchDinner, quickFish], {
      householdServings: 4,
    });
    const lentejas = list.find((i) => /lenteja/i.test(i.name));
    assert.ok(lentejas);
    assert.equal(lentejas?.recipeSource?.filter((n) => n === 'Lentejas batch').length, 1);
  });

  it('en modo cenas la sobra batch cae en la siguiente cena, no en la comida', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [batchDinner, quickFish, batchLunch],
      { mode: 'dinners', rng }
    );
    const mondayId = plan.days.lunes.dinner?.recipeId;
    assert.ok(mondayId);
    assert.equal(plan.days.lunes.lunch?.recipeId, undefined);
    if (mondayId === 'batch-pollo') {
      assert.equal(getSlotKind(plan.days.martes.dinner), 'leftover');
      assert.equal(plan.days.martes.dinner?.recipeId, 'batch-pollo');
      assert.equal(plan.days.martes.lunch?.recipeId, undefined);
    }
  });

  it('prioriza cenas rápidas frente a platos lentos', () => {
    const quickMeat = recipe({
      id: 'carne-rapida',
      name: 'Pollo rápido',
      mealType: 'dinner',
      prepTimeMinutes: 15,
      tags: ['SinGluten', 'Carne'],
    });
    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [quickMeat, quickFish, slowDinner],
      { mode: 'dinners', rng }
    );
    const dinnerIds = Object.values(plan.days)
      .map((d) => d.dinner?.recipeId)
      .filter(Boolean);
    assert.equal(dinnerIds.every((id) => id !== 'lenta'), true);
  });

  it('en modo solo cenas no rellena comidas con sobras', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta('2026-08-31', [batchLunch, batchDinner, quickFish], {
      mode: 'dinners',
      rng,
    });
    PLAN_DAYS.forEach((day) => {
      assert.equal(plan.days[day].lunch?.recipeId, undefined);
    });
    assert.ok(plan.days.lunes.dinner?.recipeId);
  });

  it('en modo tuppers solo rellena comidas de lunes a viernes', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta('2026-08-31', [batchLunch, batchDinner], {
      mode: 'tuppers',
      rng,
    });
    assert.ok(plan.days.lunes.lunch?.recipeId);
    assert.equal(plan.days.sabado.lunch?.recipeId, undefined);
    assert.equal(plan.days.lunes.dinner?.recipeId, undefined);
  });

  it('excluye del menú cualquier receta con ingredientes o nombres vetados', () => {
    const salmonDish = recipe({
      id: 'plato-salmon',
      name: 'Salmón a la plancha con cilantro',
      mealType: 'dinner',
      tags: ['Pescado'],
      ingredients: [
        { id: 'ing-cilantro', name: 'Cilantro picado', quantity: 10, unit: 'g', category: 'fruteria' },
      ],
    });

    const excludedFoods = [
      { id: 'ex-1', name: 'Cilantro', matchKeywords: ['cilantro'], addedDate: '2026-08-31' },
    ];

    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [salmonDish, quickFish],
      { mode: 'dinners', excludedFoods, rng }
    );

    const dinnerIds = Object.values(plan.days)
      .map((d) => d.dinner?.recipeId)
      .filter(Boolean);

    assert.equal(dinnerIds.includes('plato-salmon'), false);
    assert.ok(dinnerIds.includes('cena-pescado'));
  });

  it('detecta recetas de Air-Fryer y las prioriza en cenas cuando la opción está activa', () => {
    const airfryerChicken = recipe({
      id: 'af-chicken',
      name: 'Pollo crujiente AirFryer',
      mealType: 'dinner',
      isAirFryerFriendly: true,
      airFryerConfig: { temperatureDegrees: 190, timeMinutes: 14, shakeHalfway: true },
      prepTimeMinutes: 15,
      tags: ['SinGluten', 'Pollo', 'AirFryer'],
    });

    const skilletFish = recipe({
      id: 'skillet-fish',
      name: 'Pescado a la sartén',
      mealType: 'dinner',
      prepTimeMinutes: 20,
      tags: ['SinGluten', 'Pescado'],
    });

    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [airfryerChicken, skilletFish],
      { mode: 'dinners', prioritizeAirFryerDinners: true, rng: () => 0.0 }
    );

    const mondayDinner = plan.days.lunes.dinner?.recipeId;
    assert.equal(mondayDinner, 'af-chicken');
  });

  it('limita el número de raciones de pescado a máximo 2 por semana cuando hay suficientes recetas de carne', () => {
    const meat1 = recipe({ id: 'm1', name: 'Pollo 1', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });
    const meat2 = recipe({ id: 'm2', name: 'Ternera 2', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });
    const meat3 = recipe({ id: 'm3', name: 'Pavo 3', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });
    const meat4 = recipe({ id: 'm4', name: 'Hamburguesa 4', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });
    const fish1 = recipe({ id: 'f1', name: 'Merluza al horno', mealType: 'both', tags: ['SinGluten', 'Pescado', 'AptoTupper'] });
    const fish2 = recipe({ id: 'f2', name: 'Salmón a la plancha', mealType: 'both', tags: ['SinGluten', 'Pescado', 'AptoTupper'] });
    const fish3 = recipe({ id: 'f3', name: 'Dorada con patatas', mealType: 'both', tags: ['SinGluten', 'Pescado', 'AptoTupper'] });
    const fish4 = recipe({ id: 'f4', name: 'Atún fresco', mealType: 'both', tags: ['SinGluten', 'Pescado', 'AptoTupper'] });

    const pool = [meat1, meat2, meat3, meat4, fish1, fish2, fish3, fish4];
    const { plan } = generateSmartWeeklyPlanWithMeta('2026-08-31', pool, {
      mode: 'full',
      prioritizeMeatOverFish: true,
      maxFishMealsPerWeek: 2,
      rng,
    });

    const cookedFishIds = new Set<string>();
    PLAN_DAYS.forEach((day) => {
      ['lunch', 'dinner'].forEach((meal) => {
        const slot = plan.days[day][meal as 'lunch' | 'dinner'];
        if (getSlotKind(slot) === 'recipe' && slot?.recipeId) {
          const rec = pool.find((r) => r.id === slot.recipeId);
          if (rec && isFishRecipe(rec)) {
            cookedFishIds.add(rec.id);
          }
        }
      });
    });

    assert.ok(cookedFishIds.size <= 2, `Se esperaban <= 2 platos de pescado, pero se cocinaron ${cookedFishIds.size}`);
  });

  it('incluye las nuevas recetas de fajitas y tacos de ternera en INITIAL_RECIPES', () => {
    const fajitas = INITIAL_RECIPES.find((r) => r.id === 'rec-28');
    const tacos = INITIAL_RECIPES.find((r) => r.id === 'rec-29');

    assert.ok(fajitas, 'Fajitas de ternera rec-28 debe existir');
    assert.ok(tacos, 'Tacos de ternera rec-29 debe existir');

    assert.equal(isMeatRecipe(fajitas!), true);
    assert.equal(isMeatRecipe(tacos!), true);
    assert.equal(recipeIsGlutenLight(fajitas!), true);
    assert.equal(recipeIsGlutenLight(tacos!), true);
    assert.equal(isKidsFriendlyDinner(fajitas!), true);
    assert.equal(isKidsFriendlyDinner(tacos!), true);
  });

  it('calcula puntuación de despensa y bonifica productos disponibles o próximos a caducar', () => {
    const chickenDish = recipe({
      id: 'd-chicken',
      name: 'Pollo salteado',
      ingredients: [
        { id: 'i-pol', name: 'Pechuga de pollo en dados', quantity: 500, unit: 'g', category: 'carniceria' },
        { id: 'i-cal', name: 'Calabacín verde', quantity: 1, unit: 'uds', category: 'fruteria' },
      ],
    });

    const pantry: DynamicPantryItem[] = [
      {
        id: 'p-1',
        name: 'Pechuga de pollo',
        category: 'carniceria',
        inStock: true,
        addedDate: '2026-08-30',
        shelfLifeDays: 3, // Próximo a caducar
        matchKeywords: ['pechuga de pollo', 'pollo en dados'],
      },
      {
        id: 'p-2',
        name: 'Calabacín',
        category: 'fruteria',
        inStock: true,
        shelfLifeDays: 10,
        matchKeywords: ['calabacin'],
      },
    ];

    const score = calculateRecipePantryScore(chickenDish, pantry, '2026-08-31');
    assert.equal(score.matchedIngredientsCount, 2);
    assert.ok(score.totalBonus > 4); // Matched base bonus + expiring bonus

    const beefDish = recipe({
      id: 'd-beef',
      name: 'Ternera asada',
      ingredients: [
        { id: 'i-ter', name: 'Filetes de ternera', quantity: 500, unit: 'g', category: 'carniceria' },
      ],
    });

    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [chickenDish, beefDish],
      { mode: 'dinners', pantry, rng: () => 0.0 }
    );
    assert.equal(plan.days.lunes.dinner?.recipeId, 'd-chicken');
  });

  it('permite pasta y limita a máximo 3 raciones de pasta por semana', () => {
    const pasta1 = recipe({ id: 'p1', name: 'Macarrones boloñesa', mealType: 'both', tags: ['Pasta', 'Carne', 'AptoTupper'] });
    const pasta2 = recipe({ id: 'p2', name: 'Espirales con pollo', mealType: 'both', tags: ['Pasta', 'Pollo', 'AptoTupper'] });
    const pasta3 = recipe({ id: 'p3', name: 'Ensalada de pasta', mealType: 'both', tags: ['Pasta', 'Pescado', 'AptoTupper'] });
    const pasta4 = recipe({ id: 'p4', name: 'Tallarines con gambas', mealType: 'both', tags: ['Pasta', 'Pescado', 'AptoTupper'] });
    const rice1 = recipe({ id: 'r1', name: 'Arroz con pollo', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });
    const potato1 = recipe({ id: 'pot1', name: 'Patatas con ternera', mealType: 'both', tags: ['SinGluten', 'Carne', 'AptoTupper'] });

    const pool = [pasta1, pasta2, pasta3, pasta4, rice1, potato1];
    const { plan, warnings } = generateSmartWeeklyPlanWithMeta('2026-08-31', pool, {
      mode: 'full',
      maxPastaMealsPerWeek: 3,
      rng,
    });

    const cookedPastaIds = new Set<string>();
    PLAN_DAYS.forEach((day) => {
      ['lunch', 'dinner'].forEach((meal) => {
        const slot = plan.days[day][meal as 'lunch' | 'dinner'];
        if (getSlotKind(slot) === 'recipe' && slot?.recipeId) {
          const rec = pool.find((r) => r.id === slot.recipeId);
          if (rec && isPastaRecipe(rec)) {
            cookedPastaIds.add(rec.id);
          }
        }
      });
    });

    assert.ok(cookedPastaIds.size <= 3, `Se esperaban <= 3 platos de pasta cocinados, pero se encontraron ${cookedPastaIds.size}`);
    assert.equal(warnings.some((w) => w.includes('superan la recomendación de máx. 3')), false);
  });

  it('incluye las nuevas recetas de pasta familiar en INITIAL_RECIPES (rec-30 a rec-33)', () => {
    const rec30 = INITIAL_RECIPES.find((r) => r.id === 'rec-30');
    const rec31 = INITIAL_RECIPES.find((r) => r.id === 'rec-31');
    const rec32 = INITIAL_RECIPES.find((r) => r.id === 'rec-32');
    const rec33 = INITIAL_RECIPES.find((r) => r.id === 'rec-33');

    assert.ok(rec30, 'rec-30 Macarrones con boloñesa debe existir');
    assert.ok(rec31, 'rec-31 Espirales con pollo debe existir');
    assert.ok(rec32, 'rec-32 Ensalada de pasta debe existir');
    assert.ok(rec33, 'rec-33 Tallarines con gambas debe existir');

    assert.equal(isPastaRecipe(rec30!), true);
    assert.equal(isPastaRecipe(rec31!), true);
    assert.equal(isPastaRecipe(rec32!), true);
    assert.equal(isPastaRecipe(rec33!), true);

    assert.equal(isMeatRecipe(rec30!), true);
    assert.equal(isMeatRecipe(rec31!), true);
    assert.equal(isFishRecipe(rec32!), true);
    assert.equal(isFishRecipe(rec33!), true);
  });
});


