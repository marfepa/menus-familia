export type MealType = 'lunch' | 'dinner' | 'breakfast' | 'snack' | 'both';

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export type IngredientCategory =
  | 'fruteria'
  | 'carniceria'
  | 'pescaderia'
  | 'lacteos'
  | 'despensa'
  | 'panaderia'
  | 'congelados'
  | 'otros';

export interface Ingredient {
  id: string;
  name: string;
  quantity?: number;
  unit?: string; // ej. 'g', 'kg', 'ml', 'l', 'uds', 'cucharadas', 'latas', 'bandeja', 'bolsa', 'malla'
  category: IngredientCategory;
  packNote?: string; // ej. "1 bolsa (1kg) - usado en 2 recetas"
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTimeMinutes: number;
  servings: number;
  mealType: MealType;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  rating: number; // 1 a 5
  favorite?: boolean;
  notes?: string;
  emoji?: string;
  difficulty?: 'Fácil' | 'Media' | 'Avanzada';
  
  // Nuevos campos de optimización familiar
  kidsNotes?: string; // Adaptación específica para bebé que empieza sólidos (BLW) y niño que come poco
  isTupperFriendly?: boolean; // Apto para llevar en tupper al trabajo y recalentar
  batchCooking?: boolean; // Se puede cocinar cantidad doble para comer varios días
  fridgeLifeDays?: number; // Días que aguanta en nevera (ej. 3 días)
}

export interface MealSlotData {
  recipeId?: string;
  customName?: string;
  notes?: string;
}

export interface DayPlan {
  lunch?: MealSlotData;
  dinner?: MealSlotData;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string; // Formato YYYY-MM-DD del lunes
  days: {
    lunes: DayPlan;
    martes: DayPlan;
    miercoles: DayPlan;
    jueves: DayPlan;
    viernes: DayPlan;
    sabado: DayPlan;
    domingo: DayPlan;
  };
}

export type ShoppingPeriod = 'all' | 'weekday' | 'weekend';

export type PackageFormat =
  | 'bandeja'
  | 'malla'
  | 'bolsa'
  | 'bote'
  | 'docena'
  | 'brik'
  | 'pack'
  | 'manojo'
  | 'pieza'
  | 'granel';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  commercialFormat?: string; // ej. "1 Bandeja (~500g)", "1 Malla (2kg)", "1 Docena (12 uds)"
  packageFormat?: PackageFormat; // Para badge visual
  recipeUsageNote?: string; // ej. "Usado en recetas: 350g (2 recetas)"
  storeTip?: string; // ej. "Lidl/Aldi/Consum: Mural carnicería / atmósfera protectora"
  category: IngredientCategory;
  checked: boolean;
  isCustom?: boolean;
  recipeSource?: string[]; // Nombres de recetas que requieren este ingrediente
  period?: 'weekday' | 'weekend' | 'both'; // Para filtrar por tramo de compra
}

export const PACKAGE_FORMAT_CONFIG: Record<
  PackageFormat,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  bandeja: { label: 'Bandeja', emoji: '📦', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  malla: { label: 'Malla', emoji: '🛍️', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  bolsa: { label: 'Bolsa', emoji: '🛍️', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  bote: { label: 'Bote cristal', emoji: '🫙', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  docena: { label: 'Docena', emoji: '🥚', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  brik: { label: 'Brik', emoji: '🧃', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  pack: { label: 'Pack', emoji: '🎁', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  manojo: { label: 'Manojo', emoji: '🌿', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  pieza: { label: 'Pieza', emoji: '🏷️', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  granel: { label: 'A granel', emoji: '⚖️', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const CATEGORY_LABELS: Record<IngredientCategory, { name: string; emoji: string; color: string; aisleTip: string }> = {
  fruteria: { name: 'Frutas y Verduras', emoji: '🥦', color: 'emerald', aisleTip: 'Entrada y mural de frescos' },
  carniceria: { name: 'Carnicería y Aves', emoji: '🥩', color: 'rose', aisleTip: 'Mural refrigerado (bandejas protegidas)' },
  pescaderia: { name: 'Pescadería y Mariscos', emoji: '🐟', color: 'cyan', aisleTip: 'Mural refrigerado / Mostrador fresco' },
  lacteos: { name: 'Lácteos y Huevos', emoji: '🧀', color: 'amber', aisleTip: 'Mural de refrigerados y quesos' },
  despensa: { name: 'Despensa, Pastas y Legumbres', emoji: '🍝', color: 'orange', aisleTip: 'Pasillos centrales' },
  panaderia: { name: 'Panadería y Cereales', emoji: '🥖', color: 'yellow', aisleTip: 'Horno / Desayunos' },
  congelados: { name: 'Congelados', emoji: '❄️', color: 'blue', aisleTip: 'Pasillo de arcones y congeladores' },
  otros: { name: 'Otros y Limpieza/Hogar', emoji: '🛒', color: 'purple', aisleTip: 'Pasillo droguería y hogar' },
};

export const DAYS_CONFIG: Array<{ id: DayOfWeek; label: string; short: string }> = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
  { id: 'sabado', label: 'Sábado', short: 'Sáb' },
  { id: 'domingo', label: 'Domingo', short: 'Dom' },
];
