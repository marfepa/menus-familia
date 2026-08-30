import type { AppSettings, PantryItem } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  householdServings: 4,
  generateMode: 'full',
};

/** Fondo de despensa: lo marcado se resta de la lista de compra. */
export const DEFAULT_PANTRY: PantryItem[] = [
  {
    id: 'aove',
    name: 'Aceite de oliva virgen extra',
    inStock: true,
    matchKeywords: ['aceite de oliva', 'aove', 'aceite virgen'],
  },
  {
    id: 'ajos',
    name: 'Ajos',
    inStock: true,
    matchKeywords: ['diente de ajo', 'dientes de ajo', 'ajos', 'ajo'],
  },
  {
    id: 'especias',
    name: 'Especias (pimentón, orégano, laurel, maicena)',
    inStock: true,
    matchKeywords: ['pimenton', 'oregano', 'laurel', 'maicena', 'ajo en polvo'],
  },
  {
    id: 'sal',
    name: 'Sal',
    inStock: true,
    matchKeywords: ['sal en escamas', 'sal'],
  },
  {
    id: 'huevos',
    name: 'Huevos camperos',
    inStock: false,
    matchKeywords: ['huevos camperos', 'huevo duro', 'huevos', 'huevo'],
  },
  {
    id: 'caldo',
    name: 'Caldo (brik 1L)',
    inStock: false,
    matchKeywords: ['caldo de pollo', 'caldo de pescado', 'caldo de verduras', 'caldo suave', 'caldo'],
  },
  {
    id: 'tamari',
    name: 'Salsa de soja / Tamari',
    inStock: false,
    matchKeywords: ['salsa de soja', 'tamari'],
  },
  {
    id: 'arroz',
    name: 'Arroz / quinoa (paquete o vasitos)',
    inStock: false,
    matchKeywords: ['arroz basmati', 'arroz jazmin', 'arroz blanco', 'arroz cocido', 'quinoa'],
  },
  {
    id: 'legumbres',
    name: 'Legumbres de bote',
    inStock: false,
    matchKeywords: ['lentejas', 'garbanzos'],
  },
  {
    id: 'tomate_triturado',
    name: 'Tomate triturado / frito',
    inStock: false,
    matchKeywords: ['tomate triturado', 'tomate frito'],
  },
];
