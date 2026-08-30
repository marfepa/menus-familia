import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMonday, getRelativeWeekMonday, toLocalISODate } from '@/lib/utils';

describe('week dates', () => {
  it('formatea fechas locales sin pasar por UTC', () => {
    const date = new Date(2026, 7, 24, 0, 30, 0);
    assert.equal(toLocalISODate(date), '2026-08-24');
  });

  it('getRelativeWeekMonday resta 7 días locales', () => {
    assert.equal(getRelativeWeekMonday(-1, '2026-08-24'), '2026-08-17');
    assert.equal(getRelativeWeekMonday(1, '2026-08-24'), '2026-08-31');
  });

  it('getMonday de un martes local es el lunes de esa semana', () => {
    const tuesday = new Date(2026, 7, 25, 0, 15, 0);
    assert.equal(getMonday(tuesday), '2026-08-24');
  });
});
