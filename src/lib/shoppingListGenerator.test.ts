import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PantryItem, Recipe, WeeklyPlan } from '@/types';
import { emptyWeeklyPlan } from '@/lib/planUtils';
import {
  canonicalAmount,
  findRuleForIngredient,
  generateShoppingListFromPlan,
  isCoveredByPantry,
} from '@/lib/shoppingListGenerator';

const pollo: Recipe = {
  id: 'r1',
  name: 'Arroz con pollo',
  description: '',
  prepTimeMinutes: 15,
  servings: 4,
  mealType: 'lunch',
  tags: ['SinGluten'],
  rating: 4,
  ingredients: [
    { id: 'a', name: 'Pechuga de pollo en dados', quantity: 500, unit: 'g', category: 'carniceria' },
    { id: 'b', name: 'Aceite de oliva virgen extra', quantity: 2, unit: 'cucharadas', category: 'despensa' },
    { id: 'c', name: 'Diente de ajo', quantity: 2, unit: 'uds', category: 'fruteria' },
    { id: 'd', name: 'Perejil fresco', quantity: 1, unit: 'manojo', category: 'fruteria' },
    { id: 'e', name: 'Arroz cocido (vasitos)', quantity: 2, unit: 'vasitos', category: 'despensa' },
  ],
  instructions: [],
};

const taquitos: Recipe = {
  id: 'r2',
  name: 'Tortilla de taquitos',
  description: '',
  prepTimeMinutes: 10,
  servings: 4,
  mealType: 'dinner',
  tags: ['SinGluten'],
  rating: 4,
  ingredients: [
    { id: 'f', name: 'Taquitos de jamón', quantity: 75, unit: 'g', category: 'carniceria' },
    { id: 'g', name: 'Huevos camperos', quantity: 4, unit: 'uds', category: 'lacteos' },
  ],
  instructions: [],
};

function planWith(recipes: Array<{ day: 'lunes' | 'martes'; meal: 'lunch' | 'dinner'; id: string; leftover?: boolean }>): WeeklyPlan {
  const plan = emptyWeeklyPlan('2026-08-31');
  recipes.forEach(({ day, meal, id, leftover }) => {
    plan.days[day][meal] = leftover
      ? { kind: 'leftover', recipeId: id, leftoverFromDay: 'lunes', leftoverFromMeal: 'lunch' }
      : { kind: 'recipe', recipeId: id };
  });
  return plan;
}

