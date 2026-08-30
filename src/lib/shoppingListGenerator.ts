import type {
  Recipe,
  WeeklyPlan,
  ShoppingItem,
  IngredientCategory,
  ShoppingPeriod,
  PackageFormat,
  PantryItem,
} from '@/types';
import { PLAN_DAYS, slotNeedsIngredients } from '@/lib/planUtils';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function canonicalAmount(qty: number, unit: string): { qty: number; unit: string } {
  const u = normalizeText(unit);
  if (u === 'kg' || u === 'kilo' || u === 'kilos') return { qty: qty * 1000, unit: 'g' };
  if (u === 'l' || u === 'litro' || u === 'litros') return { qty: qty * 1000, unit: 'ml' };
  if (u === 'gr' || u === 'gramos' || u === 'g') return { qty, unit: 'g' };
  if (u === 'ml' || u === 'mililitros') return { qty, unit: 'ml' };
  if (['ud', 'uds', 'unidad', 'unidades'].includes(u)) return { qty, unit: 'uds' };
  if (u === 'vasito' || u === 'vasitos') return { qty: qty * 125, unit: 'g' };
  return { qty, unit: u || 'uds' };
}

export function isCoveredByPantry(ingredientName: string, pantry: PantryItem[] = []): boolean {
  const n = normalizeText(ingredientName);
  return pantry.some((item) => {
    if (!item.inStock) return false;
    return item.matchKeywords
      .slice()
      .sort((a, b) => b.length - a.length)
      .some((kw) => {
        const nk = normalizeText(kw);
        if (nk.length <= 3) {
          return new RegExp(`(^|[^a-z0-9])${nk}([^a-z0-9]|$)`).test(n);
        }
        return n.includes(nk);
      });
  });
}

export interface SupermarketProductRule {
  id: string;
  matchKeywords: string[];
  commercialName: string;
  category: IngredientCategory;
  packageFormat: PackageFormat;
  supermarketTip: string;
  computeFormat: (totalQty: number, unit: string, recipeCount: number) => {
    commercialFormat: string;
    recipeUsageNote: string;
    suggestedPacks: number;
    commercialUnit: string;
  };
}

