import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Recipe } from '@/types';
import {
  generateSmartWeeklyPlanWithMeta,
  leftoverSlotCount,
  recipeIsGlutenLight,
  isKidsFriendlyDinner,
} from '@/lib/menuGenerator';
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

  it('prioriza cenas rápidas y evita pasta de trigo si hay alternativa', () => {
    const { plan } = generateSmartWeeklyPlanWithMeta(
      '2026-08-31',
      [glutenPasta, quickFish, slowDinner],
      { mode: 'dinners', rng }
    );
    const dinnerIds = Object.values(plan.days)
      .map((d) => d.dinner?.recipeId)
      .filter(Boolean);
    assert.equal(dinnerIds.every((id) => id !== 'pasta-trigo'), true);
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
});
