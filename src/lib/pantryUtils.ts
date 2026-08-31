import type { DynamicPantryItem, IngredientCategory, ShoppingItem, ExcludedFoodItem } from '@/types';
import { normalizeText } from '@/lib/shoppingListGenerator';

export const DEFAULT_CATEGORY_SHELF_LIFE: Record<IngredientCategory, number> = {
  pescaderia: 3,
  carniceria: 4,
  fruteria: 7,
  lacteos: 21,
  panaderia: 5,
  despensa: 120,
  congelados: 180,
  otros: 365,
};

const SPECIFIC_SHELF_LIFE_RULES: Array<{ keywords: string[]; days: number }> = [
  { keywords: ['salmon', 'merluza', 'dorada', 'lubina', 'pescado', 'gambas', 'langostinos', 'marisco', 'bonito', 'atun fresco'], days: 3 },
  { keywords: ['carne picada', 'pollo picado', 'hamburguesas'], days: 2 },
  { keywords: ['pechuga de pollo', 'pavo', 'ternera', 'cerdo', 'lomo de cerdo', 'cinta de lomo', 'pollo'], days: 4 },
  { keywords: ['espinacas', 'lechuga', 'champinones', 'fresas'], days: 4 },
  { keywords: ['calabacin', 'pimiento', 'aguacate', 'brocoli', 'tomate', 'esparragos', 'judias verdes'], days: 6 },
  { keywords: ['pan de molde', 'tortillas de trigo', 'pan'], days: 7 },
  { keywords: ['zanahoria', 'manzana', 'naranja', 'limon'], days: 14 },
  { keywords: ['yogur', 'leche'], days: 14 },
  { keywords: ['queso tierno', 'queso lonchas', 'havarti', 'gouda', 'mozzarella', 'feta'], days: 18 },
  { keywords: ['patatas', 'cebollas', 'ajos', 'calabaza'], days: 21 },
  { keywords: ['huevos', 'huevo', 'huevos camperos'], days: 28 },
  { keywords: ['queso curado', 'parmesano'], days: 45 },
  { keywords: ['caldo', 'tomate frito', 'tomate triturado', 'salsa'], days: 90 },
  { keywords: ['arroz', 'pasta', 'lentejas', 'garbanzos', 'alubias', 'legumbres', 'conserva', 'bote', 'atun latas'], days: 180 },
  { keywords: ['aceite', 'aove', 'sal', 'especias', 'oregano', 'pimenton', 'laurel', 'pimienta'], days: 365 },
];

export function getEstimatedShelfLifeDays(name: string, category?: IngredientCategory): number {
  const norm = normalizeText(name);
  for (const rule of SPECIFIC_SHELF_LIFE_RULES) {
    const matched = rule.keywords.some((kw) => {
      const normKw = normalizeText(kw);
      if (normKw.length <= 3) {
        return new RegExp(`(^|[^a-z0-9])${normKw}([^a-z0-9]|$)`).test(norm);
      }
      return norm.includes(normKw);
    });
    if (matched) {
      return rule.days;
    }
  }
  if (category && DEFAULT_CATEGORY_SHELF_LIFE[category]) {
    return DEFAULT_CATEGORY_SHELF_LIFE[category];
  }
  return 14;
}

export interface ShelfLifeBatteryInfo {
  elapsedDays: number;
  daysRemaining: number;
  totalDays: number;
  percentRemaining: number;
  status: 'fresh' | 'medium' | 'critical' | 'expired';
  label: string;
  isExpired: boolean;
  colorClass: string;
  gradientClass: string;
}

