import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { ShoppingItem } from '@/types';
import {
  formatRemindersPlainText,
  formatRemindersForShortcut,
  buildShortcutsUrl,
  generateRemindersIcsFile,
} from '@/lib/reminders/shortcutsFormatter';

const sampleItems: ShoppingItem[] = [
  {
    id: 'item-1',
    name: 'Pechuga de pollo',
    category: 'carniceria',
    quantity: 500,
    unit: 'g',
    commercialFormat: '500g bandeja',
    recipeUsageNote: 'Pollo al horno',
    storeTip: 'Carnicería / Nevera',
    checked: false,
  },
  {
    id: 'item-2',
    name: 'Huevos camperos',
    category: 'huevos_lacteos',
    quantity: 1,
    unit: 'docena',
    commercialFormat: 'Docena (M/L)',
    storeTip: 'Huevos y lácteos',
    checked: true,
  },
  {
    id: 'item-3',
    name: 'Cebolla dulce',
    category: 'fruteria',
    quantity: 2,
    unit: 'piezas',
    checked: false,
  },
];

describe('shortcutsFormatter', () => {
  it('genera texto plano filtrando comprados por defecto', () => {
    const text = formatRemindersPlainText(sampleItems);
    assert.ok(text.includes('Pechuga de pollo (500g bandeja)'));
    assert.ok(text.includes('📍 Carnicería / Nevera'));
    assert.ok(text.includes('Cebolla dulce (2 piezas)'));
    assert.strictEqual(text.includes('Huevos camperos'), false);
  });

  it('incluye todos los elementos si onlyUnchecked es false', () => {
    const text = formatRemindersPlainText(sampleItems, false);
    assert.ok(text.includes('Huevos camperos'));
  });

  it('formatea para Atajos con separador :::', () => {
    const formatted = formatRemindersForShortcut(sampleItems);
    assert.ok(formatted.includes('Pechuga de pollo · 500g bandeja:::Pasillo: Carnicería / Nevera | Pollo al horno'));
    assert.ok(formatted.includes('Cebolla dulce (2 piezas):::'));
  });

  it('construye la URL de esquema shortcuts:// válida', () => {
    const url = buildShortcutsUrl('Mi Atajo', sampleItems);
    assert.ok(url.startsWith('shortcuts://run-shortcut?name=Mi%20Atajo&input=text&text='));
    assert.ok(url.includes(encodeURIComponent('Pechuga de pollo')));
  });

  it('genera archivo ICS con componentes VTODO', () => {
    const ics = generateRemindersIcsFile(sampleItems);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('BEGIN:VTODO'));
    assert.ok(ics.includes('SUMMARY:Pechuga de pollo (500g bandeja)'));
    assert.ok(ics.includes('STATUS:NEEDS-ACTION'));
    assert.ok(ics.includes('END:VTODO'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });
});
