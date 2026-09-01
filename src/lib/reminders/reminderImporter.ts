import type { ShoppingItem, IngredientCategory, PackageFormat } from '@/types';
import { normalizeText } from '@/lib/shoppingListGenerator';

interface ParsedReminderResult {
  name: string;
  quantity?: number;
  unit?: string;
  category: IngredientCategory;
  commercialFormat?: string;
  packageFormat?: PackageFormat;
  notes?: string;
}

/**
 * Infiere la categoría del supermercado / pasillo a partir del nombre del producto.
 */
export function inferCategory(rawName: string): IngredientCategory {
  const norm = normalizeText(rawName);

  // 1. Pescadería y mariscos
  const fishKeywords = [
    'salmon', 'salmón', 'merluza', 'dorada', 'lubina', 'pescado', 'gambas', 'langostinos',
    'marisco', 'bonito', 'atun fresco', 'bacalao', 'calamar', 'calamares', 'sepia', 'pulpo',
    'mejillones', 'almejas', 'emperador', 'pez espada', 'gulas', 'anchoas', 'sardinas'
  ];
  if (fishKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'pescaderia';
  }

  // 2. Carnicería y aves
  const meatKeywords = [
    'pollo', 'pechuga', 'pechugas', 'muslo', 'muslos', 'alitas', 'pavo', 'ternera',
    'carne picada', 'cerdo', 'lomo', 'cinta de lomo', 'solomillo', 'chuleta', 'chuletas',
    'costillas', 'hamburguesa', 'hamburguesas', 'jamon', 'jamón', 'bacon', 'panceta',
    'salchicha', 'salchichas', 'chorizo', 'morcilla', 'fuet', 'lomo embuchado', 'taquitos de jamon'
  ];
  if (meatKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'carniceria';
  }

  // 3. Congelados
  const frozenKeywords = [
    'congelad', 'ultracongelad', 'helado', 'helados', 'polos', 'hielo',
    'varitas de merluza', 'nuggets congelados', 'guisantes congelados', 'pizza congelada'
  ];
  if (frozenKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'congelados';
  }

  // 4. Frutería y verdulería
  const produceKeywords = [
    'manzana', 'platano', 'plátano', 'banana', 'tomate', 'tomates', 'lechuga', 'espinacas',
    'acelgas', 'calabacin', 'calabacín', 'cebolla', 'cebollas', 'patata', 'patatas',
    'zanahoria', 'zanahorias', 'ajo', 'ajos', 'limon', 'limón', 'naranja', 'naranjas',
    'mandarina', 'mandarinas', 'aguacate', 'aguacates', 'pimiento', 'pimientos', 'puerro',
    'brocoli', 'brócoli', 'coliflor', 'champinon', 'champiñón', 'setas', 'fresas', 'arandanos',
    'arándanos', 'frambuesas', 'fruta', 'verdura', 'pepino', 'berenjena', 'calabaza',
    'esparragos', 'judias verdes', 'perejil', 'cilantro', 'albahaca', 'rucula', 'rúcula'
  ];
  if (produceKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'fruteria';
  }

  // 5. Lácteos y huevos
  const dairyKeywords = [
    'leche', 'yogur', 'yogures', 'queso', 'mozzarella', 'parmesano', 'cheddar', 'gouda',
    'havarti', 'feta', 'nata', 'mantequilla', 'margarina', 'kefir', 'kéfir', 'cuajada',
    'huevo', 'huevos', 'huevos camperos', 'clara de huevo'
  ];
  if (dairyKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'lacteos';
  }

  // 6. Panadería y cereales
  const bakeryKeywords = [
    'pan', 'barra de pan', 'baguette', 'pan de molde', 'pan integral', 'pan hamburguesa',
    'bollo', 'bollos', 'croissant', 'cereales', 'copos de avena', 'avena', 'tostadas',
    'biscottes', 'galletas', 'fajitas', 'tortillas de trigo', 'tortillas mexicanas', 'magdalenas'
  ];
  if (bakeryKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'panaderia';
  }

  // 7. Despensa, pastas, legumbres, salsas
  const pantryKeywords = [
    'arroz', 'pasta', 'espaguetis', 'macarrones', 'fideos', 'tallarines', 'lentejas',
    'garbanzos', 'alubias', 'fabes', 'legumbres', 'aceite', 'aove', 'vinagre', 'sal',
    'pimienta', 'especias', 'oregano', 'pimenton', 'curry', 'comino', 'laurel',
    'tomate frito', 'tomate triturado', 'salsa', 'ketchup', 'mayonesa', 'mostaza',
    'atun en lata', 'atun latas', 'conserva', 'harina', 'azucar', 'azúcar', 'miel',
    'cafe', 'café', 'te', 'té', 'infusion', 'infusión', 'cacao', 'colacao', 'nesquik',
    'chocolate', 'caldo', 'caldo de pollo', 'caldo de verduras', 'levadura', 'frutos secos',
    'nueces', 'almendras', 'cacahuetes', 'anacardos'
  ];
  if (pantryKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'despensa';
  }

  // 8. Otros, droguería y limpieza
  const otherKeywords = [
    'papel higienico', 'papel de cocina', 'servilletas', 'lavavajillas', 'detergente',
    'suavizante', 'lejia', 'lejía', 'estropajo', 'bayeta', 'champu', 'champú', 'gel',
    'jabon', 'jabón', 'pasta de dientes', 'cepillo', 'desodorante', 'bolsas basura',
    'papel aluminio', 'film transparente', 'fregasuelos', 'limpiador', 'pilas', 'panales', 'pañales',
    'toallitas'
  ];
  if (otherKeywords.some((kw) => matchesKeyword(norm, kw))) {
    return 'otros';
  }

  return 'otros';
}

