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
  isAirFryerFriendly?: boolean; // Apto / optimizado para freidora de aire (Air-Fryer)
  airFryerConfig?: {
    temperatureDegrees?: number; // ej. 180, 200
    timeMinutes?: number; // ej. 12, 15
    shakeHalfway?: boolean; // Agitar cesta a mitad de cocinado
  };
}

export type MealSlotKind = 'recipe' | 'custom' | 'out' | 'leftover';

export type GenerateMode = 'full' | 'dinners' | 'tuppers';

export interface MealSlotData {
  kind?: MealSlotKind;
  recipeId?: string;
  customName?: string;
  notes?: string;
  leftoverFromDay?: DayOfWeek;
  leftoverFromMeal?: 'lunch' | 'dinner';
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

export interface DynamicPantryItem {
  id: string;
  name: string;
  inStock: boolean;
  matchKeywords: string[];
  category?: IngredientCategory;
  addedDate?: string; // Formato YYYY-MM-DD
  shelfLifeDays?: number; // Días estimados de duración óptima
  quantity?: number;
  unit?: string;
  commercialFormat?: string;
  packageFormat?: PackageFormat;
  source?: 'shopping_list' | 'manual' | 'staple';
}

export type PantryItem = DynamicPantryItem;

export interface ExcludedFoodItem {
  id: string;
  name: string;
  matchKeywords: string[];
  reason?: string; // ej. "Alergia/Intolerancia", "No gusta a los niños", "Preferencia"
  addedDate: string;
}

export interface AppSettings {
  householdServings: number;
  generateMode: GenerateMode;
  excludedFoods?: ExcludedFoodItem[];
  prioritizeAirFryerDinners?: boolean;
  prioritizeMeatOverFish?: boolean;
  maxFishMealsPerWeek?: number;
  maxPastaMealsPerWeek?: number;
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

export type PantryZone = 'nevera' | 'frescos' | 'despensa_seca' | 'panera' | 'congelador';

export interface PantryZoneConfig {
  id: PantryZone;
  name: string;
  subtitle: string;
  emoji: string;
  temperatureTip: string;
  color: string;
  bgGradient: string;
  borderClass: string;
  categories: IngredientCategory[];
  quickPresets: Array<{ name: string; category: IngredientCategory; shelfLifeDays: number; defaultFormat?: string }>;
}

export const PANTRY_ZONES_CONFIG: Record<PantryZone, PantryZoneConfig> = {
  nevera: {
    id: 'nevera',
    name: 'Nevera / Refrigerador',
    subtitle: 'Carnes, pescados frescos, lácteos, huevos y refrigerados',
    emoji: '🧊',
    temperatureTip: 'Zona fría (2°C – 4°C)',
    color: 'cyan',
    bgGradient: 'from-cyan-950/50 via-slate-900 to-sky-950/40',
    borderClass: 'border-cyan-500/30',
    categories: ['carniceria', 'pescaderia', 'lacteos'],
    quickPresets: [
      { name: 'Pechuga de pollo', category: 'carniceria', shelfLifeDays: 4, defaultFormat: '500g (Bandeja)' },
      { name: 'Salmón fresco', category: 'pescaderia', shelfLifeDays: 3, defaultFormat: '2 lomos (Bandeja)' },
      { name: 'Huevos camperos', category: 'lacteos', shelfLifeDays: 28, defaultFormat: '1 docena' },
      { name: 'Queso rallado / lonchas', category: 'lacteos', shelfLifeDays: 18, defaultFormat: '200g' },
      { name: 'Yogures naturales', category: 'lacteos', shelfLifeDays: 14, defaultFormat: 'Pack 4 uds' },
    ],
  },
  frescos: {
    id: 'frescos',
    name: 'Cajón de Frescos & Verdulería',
    subtitle: 'Verduras, frutas, hortalizas y hierbas frescas',
    emoji: '🥬',
    temperatureTip: 'Cajón de alta humedad (6°C – 8°C)',
    color: 'emerald',
    bgGradient: 'from-emerald-950/50 via-slate-900 to-teal-950/40',
    borderClass: 'border-emerald-500/30',
    categories: ['fruteria'],
    quickPresets: [
      { name: 'Calabacines verdes', category: 'fruteria', shelfLifeDays: 6, defaultFormat: '2-3 piezas' },
      { name: 'Plátanos de Canarias', category: 'fruteria', shelfLifeDays: 5, defaultFormat: '1 kg' },
      { name: 'Tomates ensalada', category: 'fruteria', shelfLifeDays: 6, defaultFormat: '500g' },
      { name: 'Zanahorias', category: 'fruteria', shelfLifeDays: 14, defaultFormat: '1 bolsa (1kg)' },
      { name: 'Espinacas frescas', category: 'fruteria', shelfLifeDays: 4, defaultFormat: 'Bolsa 300g' },
      { name: 'Patatas y Cebollas', category: 'fruteria', shelfLifeDays: 21, defaultFormat: 'Malla 2kg' },
    ],
  },
  despensa_seca: {
    id: 'despensa_seca',
    name: 'Despensa Seca & Armarios',
    subtitle: 'Legumbres, arroz, pastas, conservas, aceites y especias',
    emoji: '🥫',
    temperatureTip: 'Lugar fresco y seco (15°C – 20°C)',
    color: 'amber',
    bgGradient: 'from-amber-950/50 via-slate-900 to-orange-950/40',
    borderClass: 'border-amber-500/30',
    categories: ['despensa', 'otros'],
    quickPresets: [
      { name: 'Garbanzos cocidos', category: 'despensa', shelfLifeDays: 180, defaultFormat: 'Bote 400g' },
      { name: 'Lentejas cocidas', category: 'despensa', shelfLifeDays: 180, defaultFormat: 'Bote 400g' },
      { name: 'Arroz redondo', category: 'despensa', shelfLifeDays: 180, defaultFormat: 'Paquete 1kg' },
      { name: 'Pasta integral', category: 'despensa', shelfLifeDays: 180, defaultFormat: 'Paquete 500g' },
      { name: 'Aceite de Oliva Virgen Extra (AOVE)', category: 'despensa', shelfLifeDays: 365, defaultFormat: 'Botella 1L' },
      { name: 'Tomate triturado / frito', category: 'despensa', shelfLifeDays: 90, defaultFormat: 'Bote 400g' },
      { name: 'Atún en lata (AOVE)', category: 'despensa', shelfLifeDays: 365, defaultFormat: 'Pack 3 latas' },
    ],
  },
  panera: {
    id: 'panera',
    name: 'Panera & Desayunos',
    subtitle: 'Panes de molde, barras, tortillas de trigo, avena y cereales',
    emoji: '🍞',
    temperatureTip: 'Lugar aireado y protegido',
    color: 'yellow',
    bgGradient: 'from-yellow-950/50 via-slate-900 to-amber-950/40',
    borderClass: 'border-yellow-500/30',
    categories: ['panaderia'],
    quickPresets: [
      { name: 'Pan de molde 100% integral', category: 'panaderia', shelfLifeDays: 7, defaultFormat: 'Paquete' },
      { name: 'Tortillas de trigo / fajitas', category: 'panaderia', shelfLifeDays: 10, defaultFormat: 'Pack 6-8 uds' },
      { name: 'Copos de avena integral', category: 'panaderia', shelfLifeDays: 90, defaultFormat: 'Bolsa 500g' },
      { name: 'Barra de pan rústico', category: 'panaderia', shelfLifeDays: 2, defaultFormat: '1 barra' },
    ],
  },
  congelador: {
    id: 'congelador',
    name: 'Congelador',
    subtitle: 'Pescados ultracongelados, verduras para saltear y platos congelados',
    emoji: '❄️',
    temperatureTip: 'Ultracongelación (-18°C)',
    color: 'blue',
    bgGradient: 'from-blue-950/50 via-slate-900 to-indigo-950/40',
    borderClass: 'border-blue-500/30',
    categories: ['congelados'],
    quickPresets: [
      { name: 'Verduras salteadas congeladas', category: 'congelados', shelfLifeDays: 180, defaultFormat: 'Bolsa 750g' },
      { name: 'Lomos de merluza congelados', category: 'congelados', shelfLifeDays: 180, defaultFormat: 'Bolsa 500g' },
      { name: 'Guisantes congelados', category: 'congelados', shelfLifeDays: 180, defaultFormat: 'Bolsa 500g' },
    ],
  },
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

export interface FamilySyncPayload {
  version: number;
  updatedAt: string;
  deviceId?: string;
  recipes: Recipe[];
  plans: Record<string, WeeklyPlan>;
  shoppingLists: Record<string, ShoppingItem[]>;
  settings: AppSettings;
  pantry: DynamicPantryItem[];
  excludedFoods: ExcludedFoodItem[];
}

export type SyncStatusState = 'synced' | 'syncing' | 'local_only' | 'error' | 'offline';

export interface CloudStoreStatus {
  configured: boolean;
  provider: 'upstash' | 'local_file' | 'memory' | 'unconfigured';
  lastUpdated?: string;
  message?: string;
}

export interface AppleRemindersConfig {
  appleId: string;
  appSpecificPassword: string;
  calendarHref?: string;
  calendarName?: string;
  autoSyncOnCheck?: boolean;
  syncPeriod?: ShoppingPeriod;
  lastSyncedAt?: string;
}

export interface AppleRemindersListInfo {
  id: string;
  href: string;
  name: string;
  color?: string;
  isDefault?: boolean;
}

export interface RemindersSyncResult {
  success: boolean;
  syncedCount: number;
  totalCount: number;
  listName: string;
  timestamp: string;
  error?: string;
}


