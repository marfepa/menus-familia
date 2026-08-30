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
  unit?: string; // ej. 'g', 'kg', 'ml', 'l', 'uds', 'cucharadas', 'latas'
  category: IngredientCategory;
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

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: IngredientCategory;
  checked: boolean;
  isCustom?: boolean;
  recipeSource?: string[]; // Nombres de recetas que requieren este ingrediente
}

export const CATEGORY_LABELS: Record<IngredientCategory, { name: string; emoji: string; color: string }> = {
  fruteria: { name: 'Frutas y Verduras', emoji: '🥦', color: 'emerald' },
  carniceria: { name: 'Carnicería y Aves', emoji: '🥩', color: 'rose' },
  pescaderia: { name: 'Pescadería y Mariscos', emoji: '🐟', color: 'cyan' },
  lacteos: { name: 'Lácteos y Huevos', emoji: '🧀', color: 'amber' },
  despensa: { name: 'Despensa, Pastas y Legumbres', emoji: '🍝', color: 'orange' },
  panaderia: { name: 'Panadería y Cereales', emoji: '🥖', color: 'yellow' },
  congelados: { name: 'Congelados', emoji: '❄️', color: 'blue' },
  otros: { name: 'Otros y Limpieza/Hogar', emoji: '🛒', color: 'purple' },
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