function matchesKeyword(normalizedText: string, keyword: string): boolean {
  const normKw = normalizeText(keyword);
  if (normKw.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${normKw}([^a-z0-9]|$)`).test(normalizedText);
  }
  return normalizedText.includes(normKw);
}

/**
 * Parsea una línea de texto libre de Recordatorios a datos estructurados de ingrediente.
 * Ejemplo: "2 kg de patatas", "1 docena de huevos", "Leche entera (3 briks)", "Pechuga de pollo"
 */
export function parseSingleReminderText(rawLine: string): ParsedReminderResult {
  let text = rawLine.trim();

  // Eliminar prefijos comunes de viñetas o checkboxes
  text = text.replace(/^([•\-\*+]|\d+[\.\)]|\[[ xX]?\]|\([ xX]?\))\s*/, '').trim();

  // Eliminar verbos comunes iniciales de dictado (ej: "Comprar 2 kg de tomates", "Traer leche", "Añadir pan")
  text = text.replace(/^(comprar|traer|anadir|añadir|coger|llevar|pedir|hace\s+falta)\s+/i, '').trim();

  let notes: string | undefined;

  // Extraer notas si están separadas por ::: o — o |
  if (text.includes(':::')) {
    const parts = text.split(':::');
    text = parts[0].trim();
    notes = parts.slice(1).join(' ').trim();
  } else if (text.includes(' — ')) {
    const parts = text.split(' — ');
    text = parts[0].trim();
    notes = parts.slice(1).join(' ').trim();
  }

  // Detectar formato entre paréntesis al final ej: "Leche entera (2L)" o "Huevos (1 docena)"
  let formatInParentheses: string | undefined;
  const parenMatch = text.match(/\(([^)]+)\)$/);
  if (parenMatch) {
    formatInParentheses = parenMatch[1].trim();
    text = text.replace(/\(([^)]+)\)$/, '').trim();
  }

  let quantity: number | undefined;
  let unit: string | undefined;
  let packageFormat: PackageFormat | undefined;
  let commercialFormat: string | undefined = formatInParentheses;

  // Patrones de cantidad + unidad al principio de la línea:
  // Ejemplos: "2 kg de tomates", "500 g carne picada", "3 litros de leche", "1 docena de huevos", "2 botes de garbanzos"
  const qtyPattern = /^(\d+(?:[.,]\d+)?)\s*(kg|kilos?|g|gr|gramos?|l|litros?|ml|uds?|unidades?|docenas?|paquetes?|packs?|bandejas?|mallas?|bolsas?|botes?|briks?|latas?|manojos?|piezas?|barras?|botellas?)?\s*(?:de\s+)?/i;
  const match = text.match(qtyPattern);

  if (match) {
    const rawQtyStr = match[1].replace(',', '.');
    const parsedQty = parseFloat(rawQtyStr);
    const rawUnit = match[2]?.toLowerCase();

    if (!isNaN(parsedQty) && parsedQty > 0) {
      quantity = parsedQty;
      text = text.slice(match[0].length).trim();

      if (rawUnit) {
        if (/^kg|kilos?$/.test(rawUnit)) {
          unit = 'kg';
        } else if (/^g|gr|gramos?$/.test(rawUnit)) {
          unit = 'g';
        } else if (/^l|litros?$/.test(rawUnit)) {
          unit = 'l';
        } else if (/^ml$/.test(rawUnit)) {
          unit = 'ml';
        } else if (/^uds?|unidades?$/.test(rawUnit)) {
          unit = 'uds';
          packageFormat = 'pieza';
        } else if (/^docenas?$/.test(rawUnit)) {
          unit = 'docena';
          packageFormat = 'docena';
          commercialFormat = `${quantity} ${quantity === 1 ? 'docena' : 'docenas'}`;
        } else if (/^bandejas?$/.test(rawUnit)) {
          unit = 'bandeja';
          packageFormat = 'bandeja';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Bandeja' : 'Bandejas'}`;
        } else if (/^mallas?$/.test(rawUnit)) {
          unit = 'malla';
          packageFormat = 'malla';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Malla' : 'Mallas'}`;
        } else if (/^bolsas?$/.test(rawUnit)) {
          unit = 'bolsa';
          packageFormat = 'bolsa';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Bolsa' : 'Bolsas'}`;
        } else if (/^botes?$/.test(rawUnit)) {
          unit = 'bote';
          packageFormat = 'bote';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Bote' : 'Botes'}`;
        } else if (/^briks?$/.test(rawUnit)) {
          unit = 'brik';
          packageFormat = 'brik';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Brik' : 'Briks'}`;
        } else if (/^latas?$/.test(rawUnit)) {
          unit = 'lata';
          packageFormat = 'pack';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Lata' : 'Latas'}`;
        } else if (/^manojos?$/.test(rawUnit)) {
          unit = 'manojo';
          packageFormat = 'manojo';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Manojo' : 'Manojos'}`;
        } else if (/^paquetes?|packs?$/.test(rawUnit)) {
          unit = 'pack';
          packageFormat = 'pack';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Pack' : 'Packs'}`;
        } else if (/^botellas?$/.test(rawUnit)) {
          unit = 'botella';
          packageFormat = 'brik';
          commercialFormat = `${quantity} ${quantity === 1 ? 'Botella' : 'Botellas'}`;
        }
      }
    }
  }

  // Capitalizar nombre
  const cleanedName = text.charAt(0).toUpperCase() + text.slice(1);
  const category = inferCategory(cleanedName);

  return {
    name: cleanedName || rawLine.trim(),
    quantity,
    unit: unit || (quantity ? 'uds' : undefined),
    category,
    commercialFormat,
    packageFormat,
    notes,
  };
}

