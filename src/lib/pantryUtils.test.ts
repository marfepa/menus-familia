import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DynamicPantryItem, ExcludedFoodItem, ShoppingItem } from '@/types';
import {
  getEstimatedShelfLifeDays,
  calculateShelfLifeInfo,
  extractMatchKeywords,
  createPantryItemFromShopping,
  matchesExcludedFood,
} from '@/lib/pantryUtils';

describe('pantryUtils', () => {
  it('calcula días de vida útil estimados según reglas específicas y categoría', () => {
    assert.equal(getEstimatedShelfLifeDays('Lomos de salmón fresco', 'pescaderia'), 3);
    assert.equal(getEstimatedShelfLifeDays('Carne picada de vacuno', 'carniceria'), 2);
    assert.equal(getEstimatedShelfLifeDays('Huevos camperos', 'lacteos'), 28);
    assert.equal(getEstimatedShelfLifeDays('Garbanzos cocidos', 'despensa'), 180);
    assert.equal(getEstimatedShelfLifeDays('Calabacín verde', 'fruteria'), 6);
  });

  it('calcula batería de frescura correctamente (100% fresco, medio, crítico, caducado)', () => {
    const item: DynamicPantryItem = {
      id: 'test-1',
      name: 'Pechuga de pollo',
      inStock: true,
      category: 'carniceria',
      addedDate: '2026-08-31',
      shelfLifeDays: 4,
      matchKeywords: ['pollo'],
    };

    // Mismo día (0 días transcurridos) -> 100% fresco
    const info0 = calculateShelfLifeInfo(item, '2026-08-31');
    assert.equal(info0.daysRemaining, 4);
    assert.equal(info0.percentRemaining, 100);
    assert.equal(info0.status, 'fresh');
    assert.equal(info0.isExpired, false);

    // 2 días transcurridos -> 50%
    const info2 = calculateShelfLifeInfo(item, '2026-09-02');
    assert.equal(info2.daysRemaining, 2);
    assert.equal(info2.percentRemaining, 50);
    assert.equal(info2.status, 'medium');

    // 3 días transcurridos (queda 1 día) -> crítico
    const info3 = calculateShelfLifeInfo(item, '2026-09-03');
    assert.equal(info3.daysRemaining, 1);
    assert.equal(info3.percentRemaining, 25);
    assert.equal(info3.status, 'critical');

    // 4 días transcurridos -> caduca hoy / 0 días
    const info4 = calculateShelfLifeInfo(item, '2026-09-04');
    assert.equal(info4.daysRemaining, 0);
    assert.equal(info4.percentRemaining, 0);
    assert.equal(info4.status, 'expired');
    assert.equal(info4.isExpired, true);

    // 6 días transcurridos -> vencido hace 2 días
    const info6 = calculateShelfLifeInfo(item, '2026-09-06');
    assert.equal(info6.daysRemaining, -2);
    assert.equal(info6.status, 'expired');
  });

  it('crea un elemento de despensa a partir de un artículo de la lista de compra', () => {
    const shoppingItem: ShoppingItem = {
      id: 'item-salmon',
      name: 'Lomos de salmón fresco sin espinas',
      category: 'pescaderia',
      checked: true,
      quantity: 1,
      commercialFormat: '1 Bandeja (2 lomos)',
      packageFormat: 'bandeja',
    };

    const pantryItem = createPantryItemFromShopping(shoppingItem, '2026-08-31');
    assert.equal(pantryItem.name, shoppingItem.name);
    assert.equal(pantryItem.category, 'pescaderia');
    assert.equal(pantryItem.addedDate, '2026-08-31');
    assert.equal(pantryItem.shelfLifeDays, 3);
    assert.equal(pantryItem.inStock, true);
    assert.ok(pantryItem.matchKeywords.includes('salmon'));
  });

  it('detecta coincidencias de alimentos vetados / excluidos', () => {
    const excluded: ExcludedFoodItem[] = [
      {
        id: 'ex-1',
        name: 'Berenjena',
        matchKeywords: ['berenjena', 'berenjenas'],
        addedDate: '2026-08-31',
      },
      {
        id: 'ex-2',
        name: 'Cilantro',
        matchKeywords: ['cilantro'],
        addedDate: '2026-08-31',
      },
    ];

    assert.ok(matchesExcludedFood('Lasaña de berenjena y carne', excluded));
    assert.ok(matchesExcludedFood('Tacos con cilantro picado', excluded));
    assert.equal(matchesExcludedFood('Pollo al ajillo con patatas', excluded), undefined);
  });
});
