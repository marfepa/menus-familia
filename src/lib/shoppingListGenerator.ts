import { Recipe, WeeklyPlan, ShoppingItem, IngredientCategory, DayOfWeek, ShoppingPeriod } from '@/types';

// Normalizar nombres de ingredientes para agrupar
function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

export function generateShoppingListFromPlan(
  plan: WeeklyPlan,
  recipes: Recipe[],
  existingShoppingList: ShoppingItem[] | null = null
): ShoppingItem[] {
  const recipeMap = new Map<string, Recipe>(recipes.map(r => [r.id, r]));
  
  // Mapa de clave de agregación: "nombre_normalizado|unidad|categoria" -> ShoppingItem
  const itemsMap = new Map<string, {
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    category: IngredientCategory;
    recipeSources: Set<string>;
    periods: Set<'weekday' | 'weekend'>;
  }>();

  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  days.forEach((dayKey) => {
    const dayPlan = plan.days[dayKey];
    if (!dayPlan) return;

    const isWeekendDay = dayKey === 'sabado' || dayKey === 'domingo';

    // Comida
    if (dayPlan.lunch?.recipeId) {
      const recipe = recipeMap.get(dayPlan.lunch.recipeId);
      if (recipe) {
        const period: 'weekday' | 'weekend' = isWeekendDay ? 'weekend' : 'weekday';
        addRecipeIngredients(recipe, period, itemsMap);
      }
    }

    // Cena (Viernes noche cuenta para fin de semana)
    if (dayPlan.dinner?.recipeId) {
      const recipe = recipeMap.get(dayPlan.dinner.recipeId);
      if (recipe) {
        const period: 'weekday' | 'weekend' = (dayKey === 'viernes' || isWeekendDay) ? 'weekend' : 'weekday';
        addRecipeIngredients(recipe, period, itemsMap);
      }
    }
  });

  function addRecipeIngredients(
    recipe: Recipe,
    period: 'weekday' | 'weekend',
    map: typeof itemsMap
  ) {
    recipe.ingredients.forEach((ing) => {
      const normName = normalizeIngredientName(ing.name);
      const unit = ing.unit || '';
      const category = ing.category || 'otros';
      const key = `${normName}|${unit}|${category}`;

      if (map.has(key)) {
        const item = map.get(key)!;
        if (ing.quantity && item.quantity !== undefined) {
          item.quantity += ing.quantity;
        }
        item.recipeSources.add(recipe.name);
        item.periods.add(period);
      } else {
        map.set(key, {
          id: `item-${Math.random().toString(36).substring(2, 9)}`,
          name: ing.name,
          quantity: ing.quantity || 0,
          unit: ing.unit,
          category: category,
          recipeSources: new Set([recipe.name]),
          periods: new Set([period]),
        });
      }
    });
  }

  // Convertir a lista final
  const generatedItems: ShoppingItem[] = Array.from(itemsMap.values()).map(item => {
    const existing = existingShoppingList?.find(
      e => normalizeIngredientName(e.name) === normalizeIngredientName(item.name)
    );

    let period: 'weekday' | 'weekend' | 'both' = 'weekday';
    if (item.periods.has('weekday') && item.periods.has('weekend')) {
      period = 'both';
    } else if (item.periods.has('weekend')) {
      period = 'weekend';
    }

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity > 0 ? item.quantity : undefined,
      unit: item.unit,
      category: item.category,
      checked: existing ? existing.checked : false,
      isCustom: false,
      recipeSource: Array.from(item.recipeSources),
      period,
    };
  });

  // Añadir items manuales personalizados existentes
  if (existingShoppingList) {
    existingShoppingList
      .filter(item => item.isCustom)
      .forEach(customItem => {
        generatedItems.push(customItem);
      });
  }

  // Ordenar por categoría y luego alfabéticamente
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

// Formatear texto para WhatsApp según el tramo seleccionado
export function formatShoppingListForShare(
  items: ShoppingItem[],
  weekRange: string,
  period: ShoppingPeriod = 'all'
): string {
  const filteredItems = items.filter(item => {
    if (period === 'all') return true;
    if (item.isCustom) return true;
    return item.period === period || item.period === 'both';
  });

  const byCategory: Record<string, ShoppingItem[]> = {};
  filteredItems.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  const periodTitles: Record<ShoppingPeriod, string> = {
    all: `🛒 *LISTA DE LA COMPRA SEMANAL* (${weekRange})`,
    weekday: `🏢 *LISTA DE COMPRA: LUNES A VIERNES MEDIODÍA* (Semana laboral y tuppers)`,
    weekend: `🏠 *LISTA DE COMPRA: FIN DE SEMANA* (Viernes noche a Domingo)`,
  };

  let text = `${periodTitles[period]}\n`;
  text += `═════════════════════════════\n\n`;

  const categoryEmojis: Record<IngredientCategory, string> = {
    fruteria: '🥦 FRUTERÍA Y VERDURAS',
    carniceria: '🥩 CARNICERÍA Y AVES',
    pescaderia: '🐟 PESCADERÍA',
    lacteos: '🧀 LÁCTEOS Y HUEVOS',
    despensa: '🍝 DESPENSA Y PASTAS',
    panaderia: '🥖 PANADERÍA',
    congelados: '❄️ CONGELADOS',
    otros: '🛒 OTROS Y HOGAR',
  };

  Object.entries(byCategory).forEach(([cat, catItems]) => {
    const header = categoryEmojis[cat as IngredientCategory] || cat.toUpperCase();
    text += `*${header}*\n`;
    catItems.forEach(item => {
      const checkMark = item.checked ? '✓ ' : '▫️ ';
      const qty = item.quantity ? ` (${item.quantity}${item.unit ? ' ' + item.unit : ''})` : '';
      text += `${checkMark}${item.name}${qty}\n`;
    });
    text += `\n`;
  });

  text += `_Planificador Familiar Residuo Cero & Batch Cooking_ 🥑`;
  return text;
}
