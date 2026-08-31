import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage } from '@/lib/storage';
import type { FamilySyncPayload } from '@/types';

// Mock localStorage para entorno de tests Node.js
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
}

// Inyectar globalThis.localStorage si no existe
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = new LocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = globalThis;
}

test('sync and storage payload serialization', async (t) => {
  await t.test('genera un payload completo con todas las entidades familiares', () => {
    localStorage.clear();
    const payload = Storage.getFullPayload();

    assert.ok(payload.recipes.length > 0, 'Debe incluir recetas iniciales');
    assert.ok(payload.pantry.length > 0, 'Debe incluir despensa');
    assert.ok(payload.settings.householdServings > 0, 'Debe incluir raciones');
    assert.ok(typeof payload.plans === 'object', 'Debe incluir objeto de planes');
    assert.ok(typeof payload.shoppingLists === 'object', 'Debe incluir listas de compra');
    assert.ok(payload.deviceId, 'Debe generar un deviceId');
    assert.ok(payload.updatedAt, 'Debe incluir timestamp de actualización');
  });

  await t.test('aplica un payload remoto correctamente al almacenamiento local', () => {
    localStorage.clear();

    const mockRemotePayload: FamilySyncPayload = {
      version: 1,
      updatedAt: '2026-08-31T18:00:00.000Z',
      deviceId: 'dev_partner_phone',
      recipes: [
        {
          id: 'test-recipe-1',
          name: 'Pasta Fresca Familiar',
          description: 'Receta de prueba sincronizada',
          prepTimeMinutes: 20,
          servings: 4,
          mealType: 'lunch',
          tags: ['pasta'],
          ingredients: [],
          instructions: [],
          rating: 5,
        },
      ],
      plans: {
        '2026-08-31': {
          id: 'plan-test',
          weekStartDate: '2026-08-31',
          days: {
            lunes: { lunch: { kind: 'recipe', recipeId: 'test-recipe-1' } },
            martes: {},
            miercoles: {},
            jueves: {},
            viernes: {},
            sabado: {},
            domingo: {},
          },
        },
      },
      shoppingLists: {
        '2026-08-31': [
          {
            id: 'item-1',
            name: 'Tomates cherry',
            category: 'fruteria',
            checked: true,
          },
        ],
      },
      settings: {
        householdServings: 5,
        generateMode: 'dinners',
        prioritizeAirFryerDinners: true,
      },
      pantry: [
        {
          id: 'p-1',
          name: 'Aceite de Oliva',
          inStock: true,
          matchKeywords: ['aceite'],
        },
      ],
      excludedFoods: [
        {
          id: 'ex-1',
          name: 'Marisco crudo',
          matchKeywords: ['ostras'],
          addedDate: '2026-08-31',
        },
      ],
    };

    Storage.applyFullPayload(mockRemotePayload);

    const loadedRecipes = Storage.getRecipes();
    const loadedPlan = Storage.getPlanForWeek('2026-08-31');
    const loadedShopping = Storage.getShoppingList('2026-08-31');
    const loadedSettings = Storage.getSettings();
    const loadedPantry = Storage.getPantry();
    const loadedExcluded = Storage.getExcludedFoods();
    const lastUpdate = Storage.getLastLocalUpdate();

    assert.equal(loadedRecipes[0].name, 'Pasta Fresca Familiar');
    assert.equal(loadedPlan.days.lunes.lunch?.recipeId, 'test-recipe-1');
    assert.equal(loadedShopping?.[0].checked, true);
    assert.equal(loadedSettings.householdServings, 5);
    assert.equal(loadedSettings.generateMode, 'dinners');
    assert.equal(loadedPantry.some((p) => p.name === 'Aceite de Oliva'), true);
    assert.equal(loadedExcluded[0].name, 'Marisco crudo');
    assert.equal(lastUpdate, '2026-08-31T18:00:00.000Z');
  });

  await t.test('mantiene deviceId estable y persistente en el dispositivo', () => {
    localStorage.clear();
    const id1 = Storage.getDeviceId();
    const id2 = Storage.getDeviceId();
    assert.equal(id1, id2, 'El identificador de dispositivo debe mantenerse estable');
  });
});
