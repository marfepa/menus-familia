import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  inferCategory,
  parseSingleReminderText,
  parseRemindersPayload,
  mergeImportedItemsIntoShoppingList,
} from '@/lib/reminders/reminderImporter';
import type { ShoppingItem } from '@/types';

describe('reminderImporter', () => {
  it('inferCategory asigna pasillos correctamente', () => {
    assert.strictEqual(inferCategory('Salmón noruego fresco'), 'pescaderia');
    assert.strictEqual(inferCategory('Merluza congelada'), 'pescaderia');
    assert.strictEqual(inferCategory('Pechuga de pollo fileteada'), 'carniceria');
    assert.strictEqual(inferCategory('Carne picada de ternera'), 'carniceria');
    assert.strictEqual(inferCategory('Plátanos de Canarias'), 'fruteria');
    assert.strictEqual(inferCategory('Tomates ensalada'), 'fruteria');
    assert.strictEqual(inferCategory('Leche semidesnatada'), 'lacteos');
    assert.strictEqual(inferCategory('Docena de huevos camperos'), 'lacteos');
    assert.strictEqual(inferCategory('Barra de pan rústico'), 'panaderia');
    assert.strictEqual(inferCategory('Pan de molde integral'), 'panaderia');
    assert.strictEqual(inferCategory('Arroz redondo'), 'despensa');
    assert.strictEqual(inferCategory('Aceite de oliva virgen extra'), 'despensa');
    assert.strictEqual(inferCategory('Papel higiénico'), 'otros');
    assert.strictEqual(inferCategory('Detergente para lavadora'), 'otros');
  });

  it('parseSingleReminderText extrae cantidades, unidades y formatos', () => {
    // Test con cantidad y unidad kg
    const p1 = parseSingleReminderText('2 kg de patatas');
    assert.strictEqual(p1.name, 'Patatas');
    assert.strictEqual(p1.quantity, 2);
    assert.strictEqual(p1.unit, 'kg');
    assert.strictEqual(p1.category, 'fruteria');

    // Test con docena
    const p2 = parseSingleReminderText('1 docena de huevos');
    assert.strictEqual(p2.name, 'Huevos');
    assert.strictEqual(p2.quantity, 1);
    assert.strictEqual(p2.unit, 'docena');
    assert.strictEqual(p2.packageFormat, 'docena');
    assert.strictEqual(p2.category, 'lacteos');

    // Test con botes y notas
    const p3 = parseSingleReminderText('2 botes de garbanzos cocidos — Pasillo 3');
    assert.strictEqual(p3.name, 'Garbanzos cocidos');
    assert.strictEqual(p3.quantity, 2);
    assert.strictEqual(p3.unit, 'bote');
    assert.strictEqual(p3.notes, 'Pasillo 3');
    assert.strictEqual(p3.category, 'despensa');

    // Test con viñeta y formato entre paréntesis
    const p4 = parseSingleReminderText('• Leche entera (Pack 6 briks)');
    assert.strictEqual(p4.name, 'Leche entera');
    assert.strictEqual(p4.commercialFormat, 'Pack 6 briks');
    assert.strictEqual(p4.category, 'lacteos');
  });

  it('parseRemindersPayload procesa texto y arrays de forma robusta', () => {
    // Multilínea string
    const textPayload = `
      1 kg de manzanas
      2 brik de leche
      Pechuga de pollo
    `;
    const items = parseRemindersPayload(textPayload);
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].name, 'Manzanas');
    assert.strictEqual(items[0].quantity, 1);
    assert.strictEqual(items[0].unit, 'kg');
    assert.strictEqual(items[0].category, 'fruteria');
    assert.strictEqual(items[0].checked, false);

    assert.strictEqual(items[1].name, 'Leche');
    assert.strictEqual(items[1].category, 'lacteos');

    assert.strictEqual(items[2].name, 'Pechuga de pollo');
    assert.strictEqual(items[2].category, 'carniceria');

    // Array de objetos
    const objPayload = [
      { title: 'Papel de cocina', notes: 'Droguería' },
      { name: '500g de carne picada' },
    ];
    const items2 = parseRemindersPayload(objPayload);
    assert.strictEqual(items2.length, 2);
    assert.strictEqual(items2[0].name, 'Papel de cocina');
    assert.strictEqual(items2[0].category, 'otros');
    assert.strictEqual(items2[0].storeTip, 'Droguería');
    assert.strictEqual(items2[1].name, 'Carne picada');
    assert.strictEqual(items2[1].quantity, 500);
    assert.strictEqual(items2[1].unit, 'g');
  });

  it('mergeImportedItemsIntoShoppingList combina y reactiva productos', () => {
    const currentList: ShoppingItem[] = [
      {
        id: 'item-1',
        name: 'Leche semidesnatada',
        quantity: 1,
        unit: 'l',
        category: 'lacteos',
        checked: true,
        period: 'weekday',
      },
      {
        id: 'item-2',
        name: 'Arroz',
        quantity: 500,
        unit: 'g',
        category: 'despensa',
        checked: false,
        period: 'weekday',
      },
    ];

    const incoming: ShoppingItem[] = [
      {
        id: 'item-new-1',
        name: 'Leche semidesnatada',
        quantity: 2,
        unit: 'l',
        category: 'lacteos',
        checked: false,
        period: 'weekday',
      },
      {
        id: 'item-new-2',
        name: 'Plátanos',
        quantity: 1,
        unit: 'kg',
        category: 'fruteria',
        checked: false,
        period: 'weekday',
      },
    ];

    const { updatedList, addedCount } = mergeImportedItemsIntoShoppingList(currentList, incoming);

    assert.strictEqual(addedCount, 2);
    assert.strictEqual(updatedList.length, 3);

    // Leche semidesnatada debe estar ahora unchecked (checked: false) y sumada a 3L
    const leche = updatedList.find((i) => i.name === 'Leche semidesnatada');
    assert.ok(leche);
    assert.strictEqual(leche?.checked, false);
    assert.strictEqual(leche?.quantity, 3);

    // Plátanos añadido
    const platanos = updatedList.find((i) => i.name === 'Plátanos');
    assert.ok(platanos);
    assert.strictEqual(platanos?.quantity, 1);
    assert.strictEqual(platanos?.category, 'fruteria');
  });
});
