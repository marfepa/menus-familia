import { Recipe, WeeklyPlan, ShoppingItem, IngredientCategory, DayOfWeek } from '@/types';

// Normalizar nombres de ingredientes para agrupar (ej. "Cebolla", "cebollas", "Cebolla dulce")
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
  }>();

  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  days.forEach((dayKey) => {
    const dayPlan = plan.days[dayKey];
    if (!dayPlan) return;

    // Procesar comida y cena
    ['lunch', 'dinner'].forEach((mealKey) => {
      const meal = dayPlan[mealKey as 'lunch' | 'dinner'];
      if (!meal || !meal.recipeId) return;

      const recipe = recipeMap.get(meal.recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach((ing) => {
        const normName = normalizeIngredientName(ing.name);
        const unit = ing.unit || '';
        const category = ing.category || 'otros';
        const key = `${normName}|${unit}|${category}`;

        if (itemsMap.has(key)) {
          const item = itemsMap.get(key)!;
          if (ing.quantity && item.quantity !== undefined) {
            item.quantity += ing.quantity;
          }
          item.recipeSources.add(recipe.name);
        } else {
          itemsMap.set(key, {
            id: `item-${Math.random().toString(36).substring(2, 9)}`,
            name: ing.name, // Mantener el nombre original capitalizado
            quantity: ing.quantity || 0,
            unit: ing.unit,
            category: category,
            recipeSources: new Set([recipe.name]),
          });
        }
      });
    });
  });

  // Convertir a lista final
  const generatedItems: ShoppingItem[] = Array.from(itemsMap.values()).map(item => {
    // Si ya existía en la lista y estaba marcado como checked, preservar el estado
    const existing = existingShoppingList?.find(
      e => normalizeIngredientName(e.name) === normalizeIngredientName(item.name)
    );

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity > 0 ? item.quantity : undefined,
      unit: item.unit,
      category: item.category,
      checked: existing ? existing.checked : false,
      isCustom: false,
      recipeSource: Array.from(item.recipeSources),
    };
  });

  // Añadir items manuales/personalizados que ya estuvieran en la lista existente
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

// Formatear texto para WhatsApp o portapapeles
export function formatShoppingListForShare(items: ShoppingItem[], weekRange: string): string {
  const byCategory: Record<string, ShoppingItem[]> = {};

  items.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  let text = `🛒 *LISTA DE LA COMPRA (${weekRange})*\n`;
  text += `═══════════════════════════\n\n`;

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

  text += `_Generado con el Planificador de Menús Familiar_ ✨`;
  return text;
}