function extractTitleAndNotesFromObject(obj: Record<string, unknown>): { title: string; notes?: string } {
  const titleKeys = ['title', 'name', 'text', 'summary', 'value', 'item', 'content', 'label'];
  const noteKeys = ['notes', 'note', 'description', 'body', 'details'];

  let title = '';
  let notes: string | undefined;

  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase().trim();
    if (!title && titleKeys.includes(k) && typeof val === 'string' && val.trim()) {
      title = val.trim();
    }
    if (!notes && noteKeys.includes(k) && typeof val === 'string' && val.trim()) {
      notes = val.trim();
    }
  }

  if (!title) {
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.trim()) {
        title = val.trim();
        break;
      }
    }
  }

  return { title, notes };
}

/**
 * Parsea un payload flexible recibido de Atajos de Apple / Siri / Webhook.
 */
export function parseRemindersPayload(payload: unknown): ShoppingItem[] {
  if (!payload) return [];

  // Si llega como string pero contiene JSON (ej. array o diccionario serializado)
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsedJson = JSON.parse(trimmed);
        return parseRemindersPayload(parsedJson);
      } catch {
        // Continuar como texto plano si falla JSON.parse
      }
    }
    const rawLines = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return buildShoppingItemsFromLines(rawLines);
  }

  const rawLines: string[] = [];

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (typeof item === 'string') {
        rawLines.push(...item.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
      } else if (item && typeof item === 'object') {
        const { title, notes } = extractTitleAndNotesFromObject(item as Record<string, unknown>);
        if (title) {
          rawLines.push(notes ? `${title} — ${notes}` : title);
        }
      }
    }
    return buildShoppingItemsFromLines(rawLines);
  }

  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;

    // Buscar campos contenedores independientemente de mayúsculas/minúsculas
    for (const [key, val] of Object.entries(obj)) {
      const k = key.toLowerCase().trim();
      if (
        ['items', 'reminders', 'recordatorios', 'list', 'lista', 'data', 'productos', 'ingredients'].includes(k)
      ) {
        return parseRemindersPayload(val);
      }
      if (['text', 'texto', 'input', 'body'].includes(k) && typeof val === 'string') {
        return parseRemindersPayload(val);
      }
    }

    // Si es un único objeto de recordatorio { Title: "..." }
    const { title, notes } = extractTitleAndNotesFromObject(obj);
    if (title) {
      return buildShoppingItemsFromLines([notes ? `${title} — ${notes}` : title]);
    }
  }

  return [];
}