export function calculateShelfLifeInfo(
  item: DynamicPantryItem,
  referenceDateStr?: string
): ShelfLifeBatteryInfo {
  const totalDays = Math.max(1, item.shelfLifeDays || getEstimatedShelfLifeDays(item.name, item.category));
  const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
  
  let elapsedDays = 0;
  if (item.addedDate) {
    const added = new Date(item.addedDate);
    const diffTime = today.getTime() - added.getTime();
    elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  const daysRemaining = totalDays - elapsedDays;
  const isExpired = daysRemaining <= 0;
  const percentRemaining = isExpired
    ? 0
    : Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)));

  let status: 'fresh' | 'medium' | 'critical' | 'expired' = 'fresh';
  let label = 'Fresco';
  let colorClass = 'text-emerald-600';
  let gradientClass = 'from-emerald-400 via-emerald-500 to-teal-500';

  if (isExpired) {
    status = 'expired';
    label = daysRemaining === 0 ? 'Caduca hoy' : `Caducado (${Math.abs(daysRemaining)}d)`;
    colorClass = 'text-rose-600';
    gradientClass = 'from-rose-500 to-red-600';
  } else if (daysRemaining <= 1 || percentRemaining <= 20) {
    status = 'critical';
    label = daysRemaining === 1 ? '1 día restante' : `${daysRemaining} días`;
    colorClass = 'text-orange-600';
    gradientClass = 'from-orange-400 via-orange-500 to-rose-500';
  } else if (daysRemaining <= 3 || percentRemaining <= 50) {
    status = 'medium';
    label = `${daysRemaining} días restantes`;
    colorClass = 'text-amber-600';
    gradientClass = 'from-amber-400 via-amber-500 to-yellow-500';
  } else {
    status = 'fresh';
    label = totalDays >= 90 ? 'Larga duración' : `${daysRemaining} días restantes`;
    colorClass = 'text-emerald-600';
    gradientClass = 'from-emerald-400 via-teal-500 to-emerald-600';
  }

  return {
    elapsedDays,
    daysRemaining,
    totalDays,
    percentRemaining,
    status,
    label,
    isExpired,
    colorClass,
    gradientClass,
  };
}

export function extractMatchKeywords(name: string): string[] {
  const norm = normalizeText(name);
  const words = norm.split(/\s+/).filter((w) => w.length > 2);
  const keywords = new Set<string>([norm]);
  words.forEach((w) => keywords.add(w));
  return Array.from(keywords);
}

export function createPantryItemFromShopping(
  item: ShoppingItem,
  addedDateStr?: string
): DynamicPantryItem {
  const todayStr = addedDateStr || new Date().toISOString().slice(0, 10);
  const shelfLifeDays = getEstimatedShelfLifeDays(item.name, item.category);

  return {
    id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: item.name,
    category: item.category,
    inStock: true,
    addedDate: todayStr,
    shelfLifeDays,
    quantity: item.quantity,
    unit: item.unit,
    commercialFormat: item.commercialFormat,
    packageFormat: item.packageFormat,
    matchKeywords: extractMatchKeywords(item.name),
    source: 'shopping_list',
  };
}

export function matchesExcludedFood(textToSearch: string, excludedFoods: ExcludedFoodItem[] = []): ExcludedFoodItem | undefined {
  if (!excludedFoods || excludedFoods.length === 0) return undefined;
  const normText = normalizeText(textToSearch);

  return excludedFoods.find((excluded) => {
    const normExcludedName = normalizeText(excluded.name);
    if (normExcludedName.length > 2 && normText.includes(normExcludedName)) {
      return true;
    }
    return excluded.matchKeywords.some((kw) => {
      const normKw = normalizeText(kw);
      if (normKw.length <= 3) {
        return new RegExp(`(^|[^a-z0-9])${normKw}([^a-z0-9]|$)`).test(normText);
      }
      return normText.includes(normKw);
    });
  });
}

export function getPantryZoneForItem(item: Partial<DynamicPantryItem>): import('@/types').PantryZone {
  if (item.category === 'congelados') return 'congelador';
  if (item.category === 'fruteria') return 'frescos';
  if (item.category === 'panaderia') return 'panera';
  if (item.category === 'carniceria' || item.category === 'pescaderia' || item.category === 'lacteos') return 'nevera';
  if (item.category === 'despensa') return 'despensa_seca';

  const norm = normalizeText(item.name || '');
  if (/congelad|helad|hielo/i.test(norm)) return 'congelador';
  if (/pan|molde|tostad|avena|cereal|fajita|tortilla/i.test(norm)) return 'panera';
  if (/pollo|carne|ternera|cerdo|salmon|merluza|pescado|gamba|marisco|yogur|queso|leche|huevo|embutido|jamon/i.test(norm)) return 'nevera';
  if (/tomate|calabacin|pimiento|cebolla|patata|platano|manzana|naranja|limon|lechuga|espinaca|fruta|verdura/i.test(norm)) return 'frescos';

  return 'despensa_seca';
}