describe('shoppingListGenerator', () => {
  it('no fusiona ajo y perejil', () => {
    assert.equal(findRuleForIngredient('Diente de ajo')?.id, 'ajos');
    assert.equal(findRuleForIngredient('Perejil fresco')?.id, 'perejil');
    const list = generateShoppingListFromPlan(planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]), [pollo]);
    const names = list.map((i) => i.name.toLowerCase());
    assert.equal(names.some((n) => n.includes('ajo')), true);
    assert.equal(names.some((n) => n.includes('perejil')), true);
    assert.equal(names.some((n) => n.includes('ajo') && n.includes('perejil')), false);
  });

  it('no fusiona pechuga de pollo con taquitos', () => {
    assert.equal(findRuleForIngredient('Pechuga de pollo en dados')?.id, 'pollo_pechuga');
    assert.equal(findRuleForIngredient('Taquitos de jamón')?.id, 'taquitos_jamon_pavo');
    const list = generateShoppingListFromPlan(
      planWith([
        { day: 'lunes', meal: 'lunch', id: 'r1' },
        { day: 'lunes', meal: 'dinner', id: 'r2' },
      ]),
      [pollo, taquitos]
    );
    assert.ok(list.find((i) => i.id === 'item-pollo-pechuga'));
    assert.ok(list.find((i) => i.id === 'item-taquitos-jamon-pavo'));
  });

  it('prefiere caldo de pollo frente a la regla de pechuga', () => {
    assert.equal(findRuleForIngredient('Caldo de pollo suave (del brick)')?.id, 'caldo_brik');
  });

  it('convierte vasitos a gramos y no suma 2+300 a ciegas', () => {
    assert.deepEqual(canonicalAmount(2, 'vasitos'), { qty: 250, unit: 'g' });
    assert.deepEqual(canonicalAmount(0.5, 'kg'), { qty: 500, unit: 'g' });
  });

  it('omite aceite si está en despensa', () => {
    const pantry: PantryItem[] = [
      { id: 'aove', name: 'AOVE', inStock: true, matchKeywords: ['aceite de oliva', 'aove'] },
    ];
    const withPantry = generateShoppingListFromPlan(planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]), [pollo], {
      pantry,
    });
    const without = generateShoppingListFromPlan(planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]), [pollo]);
    assert.equal(without.some((i) => /aceite/i.test(i.name)), true);
    assert.equal(withPantry.some((i) => /aceite/i.test(i.name)), false);
    assert.equal(isCoveredByPantry('Aceite de oliva virgen extra', pantry), true);
  });

  it('escala cantidades con las raciones de casa', () => {
    const for4 = generateShoppingListFromPlan(planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]), [pollo], {
      householdServings: 4,
    });
    const for3 = generateShoppingListFromPlan(planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]), [pollo], {
      householdServings: 3,
    });
    const qty4 = for4.find((i) => i.id === 'item-pollo-pechuga')?.recipeUsageNote || '';
    const qty3 = for3.find((i) => i.id === 'item-pollo-pechuga')?.recipeUsageNote || '';
    assert.match(qty4, /500/);
    assert.match(qty3, /375/);
  });

  it('no compra de nuevo una receta marcada como sobra', () => {
    const list = generateShoppingListFromPlan(
      planWith([
        { day: 'lunes', meal: 'lunch', id: 'r1' },
        { day: 'martes', meal: 'lunch', id: 'r1', leftover: true },
      ]),
      [pollo]
    );
    const polloItem = list.find((i) => i.id === 'item-pollo-pechuga');
    assert.match(polloItem?.recipeUsageNote || '', /500/);
  });

  it('usa ids estables y conserva el check al regenerar', () => {
    const plan = planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]);
    const first = generateShoppingListFromPlan(plan, [pollo]);
    const id = first.find((i) => i.id === 'item-pollo-pechuga')!.id;
    const checked = first.map((i) => (i.id === id ? { ...i, checked: true } : i));
    const second = generateShoppingListFromPlan(plan, [pollo], { existingShoppingList: checked });
    assert.equal(second.find((i) => i.id === id)?.checked, true);
    assert.equal(second.find((i) => i.id === id)?.id, id);
  });

  it('hueco fuera no añade ingredientes', () => {
    const plan = emptyWeeklyPlan('2026-08-31');
    plan.days.lunes.dinner = { kind: 'out', customName: 'Comemos fuera' };
    const list = generateShoppingListFromPlan(plan, [pollo, taquitos]);
    assert.equal(list.length, 0);
  });

  it('omite ingredientes vigentes en despensa pero incluye los caducados', () => {
    const freshPantry: PantryItem[] = [
      {
        id: 'p-pollo',
        name: 'Pechuga de pollo',
        inStock: true,
        category: 'carniceria',
        addedDate: '2026-08-31',
        shelfLifeDays: 4,
        matchKeywords: ['pechuga de pollo', 'pollo'],
      },
    ];

    // Con pollo fresco en despensa -> no se añade a la lista de compra
    const listFresh = generateShoppingListFromPlan(
      planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]),
      [pollo],
      { pantry: freshPantry }
    );
    assert.equal(listFresh.some((i) => i.id === 'item-pollo-pechuga'), false);

    // Con pollo caducado hace días -> sí se añade a la lista de compra
    const expiredPantry: PantryItem[] = [
      {
        id: 'p-pollo',
        name: 'Pechuga de pollo',
        inStock: true,
        category: 'carniceria',
        addedDate: '2026-08-01', // añadido hace 30 días, vida útil 4d
        shelfLifeDays: 4,
        matchKeywords: ['pechuga de pollo', 'pollo'],
      },
    ];
    const listExpired = generateShoppingListFromPlan(
      planWith([{ day: 'lunes', meal: 'lunch', id: 'r1' }]),
      [pollo],
      { pantry: expiredPantry }
    );
    assert.equal(listExpired.some((i) => i.id === 'item-pollo-pechuga'), true);
  });
});