const SUPERMARKET_RULES: SupermarketProductRule[] = [
  // --- CARNICERÍA Y AVES (LIDL/ALDI/CONSUM: Mural refrigerado / Bandejas atmósfera protectora) ---
  {
    id: 'pollo_pechuga',
    matchKeywords: ['pechuga de pollo', 'pollo en dados', 'pechugas de pollo', 'pechuga', 'pechugas'],
    commercialName: 'Pechuga de pollo fileteada / en dados',
    category: 'carniceria',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural carnicería: bandeja atmósfera protectora',
    computeFormat: (qty, _unit, recipeCount) => {
      const grams = qty > 20 ? qty : qty * 150; // Si venía en uds
      if (grams <= 550) {
        return {
          commercialFormat: '1 Bandeja (~500g)',
          recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} ${recipeCount === 1 ? 'receta' : 'recetas'})`,
          suggestedPacks: 1,
          commercialUnit: 'Bandeja (500g)',
        };
      } else if (grams <= 1100) {
        return {
          commercialFormat: '1 Bandeja Familiar (~1kg)',
          recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} recetas) · Formato ahorro`,
          suggestedPacks: 1,
          commercialUnit: 'Bandeja Familiar (1kg)',
        };
      } else {
        const packs = Math.ceil(grams / 500);
        return {
          commercialFormat: `${packs} Bandejas (~500g c/u)`,
          recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} recetas)`,
          suggestedPacks: packs,
          commercialUnit: `Bandejas (~500g)`,
        };
      }
    },
  },
  {
    id: 'ternera_picada',
    matchKeywords: ['carne picada', 'ternera magra', 'ternera picada'],
    commercialName: 'Carne picada de vacuno / ternera magra',
    category: 'carniceria',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural carnicería: bandeja 400g-500g',
    computeFormat: (qty, _unit, recipeCount) => {
      const grams = qty;
      const packs = Math.ceil(grams / 500) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (500g${packs > 1 ? ' c/u' : ''})`,
        recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} ${recipeCount === 1 ? 'receta' : 'recetas'})`,
        suggestedPacks: packs,
        commercialUnit: `Bandeja (500g)`,
      };
    },
  },
  {
    id: 'pavo_dados',
    matchKeywords: ['pavo', 'solomillo de pavo', 'pechuga de pavo'],
    commercialName: 'Pechuga / Solomillo de pavo en dados o filetes',
    category: 'carniceria',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural carnicería: bandeja 400-500g',
    computeFormat: (qty, _unit, recipeCount) => {
      const grams = qty;
      const packs = Math.ceil(grams / 500) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (~500g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} recetas)`,
        suggestedPacks: packs,
        commercialUnit: 'Bandeja (~500g)',
      };
    },
  },
  {
    id: 'taquitos_jamon_pavo',
    matchKeywords: ['taquitos de jamon', 'tacos de jamon', 'taquitos de pechuga', 'jamon iberico', 'pavo braseado', 'taquitos'],
    commercialName: 'Taquitos de jamón / pavo',
    category: 'carniceria',
    packageFormat: 'pack',
    supermarketTip: 'Mural embutidos: bipack 2x75g / 2x100g',
    computeFormat: (qty, _unit, recipeCount) => {
      const grams = qty;
      const bipacks = Math.ceil(grams / 150) || 1;
      return {
        commercialFormat: `${bipacks} Bipack (2x75g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(grams)}g en ${recipeCount} recetas`,
        suggestedPacks: bipacks,
        commercialUnit: 'Bipack (2x75g)',
      };
    },
  },

  // --- PESCADERÍA (LIDL/ALDI/CONSUM: Refrigerado bandeja skin / mostrador) ---
  {
    id: 'salmon_fresco',
    matchKeywords: ['salmon', 'lomos de salmon'],
    commercialName: 'Lomos de salmón fresco sin espinas',
    category: 'pescaderia',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural pescadería: bandeja skin 2 o 4 lomos',
    computeFormat: (qty, unit, recipeCount) => {
      const lomos = unit === 'uds' || unit === 'lomos' ? qty : Math.ceil(qty / 125);
      if (lomos <= 2) {
        return {
          commercialFormat: '1 Bandeja (2 lomos / ~250g)',
          recipeUsageNote: `Usa ${lomos} lomos en ${recipeCount} recetas`,
          suggestedPacks: 1,
          commercialUnit: 'Bandeja (2 lomos)',
        };
      } else if (lomos <= 4) {
        return {
          commercialFormat: '1 Bandeja (4 lomos / ~500g)',
          recipeUsageNote: `Usa ${lomos} lomos en ${recipeCount} recetas`,
          suggestedPacks: 1,
          commercialUnit: 'Bandeja (4 lomos)',
        };
      } else {
        const packs = Math.ceil(lomos / 4);
        return {
          commercialFormat: `${packs} Bandejas (4 lomos c/u)`,
          recipeUsageNote: `Usa ${lomos} lomos en ${recipeCount} recetas`,
          suggestedPacks: packs,
          commercialUnit: 'Bandejas (4 lomos)',
        };
      }
    },
  },
  {
    id: 'merluza_limpia',
    matchKeywords: ['merluza', 'lomos de merluza', 'filetes de merluza'],
    commercialName: 'Lomos de merluza fresca limpia sin espinas',
    category: 'pescaderia',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural pescadería: bandeja 4 lomos / ~400g',
    computeFormat: (qty, unit, recipeCount) => {
      const lomos = unit === 'uds' || unit === 'lomos' ? qty : Math.ceil(qty / 100);
      const packs = Math.ceil(lomos / 4) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (4 lomos / ~400g)`,
        recipeUsageNote: `Usa ${lomos} lomos en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Bandeja (4 lomos)',
      };
    },
  },
  {
    id: 'dorada_lubina',
    matchKeywords: ['dorada', 'lubina', 'filetes de dorada'],
    commercialName: 'Filetes de dorada / lubina sin espinas',
    category: 'pescaderia',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural pescadería: bandeja 2-4 filetes (~400g)',
    computeFormat: (qty, _unit, recipeCount) => {
      const packs = Math.ceil(qty / 4) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (4 filetes / ~400g)`,
        recipeUsageNote: `Usa ${qty} filetes en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Bandeja (4 filetes)',
      };
    },
  },
  {
    id: 'gambas_langostinos',
    matchKeywords: ['gambas', 'langostinos'],
    commercialName: 'Gambas / Langostinos pelados',
    category: 'pescaderia',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural pescadería fresca o congelados: 250-300g',
    computeFormat: (qty, _unit, recipeCount) => {
      const packs = Math.ceil(qty / 250) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (~250-300g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: packs,
        commercialUnit: 'Bandeja (250g)',
      };
    },
  },
  {
    id: 'atun_bonito_fresco',
    matchKeywords: ['bonito del norte', 'atun fresco', 'dados limpios'],
    commercialName: 'Bonito del norte / Atún fresco en dados',
    category: 'pescaderia',
    packageFormat: 'bandeja',
    supermarketTip: 'Mural pescadería: bandeja 400g',
    computeFormat: (qty, _unit, recipeCount) => {
      const packs = Math.ceil(qty / 400) || 1;
      return {
        commercialFormat: `${packs} Bandeja${packs > 1 ? 's' : ''} (~400g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: packs,
        commercialUnit: 'Bandeja (400g)',
      };
    },
  },

  // --- FRUTERÍA Y VERDURAS (LIDL/ALDI/CONSUM: Mallas, Bolsas, Bandejas y Granel) ---
  {
    id: 'patatas_malla',
    matchKeywords: ['patata', 'patatas', 'panaderas', 'pure'],
    commercialName: 'Patatas para guisar / asar',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 2kg (Lidl / Aldi / Consum)',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 150);
      const mallas = Math.ceil(uds / 12) || 1;
      return {
        commercialFormat: `${mallas} Malla${mallas > 1 ? 's' : ''} (2kg)`,
        recipeUsageNote: `Usa ~${uds} patatas (${recipeCount} recetas) · Resto en despensa`,
        suggestedPacks: mallas,
        commercialUnit: 'Malla (2kg)',
      };
    },
  },
  {
    id: 'zanahorias_bolsa',
    matchKeywords: ['zanahoria', 'zanahorias'],
    commercialName: 'Zanahorias',
    category: 'fruteria',
    packageFormat: 'bolsa',
    supermarketTip: 'Frutería: Bolsa 1kg (lineal frescos)',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 70);
      const bolsas = Math.ceil(uds / 12) || 1;
      return {
        commercialFormat: `${bolsas} Bolsa${bolsas > 1 ? 's' : ''} (1kg)`,
        recipeUsageNote: `Usa ${uds} zanahorias (${recipeCount} recetas) · Resto fondo nevera`,
        suggestedPacks: bolsas,
        commercialUnit: 'Bolsa (1kg)',
      };
    },
  },
  {
    id: 'calabacin_bandeja',
    matchKeywords: ['calabacin', 'calabacines'],
    commercialName: 'Calabacines verdes',
    category: 'fruteria',
    packageFormat: 'bandeja',
    supermarketTip: 'Frutería: Bandeja 3 uds (~750g) o a granel',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 250);
      if (uds <= 3) {
        return {
          commercialFormat: '1 Bandeja (3 uds / ~750g)',
          recipeUsageNote: `Usa ${uds} uds (${recipeCount} recetas)`,
          suggestedPacks: 1,
          commercialUnit: 'Bandeja (3 uds)',
        };
      } else {
        const bandejas = Math.ceil(uds / 3);
        return {
          commercialFormat: `${bandejas} Bandejas (3 uds c/u)`,
          recipeUsageNote: `Usa ${uds} calabacines (${recipeCount} recetas)`,
          suggestedPacks: bandejas,
          commercialUnit: 'Bandejas (3 uds)',
        };
      }
    },
  },
  {
    id: 'espinacas_frescas',
    matchKeywords: ['espinacas', 'espinaca', 'baby'],
    commercialName: 'Espinacas tiernas baby (ensalada)',
    category: 'fruteria',
    packageFormat: 'bolsa',
    supermarketTip: 'Frutería: Bolsa ensalada 150-300g',
    computeFormat: (qty, _unit, recipeCount) => {
      const bolsas = Math.ceil(qty / 300) || 1;
      return {
        commercialFormat: `${bolsas} Bolsa${bolsas > 1 ? 's' : ''} (300g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: bolsas,
        commercialUnit: 'Bolsa (300g)',
      };
    },
  },
  {
    id: 'tomates_cherry',
    matchKeywords: ['cherry', 'cherrys'],
    commercialName: 'Tomates cherry',
    category: 'fruteria',
    packageFormat: 'bandeja',
    supermarketTip: 'Frutería: Bandeja/Tarrina 250g o 500g',
    computeFormat: (qty, _unit, recipeCount) => {
      const bandejas = Math.ceil(qty / 250) || 1;
      return {
        commercialFormat: `${bandejas} Bandeja${bandejas > 1 ? 's' : ''} (250g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: bandejas,
        commercialUnit: 'Bandeja (250g)',
      };
    },
  },
  {
    id: 'pimientos_tricolor',
    matchKeywords: ['pimiento rojo', 'pimiento verde', 'pimientos'],
    commercialName: 'Pimientos (rojo / verde / dulce)',
    category: 'fruteria',
    packageFormat: 'pack',
    supermarketTip: 'Frutería: Pack Tricolor 3 uds (500g) o bolsa verdes',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 150);
      const packs = Math.ceil(uds / 3) || 1;
      return {
        commercialFormat: `${packs} Pack Tricolor (3 uds / 500g)`,
        recipeUsageNote: `Usa ~${uds} pimientos en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Pack Tricolor (3 uds)',
      };
    },
  },
  {
    id: 'cebollas_malla',
    matchKeywords: ['cebolla', 'cebollas', 'cebolla dulce'],
    commercialName: 'Cebollas dulces',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 1kg (3-4 uds)',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 150);
      return {
        commercialFormat: '1 Malla (1kg)',
        recipeUsageNote: `Usa ${uds} uds (${recipeCount} recetas) · Despensa`,
        suggestedPacks: 1,
        commercialUnit: 'Malla (1kg)',
      };
    },
  },
  {
    id: 'puerros_manojo',
    matchKeywords: ['puerro', 'puerros'],
    commercialName: 'Puerros frescos',
    category: 'fruteria',
    packageFormat: 'manojo',
    supermarketTip: 'Frutería: Manojo 3 uds o bandeja limpia',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : 1;
      const manojos = Math.ceil(uds / 3) || 1;
      return {
        commercialFormat: `${manojos} Manojo${manojos > 1 ? 's' : ''} (3 uds)`,
        recipeUsageNote: `Usa ${uds} uds en ${recipeCount} recetas`,
        suggestedPacks: manojos,
        commercialUnit: 'Manojo (3 uds)',
      };
    },
  },
  {
    id: 'boniatos_malla',
    matchKeywords: ['boniato', 'boniatos', 'batata', 'batatas'],
    commercialName: 'Boniatos / Batatas dulces',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 1kg (2-3 piezas) o granel',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 300);
      const mallas = Math.ceil(uds / 3) || 1;
      return {
        commercialFormat: `${mallas} Malla${mallas > 1 ? 's' : ''} (1kg)`,
        recipeUsageNote: `Usa ${uds} boniatos en ${recipeCount} recetas`,
        suggestedPacks: mallas,
        commercialUnit: 'Malla (1kg)',
      };
    },
  },
  {
    id: 'aguacates_malla',
    matchKeywords: ['aguacate', 'aguacates', 'guacamole'],
    commercialName: 'Aguacates maduros "al punto"',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 500g (3-4 uds) o bandeja 2 uds',
    computeFormat: (qty, unit, recipeCount) => {
      const uds = unit === 'uds' ? qty : Math.ceil(qty / 120);
      const mallas = Math.ceil(uds / 3) || 1;
      return {
        commercialFormat: `${mallas} Malla${mallas > 1 ? 's' : ''} (3-4 uds / 500g)`,
        recipeUsageNote: `Usa ${uds} aguacates en ${recipeCount} recetas`,
        suggestedPacks: mallas,
        commercialUnit: 'Malla (500g)',
      };
    },
  },
  {
    id: 'esparragos_trigueros',
    matchKeywords: ['esparragos', 'esparrago', 'trigueros'],
    commercialName: 'Espárragos verdes trigueros',
    category: 'fruteria',
    packageFormat: 'manojo',
    supermarketTip: 'Frutería: Manojo 1 ud (~250-300g)',
    computeFormat: (qty, _unit, recipeCount) => {
      const manojos = Math.ceil(qty) || 1;
      return {
        commercialFormat: `${manojos} Manojo${manojos > 1 ? 's' : ''} (250g)`,
        recipeUsageNote: `Usa ${qty} manojo en ${recipeCount} recetas`,
        suggestedPacks: manojos,
        commercialUnit: 'Manojo (250g)',
      };
    },
  },
  {
    id: 'calabaza_dados',
    matchKeywords: ['calabaza'],
    commercialName: 'Calabaza pelada en dados o media pieza',
    category: 'fruteria',
    packageFormat: 'pieza',
    supermarketTip: 'Frutería: Media pieza envuelta o bandeja dados 500g',
    computeFormat: (qty, _unit, recipeCount) => {
      const piezas = Math.ceil(qty / 500) || 1;
      return {
        commercialFormat: `${piezas} Media pieza / Bandeja (500g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: piezas,
        commercialUnit: 'Bandeja (500g)',
      };
    },
  },
  {
    id: 'brocoli_pieza',
    matchKeywords: ['brocoli'],
    commercialName: 'Brócoli fresco en film',
    category: 'fruteria',
    packageFormat: 'pieza',
    supermarketTip: 'Frutería: 1 Pieza envuelta (~500g)',
    computeFormat: (qty, _unit, recipeCount) => {
      const piezas = Math.ceil(qty) || 1;
      return {
        commercialFormat: `${piezas} Pieza${piezas > 1 ? 's' : ''} (500g)`,
        recipeUsageNote: `Usa ${qty} pieza en ${recipeCount} recetas`,
        suggestedPacks: piezas,
        commercialUnit: 'Pieza (500g)',
      };
    },
  },
  {
    id: 'limones_malla',
    matchKeywords: ['limon', 'limones', 'lima'],
    commercialName: 'Limones / Limas',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 1kg o piezas sueltas',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Malla (1kg) o 2-3 Uds',
        recipeUsageNote: `Usa ${qty} uds (${recipeCount} recetas)`,
        suggestedPacks: 1,
        commercialUnit: 'Malla (1kg)',
      };
    },
  },
  {
    id: 'ajos',
    matchKeywords: ['dientes de ajo', 'diente de ajo', 'ajos', 'ajo'],
    commercialName: 'Ajos (malla)',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla ajos 4 cabezas',
    computeFormat: (_qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Malla de ajos (4 cabezas)',
        recipeUsageNote: `Usa en ${recipeCount} recetas · Fondo despensa`,
        suggestedPacks: 1,
        commercialUnit: 'Malla (4 cabezas)',
      };
    },
  },
  {
    id: 'perejil',
    matchKeywords: ['perejil fresco', 'perejil'],
    commercialName: 'Perejil fresco',
    category: 'fruteria',
    packageFormat: 'manojo',
    supermarketTip: 'Frutería: Manojo perejil',
    computeFormat: (_qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Manojo de perejil',
        recipeUsageNote: `Usa en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Manojo',
      };
    },
  },
  {
    id: 'tomates_ensalada',
    matchKeywords: ['tomate de ensalada', 'tomate ensalada', 'tomates ensalada'],
    commercialName: 'Tomates de ensalada',
    category: 'fruteria',
    packageFormat: 'malla',
    supermarketTip: 'Frutería: Malla 1kg o 3-4 piezas a granel',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Malla (1kg) / 3-4 uds',
        recipeUsageNote: `Usa ${qty} uds en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Malla (1kg)',
      };
    },
  },

  // --- LÁCTEOS Y HUEVOS (LIDL/ALDI/CONSUM: Mural refrigerados y hueveras) ---
  {
    id: 'huevos_camperos',
    matchKeywords: ['huevo', 'huevos', 'huevos camperos', 'huevo duro', 'huevos duros'],
    commercialName: 'Huevos camperos (Clase M/L)',
    category: 'lacteos',
    packageFormat: 'docena',
    supermarketTip: 'Huevería: Docena (12 uds) o 1/2 Docena (6 uds)',
    computeFormat: (qty, _unit, recipeCount) => {
      const uds = Math.round(qty);
      if (uds <= 6) {
        return {
          commercialFormat: '1 Media Docena (6 uds)',
          recipeUsageNote: `Recetas usan ${uds} huevos (${recipeCount} recetas)`,
          suggestedPacks: 1,
          commercialUnit: 'Media Docena (6 uds)',
        };
      } else if (uds <= 12) {
        return {
          commercialFormat: '1 Docena (12 uds)',
          recipeUsageNote: `Recetas usan ${uds} huevos (${recipeCount} recetas) · Sobran ${12 - uds}`,
          suggestedPacks: 1,
          commercialUnit: 'Docena (12 uds)',
        };
      } else {
        const docenas = Math.ceil(uds / 12);
        return {
          commercialFormat: `${docenas} Docenas (${docenas * 12} uds)`,
          recipeUsageNote: `Recetas usan ${uds} huevos (${recipeCount} recetas)`,
          suggestedPacks: docenas,
          commercialUnit: `Docenas (${docenas * 12} uds)`,
        };
      }
    },
  },
  {
    id: 'quesitos_crema',
    matchKeywords: ['quesitos', 'queso crema'],
    commercialName: 'Quesitos suaves en porciones',
    category: 'lacteos',
    packageFormat: 'pack',
    supermarketTip: 'Mural quesos: Caja redonda 8 o 16 porciones',
    computeFormat: (qty, _unit, recipeCount) => {
      const uds = Math.round(qty);
      return {
        commercialFormat: '1 Caja (8 o 16 porciones)',
        recipeUsageNote: `Usa ${uds} porciones en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Caja (8-16 uds)',
      };
    },
  },
  {
    id: 'queso_lonchas',
    matchKeywords: ['havarti', 'queso en lonchas', 'lonchas'],
    commercialName: 'Queso en lonchas tipo Havarti / Gouda',
    category: 'lacteos',
    packageFormat: 'pack',
    supermarketTip: 'Mural quesos: Pack lonchas 200g (8-10 lonchas)',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Pack lonchas (200g)',
        recipeUsageNote: `Recetas usan ${qty} lonchas (${recipeCount} recetas)`,
        suggestedPacks: 1,
        commercialUnit: 'Pack (200g)',
      };
    },
  },
  {
    id: 'queso_feta',
    matchKeywords: ['queso feta', 'feta'],
    commercialName: 'Queso feta en salmuera',
    category: 'lacteos',
    packageFormat: 'bote',
    supermarketTip: 'Mural quesos: Tarrina/Bloque 200g',
    computeFormat: (qty, _unit, recipeCount) => {
      const packs = Math.ceil(qty / 200) || 1;
      return {
        commercialFormat: `${packs} Tarrina (200g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: packs,
        commercialUnit: 'Tarrina (200g)',
      };
    },
  },
  {
    id: 'queso_mozzarella_rallado',
    matchKeywords: ['mozzarella', 'queso rallado'],
    commercialName: 'Queso mozzarella rallado para gratinar',
    category: 'lacteos',
    packageFormat: 'bolsa',
    supermarketTip: 'Mural quesos: Bolsa 200g rallado',
    computeFormat: (qty, _unit, recipeCount) => {
      const bolsas = Math.ceil(qty / 200) || 1;
      return {
        commercialFormat: `${bolsas} Bolsa (200g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: bolsas,
        commercialUnit: 'Bolsa (200g)',
      };
    },
  },
  {
    id: 'yogur_griego',
    matchKeywords: ['yogur natural', 'yogur griego', 'yogur'],
    commercialName: 'Yogur natural griego sin azúcar',
    category: 'lacteos',
    packageFormat: 'pack',
    supermarketTip: 'Mural lácteos: Pack 4x125g o Tarrina 1kg',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Pack (4x125g) o Tarrina (1kg)',
        recipeUsageNote: `Usa ${qty} ud en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Pack (4x125g)',
      };
    },
  },
  {
    id: 'leche_mantequilla',
    matchKeywords: ['leche entera', 'mantequilla', 'leche'],
    commercialName: 'Leche entera y mantequilla',
    category: 'lacteos',
    packageFormat: 'brik',
    supermarketTip: 'Lácteos: Brik 1L leche + Pastilla mantequilla',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Brik (1L) + Mantequilla',
        recipeUsageNote: `Recetas usan ${qty}ml en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Brik (1L)',
      };
    },
  },

  // --- DESPENSA, PASTAS Y LEGUMBRES (LIDL/ALDI/CONSUM: Pasillos centrales) ---
  {
    id: 'legumbres_garbanzos',
    matchKeywords: ['garbanzos cocidos', 'garbanzos'],
    commercialName: 'Garbanzos cocidos de bote de cristal',
    category: 'despensa',
    packageFormat: 'bote',
    supermarketTip: 'Pasillo legumbres: Bote cristal 400g escurrido / 570g neto',
    computeFormat: (qty, _unit, recipeCount) => {
      const botes = Math.ceil(qty / 400) || 1;
      return {
        commercialFormat: `${botes} Bote${botes > 1 ? 's' : ''} de cristal (400g c/u)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g enjuagados (${recipeCount} recetas)`,
        suggestedPacks: botes,
        commercialUnit: `Bote cristal (400g)`,
      };
    },
  },
  {
    id: 'legumbres_lentejas',
    matchKeywords: ['lentejas pardinas', 'lentejas'],
    commercialName: 'Lentejas pardinas cocidas de bote de cristal',
    category: 'despensa',
    packageFormat: 'bote',
    supermarketTip: 'Pasillo legumbres: Bote cristal 400g escurrido / 570g neto',
    computeFormat: (qty, _unit, recipeCount) => {
      const botes = Math.ceil(qty / 400) || 1;
      return {
        commercialFormat: `${botes} Bote${botes > 1 ? 's' : ''} de cristal (400g c/u)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g enjuagadas (${recipeCount} recetas)`,
        suggestedPacks: botes,
        commercialUnit: `Bote cristal (400g)`,
      };
    },
  },
  {
    id: 'arroz_basmati_jazmin',
    matchKeywords: ['arroz basmati', 'arroz jazmin', 'arroz blanco', 'arroz cocido'],
    commercialName: 'Arroz basmati / jazmín (o vasitos 1 min)',
    category: 'despensa',
    packageFormat: 'pack',
    supermarketTip: 'Pasillo arroces: Paquete 1kg o Pack 2 vasitos microondas (2x125g)',
    computeFormat: (qty, _unit, recipeCount) => {
      const grams = qty;
      if (grams <= 300) {
        return {
          commercialFormat: '1 Pack vasitos microondas (2x125g) o Paquete (1kg)',
          recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} recetas)`,
          suggestedPacks: 1,
          commercialUnit: 'Pack vasitos / Paquete 1kg',
        };
      } else {
        return {
          commercialFormat: '1 Paquete (1kg)',
          recipeUsageNote: `Recetas usan: ${Math.round(grams)}g (${recipeCount} recetas) · Fondo despensa`,
          suggestedPacks: 1,
          commercialUnit: 'Paquete (1kg)',
        };
      }
    },
  },
  {
    id: 'quinoa_vasitos',
    matchKeywords: ['quinoa cocida', 'quinoa'],
    commercialName: 'Quinoa cocida (vasitos 1 min o paquete 500g)',
    category: 'despensa',
    packageFormat: 'pack',
    supermarketTip: 'Pasillo arroces: Pack 2 vasitos rápidos (2x125g)',
    computeFormat: (qty, unit, recipeCount) => {
      const vasitos = unit === 'vasitos' ? qty : Math.ceil(qty / 125);
      const packs = Math.ceil(vasitos / 2) || 1;
      return {
        commercialFormat: `${packs} Pack (2 vasitos / 250g)`,
        recipeUsageNote: `Usa ${vasitos} vasitos en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Pack (2 vasitos)',
      };
    },
  },
  {
    id: 'atun_latas',
    matchKeywords: ['atun claro', 'atun en aceite'],
    commercialName: 'Atún claro en aceite de oliva',
    category: 'despensa',
    packageFormat: 'pack',
    supermarketTip: 'Pasillo conservas: Pack 3 latas (3x80g)',
    computeFormat: (qty, unit, recipeCount) => {
      const latas = unit === 'latas' ? qty : Math.ceil(qty / 60);
      const packs = Math.ceil(latas / 3) || 1;
      return {
        commercialFormat: `${packs} Pack (3 latas)`,
        recipeUsageNote: `Usa ${latas} latas en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Pack (3 latas)',
      };
    },
  },
  {
    id: 'maiz_latas',
    matchKeywords: ['maiz dulce', 'maiz'],
    commercialName: 'Maíz dulce en grano',
    category: 'despensa',
    packageFormat: 'pack',
    supermarketTip: 'Pasillo conservas: Pack 3 latas pequeñas (3x140g)',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Pack (3 latas pequeñas)',
        recipeUsageNote: `Usa ${qty} lata en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Pack (3 latas)',
      };
    },
  },
  {
    id: 'tomate_triturado_frito',
    matchKeywords: ['tomate triturado', 'tomate frito'],
    commercialName: 'Tomate triturado natural',
    category: 'despensa',
    packageFormat: 'brik',
    supermarketTip: 'Pasillo conservas: Brik / Bote 390g-400g',
    computeFormat: (qty, _unit, recipeCount) => {
      const briks = Math.ceil(qty / 400) || 1;
      return {
        commercialFormat: `${briks} Brik / Bote (400g)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: briks,
        commercialUnit: 'Brik (400g)',
      };
    },
  },
  {
    id: 'caldo_brik',
    matchKeywords: ['caldo de pollo', 'caldo de pescado', 'caldo de verduras', 'caldo suave'],
    commercialName: 'Caldo suave (Pollo / Pescado / Verduras)',
    category: 'despensa',
    packageFormat: 'brik',
    supermarketTip: 'Pasillo caldos y sopas: Brik 1L con tapón',
    computeFormat: (qty, _unit, recipeCount) => {
      const briks = Math.ceil(qty / 1000) || 1;
      return {
        commercialFormat: `${briks} Brik (1L)`,
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}ml (${recipeCount} recetas)`,
        suggestedPacks: briks,
        commercialUnit: 'Brik (1L)',
      };
    },
  },
  {
    id: 'tortillas_maiz',
    matchKeywords: ['tortillas 100% de maiz', 'tortillas de maiz', 'tortillas'],
    commercialName: 'Tortillas 100% de maíz (Sin Gluten)',
    category: 'panaderia',
    packageFormat: 'pack',
    supermarketTip: 'Pasillo panadería / tex-mex: Paquete 8 uds',
    computeFormat: (qty, _unit, recipeCount) => {
      const packs = Math.ceil(qty / 8) || 1;
      return {
        commercialFormat: `${packs} Paquete${packs > 1 ? 's' : ''} (8 uds)`,
        recipeUsageNote: `Usa ${qty} tortillas en ${recipeCount} recetas`,
        suggestedPacks: packs,
        commercialUnit: 'Paquete (8 uds)',
      };
    },
  },
  {
    id: 'aceite_oliva',
    matchKeywords: ['aceite de oliva', 'aove', 'aceite'],
    commercialName: 'Aceite de oliva virgen extra',
    category: 'despensa',
    packageFormat: 'brik',
    supermarketTip: 'Pasillo aceites: Botella 1L',
    computeFormat: (_qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Botella (1L) [Revisar despensa]',
        recipeUsageNote: `Usado como base de cocinado en ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Botella (1L)',
      };
    },
  },
  {
    id: 'salsa_soja_tamari',
    matchKeywords: ['salsa de soja', 'tamari'],
    commercialName: 'Salsa de soja sin gluten (Tamari)',
    category: 'despensa',
    packageFormat: 'bote',
    supermarketTip: 'Pasillo salsas / internacional: Botella 250ml',
    computeFormat: (_qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Botella (250ml)',
        recipeUsageNote: `Usa en ${recipeCount} recetas · Fondo despensa`,
        suggestedPacks: 1,
        commercialUnit: 'Botella (250ml)',
      };
    },
  },
  {
    id: 'especias_pimenton_maicena',
    matchKeywords: ['pimenton', 'pimenton dulce', 'maicena', 'laurel', 'oregano', 'ajo en polvo'],
    commercialName: 'Especias (Pimentón dulce, Orégano, Laurel, Maicena)',
    category: 'despensa',
    packageFormat: 'bote',
    supermarketTip: 'Pasillo especias: Bote especias / Paquete maicena',
    computeFormat: (_qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Bote especias / despensa',
        recipeUsageNote: `Condimento para ${recipeCount} recetas`,
        suggestedPacks: 1,
        commercialUnit: 'Bote especias',
      };
    },
  },

  // --- CONGELADOS (LIDL/ALDI/CONSUM: Pasillo de arcones) ---
  {
    id: 'guisantes_congelados',
    matchKeywords: ['guisantes', 'guisantes finos'],
    commercialName: 'Guisantes finos ultracongelados',
    category: 'congelados',
    packageFormat: 'bolsa',
    supermarketTip: 'Pasillo congeladores: Bolsa 500g-1kg',
    computeFormat: (qty, _unit, recipeCount) => {
      return {
        commercialFormat: '1 Bolsa (500g / 1kg)',
        recipeUsageNote: `Recetas usan: ${Math.round(qty)}g (${recipeCount} recetas)`,
        suggestedPacks: 1,
        commercialUnit: 'Bolsa (500g)',
      };
    },
  },
];

export function findRuleForIngredient(ingredientName: string): SupermarketProductRule | null {
  const normName = normalizeText(ingredientName);
  let best: SupermarketProductRule | null = null;
  let bestLen = 0;
  for (const rule of SUPERMARKET_RULES) {
    for (const kw of rule.matchKeywords) {
      const normKw = normalizeText(kw);
      if (!normKw) continue;
      const matches =
        normKw.length <= 3
          ? new RegExp(`(^|[^a-z0-9])${normKw}([^a-z0-9]|$)`).test(normName)
          : normName.includes(normKw);
      if (matches && normKw.length > bestLen) {
        best = rule;
        bestLen = normKw.length;
      }
    }
  }
  return best;
}

export interface GenerateShoppingListOptions {
  existingShoppingList?: ShoppingItem[] | null;
  householdServings?: number;
  pantry?: PantryItem[];
}

function stableItemId(displayName: string, ruleId?: string): string {
  const slug = normalizeText(ruleId || displayName).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `item-${slug.slice(0, 48)}`;
}

export function generateShoppingListFromPlan(
  plan: WeeklyPlan,
  recipes: Recipe[],
  options: GenerateShoppingListOptions | ShoppingItem[] | null = null
): ShoppingItem[] {
  const opts: GenerateShoppingListOptions = Array.isArray(options) || options === null
    ? { existingShoppingList: options }
    : options;
  const existingShoppingList = opts.existingShoppingList || null;
  const householdServings = opts.householdServings ?? 4;
  const pantry = opts.pantry || [];

  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

  const aggregatedMap = new Map<
    string,
    {
      rule: SupermarketProductRule | null;
      rawName: string;
      totalQty: number;
      unit: string;
      category: IngredientCategory;
      recipeSources: Set<string>;
      periods: Set<'weekday' | 'weekend'>;
    }
  >();

  PLAN_DAYS.forEach((dayKey) => {
    const dayPlan = plan.days[dayKey];
    if (!dayPlan) return;

    const isWeekendDay = dayKey === 'sabado' || dayKey === 'domingo';

    if (slotNeedsIngredients(dayPlan.lunch) && dayPlan.lunch?.recipeId) {
      const recipe = recipeMap.get(dayPlan.lunch.recipeId);
      if (recipe) {
        processRecipeIngredients(recipe, isWeekendDay ? 'weekend' : 'weekday');
      }
    }

    if (slotNeedsIngredients(dayPlan.dinner) && dayPlan.dinner?.recipeId) {
      const recipe = recipeMap.get(dayPlan.dinner.recipeId);
      if (recipe) {
        const period: 'weekday' | 'weekend' =
          dayKey === 'viernes' || isWeekendDay ? 'weekend' : 'weekday';
        processRecipeIngredients(recipe, period);
      }
    }
  });

  function processRecipeIngredients(recipe: Recipe, period: 'weekday' | 'weekend') {
    const scale = householdServings / (recipe.servings || 4);
    recipe.ingredients.forEach((ing) => {
      if (isCoveredByPantry(ing.name, pantry)) return;

      const rule = findRuleForIngredient(ing.name);
      const groupKey = rule ? rule.id : normalizeText(ing.name);
      const rawQty = (ing.quantity || 1) * scale;
      const canonical = canonicalAmount(rawQty, ing.unit || '');
      const category = rule ? rule.category : ing.category || 'otros';

      if (aggregatedMap.has(groupKey)) {
        const item = aggregatedMap.get(groupKey)!;
        if (item.unit === canonical.unit) {
          item.totalQty += canonical.qty;
        }
        item.recipeSources.add(recipe.name);
        item.periods.add(period);
      } else {
        aggregatedMap.set(groupKey, {
          rule,
          rawName: ing.name,
          totalQty: canonical.qty,
          unit: canonical.unit,
          category,
          recipeSources: new Set([recipe.name]),
          periods: new Set([period]),
        });
      }
    });
  }

  const generatedItems: ShoppingItem[] = Array.from(aggregatedMap.values()).map((agg) => {
    const recipeNames = Array.from(agg.recipeSources);
    const recipeCount = recipeNames.length;

    let period: 'weekday' | 'weekend' | 'both' = 'weekday';
    if (agg.periods.has('weekday') && agg.periods.has('weekend')) {
      period = 'both';
    } else if (agg.periods.has('weekend')) {
      period = 'weekend';
    }

    let commercialFormat = `${agg.totalQty > 0 ? Math.round(agg.totalQty * 10) / 10 : ''} ${agg.unit}`.trim();
    let recipeUsageNote = `Usado en ${recipeCount} ${recipeCount === 1 ? 'receta' : 'recetas'}`;
    let packageFormat: PackageFormat = 'granel';
    let storeTip = 'Supermercado';
    let displayName = agg.rawName;
    let suggestedPacks = agg.totalQty;
    let commercialUnit = agg.unit;

    if (agg.rule) {
      const comp = agg.rule.computeFormat(agg.totalQty, agg.unit, recipeCount);
      commercialFormat = comp.commercialFormat;
      recipeUsageNote = comp.recipeUsageNote;
      suggestedPacks = comp.suggestedPacks;
      commercialUnit = comp.commercialUnit;
      packageFormat = agg.rule.packageFormat;
      storeTip = agg.rule.supermarketTip;
      displayName = agg.rule.commercialName;
    }

    const itemId = stableItemId(displayName, agg.rule?.id);
    const existing = existingShoppingList?.find(
      (e) =>
        e.id === itemId ||
        normalizeText(e.name) === normalizeText(displayName) ||
        normalizeText(e.name) === normalizeText(agg.rawName)
    );

    return {
      id: itemId,
      name: displayName,
      quantity: suggestedPacks,
      unit: commercialUnit,
      commercialFormat,
      packageFormat,
      recipeUsageNote,
      storeTip,
      category: agg.category,
      checked: existing ? existing.checked : false,
      isCustom: false,
      recipeSource: recipeNames,
      period,
    };
  });

  // Añadir items manuales personalizados
  if (existingShoppingList) {
    existingShoppingList
      .filter((item) => item.isCustom)
      .forEach((customItem) => {
        generatedItems.push({
          ...customItem,
          commercialFormat: customItem.commercialFormat || (customItem.quantity ? `${customItem.quantity} ${customItem.unit || ''}`.trim() : ''),
          packageFormat: customItem.packageFormat || 'granel',
          recipeUsageNote: customItem.recipeUsageNote || 'Artículo manual añadido',
          storeTip: customItem.storeTip || 'Añadido manualmente',
        });
      });
  }

  // Ordenar por orden de pasillos habitual en LIDL/ALDI/Consum
  const categoryOrder: IngredientCategory[] = [
    'fruteria',
    'carniceria',
    'pescaderia',
    'lacteos',
    'despensa',
    'panaderia',
    'congelados',
    'otros',
  ];

  return generatedItems.sort((a, b) => {
    const catComp = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (catComp !== 0) return catComp;
    return a.name.localeCompare(b.name, 'es');
  });
}

// Formatear texto para WhatsApp según el tramo seleccionado y con formato comercial de súper
export function formatShoppingListForShare(
  items: ShoppingItem[],
  weekRange: string,
  period: ShoppingPeriod = 'all'
): string {
  const filteredItems = items.filter((item) => {
    if (period === 'all') return true;
    if (item.isCustom) return true;
    return item.period === period || item.period === 'both';
  });

  const byCategory: Record<string, ShoppingItem[]> = {};
  filteredItems.forEach((item) => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  const periodTitles: Record<ShoppingPeriod, string> = {
    all: `🛒 *LISTA DE LA COMPRA (LIDL / ALDI / CONSUM)* (${weekRange})`,
    weekday: `🏢 *LISTA DE COMPRA: L-V MEDIODÍA* (Tuppers de oficina y comidas de semana)`,
    weekend: `🏠 *LISTA DE COMPRA: FIN DE SEMANA* (Viernes noche a Domingo)`,
  };

  let text = `${periodTitles[period]}\n`;
  text += `_Formatos comerciales por packs y pasillos de supermercado_\n`;
  text += `═════════════════════════════════════\n\n`;

  const categoryEmojis: Record<IngredientCategory, string> = {
    fruteria: '🥦 1. FRUTERÍA Y VERDURAS (Mallas, Bolsas y Frescos)',
    carniceria: '🥩 2. CARNICERÍA Y AVES (Bandejas refrigeradas)',
    pescaderia: '🐟 3. PESCADERÍA (Bandejas y Frescos)',
    lacteos: '🧀 4. LÁCTEOS, HUEVOS Y QUESOS',
    despensa: '🍝 5. DESPENSA, PASTAS Y LEGUMBRES (Botes y Paquetes)',
    panaderia: '🥖 6. PANADERÍA Y DESAYUNOS',
    congelados: '❄️ 7. CONGELADOS',
    otros: '🛒 8. OTROS Y HOGAR',
  };

  const categoryOrder: IngredientCategory[] = [
    'fruteria',
    'carniceria',
    'pescaderia',
    'lacteos',
    'despensa',
    'panaderia',
    'congelados',
    'otros',
  ];

  categoryOrder.forEach((cat) => {
    const catItems = byCategory[cat];
    if (!catItems || catItems.length === 0) return;

    const header = categoryEmojis[cat] || cat.toUpperCase();
    text += `*${header}*\n`;

    catItems.forEach((item) => {
      const checkMark = item.checked ? '☑️ ' : '▫️ ';
      const format = item.commercialFormat ? ` 👉 *${item.commercialFormat}*` : '';
      const usage = item.recipeUsageNote ? ` _(${item.recipeUsageNote})_` : '';
      text += `${checkMark}${item.name}${format}${usage}\n`;
    });
    text += `\n`;
  });

  text += `─────────────────────────────────────\n`;
  text += `🥑 _Planificador Familiar Residuo Cero & Formatos Supermercado_`;
  return text;
}