function buildShoppingItemsFromLines(rawLines: string[]): ShoppingItem[] {
  const items: ShoppingItem[] = [];
  const now = Date.now();

  rawLines.forEach((line, idx) => {
    if (!line) return;
    const parsed = parseSingleReminderText(line);
    if (!parsed.name) return;

    items.push({
      id: `custom-reminders-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      commercialFormat: parsed.commercialFormat,
      packageFormat: parsed.packageFormat,
      storeTip: parsed.notes,
      category: parsed.category,
      checked: false,
      isCustom: true,
      period: 'weekday',
    });
  });

  return items;
}

/**
 * Fusiona los nuevos elementos importados con la lista de la compra existente.
 * Si un producto con el mismo nombre ya existe, lo actualiza a pendiente si estaba marcado.
 */
export function mergeImportedItemsIntoShoppingList(
  currentList: ShoppingItem[] = [],
  newItems: ShoppingItem[] = []
): { updatedList: ShoppingItem[]; addedCount: number } {
  const list = [...currentList];
  let addedCount = 0;

  for (const newItem of newItems) {
    const normNewName = normalizeText(newItem.name);
    const existingIndex = list.findIndex((item) => normalizeText(item.name) === normNewName);

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      // Si ya existía pero estaba comprado, desmarcarlo
      const updatedItem: ShoppingItem = {
        ...existing,
        checked: false,
        quantity: newItem.quantity && existing.quantity && existing.unit === newItem.unit
          ? existing.quantity + newItem.quantity
          : existing.quantity || newItem.quantity,
        commercialFormat: newItem.commercialFormat || existing.commercialFormat,
        storeTip: newItem.storeTip || existing.storeTip,
      };
      list[existingIndex] = updatedItem;
      addedCount++;
    } else {
      list.push(newItem);
      addedCount++;
    }
  }

  return { updatedList: list, addedCount };
}
