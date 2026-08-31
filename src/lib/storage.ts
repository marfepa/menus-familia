import type { Recipe, WeeklyPlan, ShoppingItem, AppSettings, PantryItem, ExcludedFoodItem, FamilySyncPayload } from '@/types';

import { INITIAL_RECIPES } from '@/data/initialRecipes';
import { DEFAULT_PANTRY, DEFAULT_SETTINGS } from '@/data/defaultPantry';
import { emptyWeeklyPlan, removeRecipeFromPlans } from '@/lib/planUtils';

const STORAGE_KEYS = {
  RECIPES: 'recetario_familia_recipes_v3',
  PLANS: 'recetario_familia_plans_v3',
  SHOPPING_LISTS: 'recetario_familia_shopping_v3',
  SETTINGS: 'recetario_familia_settings_v4',
  PANTRY: 'recetario_familia_pantry_v5',
  EXCLUDED_FOODS: 'recetario_familia_excluded_foods_v1',
  LAST_UPDATE: 'recetario_familia_last_update_v1',
  DEVICE_ID: 'recetario_familia_device_id_v1',
};

function getOrCreateDeviceId(): string {
  if (!canUseStorage()) return 'server';
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}


function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch (e) {
    console.error(`Error al leer ${key}:`, e);
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error al guardar ${key}:`, e);
  }
}

export const Storage = {
  getRecipes(): Recipe[] {
    if (!canUseStorage()) return INITIAL_RECIPES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
        return INITIAL_RECIPES;
      }
      const savedRecipes: Recipe[] = JSON.parse(data);
      const savedIds = new Set(savedRecipes.map((r) => r.id));
      const missingInitial = INITIAL_RECIPES.filter((r) => !savedIds.has(r.id));
      if (missingInitial.length > 0) {
        const merged = [...savedRecipes, ...missingInitial];
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(merged));
        return merged;
      }
      return savedRecipes;
    } catch (e) {
      console.error('Error al cargar recetas:', e);
      return INITIAL_RECIPES;
    }
  },

  saveRecipes(recipes: Recipe[]): void {
    writeJson(STORAGE_KEYS.RECIPES, recipes);
  },

  getPlans(): Record<string, WeeklyPlan> {
    return readJson<Record<string, WeeklyPlan>>(STORAGE_KEYS.PLANS, {});
  },

  getPlanForWeek(weekStartDate: string): WeeklyPlan {
    const plans = this.getPlans();
    return plans[weekStartDate] || emptyWeeklyPlan(weekStartDate);
  },

  savePlan(plan: WeeklyPlan): void {
    const plans = this.getPlans();
    plans[plan.weekStartDate] = plan;
    writeJson(STORAGE_KEYS.PLANS, plans);
  },

  savePlans(plans: Record<string, WeeklyPlan>): void {
    writeJson(STORAGE_KEYS.PLANS, plans);
  },

  removeRecipeFromAllPlans(recipeId: string): void {
    const cleaned = removeRecipeFromPlans(this.getPlans(), recipeId);
    this.savePlans(cleaned);
  },

  getShoppingList(weekStartDate: string): ShoppingItem[] | null {
    if (!canUseStorage()) return null;
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SHOPPING_LISTS}_${weekStartDate}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al cargar lista de compra:', e);
      return null;
    }
  },

  saveShoppingList(weekStartDate: string, items: ShoppingItem[]): void {
    if (!canUseStorage()) return;
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.SHOPPING_LISTS}_${weekStartDate}`,
        JSON.stringify(items)
      );
    } catch (e) {
      console.error('Error al guardar lista de compra:', e);
    }
  },

  getAllShoppingLists(): Record<string, ShoppingItem[]> {
    if (!canUseStorage()) return {};
    const lists: Record<string, ShoppingItem[]> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${STORAGE_KEYS.SHOPPING_LISTS}_`)) {
          const week = key.slice(`${STORAGE_KEYS.SHOPPING_LISTS}_`.length);
          const raw = localStorage.getItem(key);
          if (raw) lists[week] = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.error('Error al leer listas de compra:', e);
    }
    return lists;
  },

  saveAllShoppingLists(lists: Record<string, ShoppingItem[]>): void {
    if (!canUseStorage()) return;
    Object.entries(lists).forEach(([week, items]) => {
      this.saveShoppingList(week, items);
    });
  },

  clearAllShoppingLists(): void {
    if (!canUseStorage()) return;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_KEYS.SHOPPING_LISTS}_`)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  },

  getSettings(): AppSettings {
    const saved = readJson<Partial<AppSettings> | null>(STORAGE_KEYS.SETTINGS, null);
    return {
      ...DEFAULT_SETTINGS,
      ...(saved || {}),
    };
  },

  saveSettings(settings: AppSettings): void {
    writeJson(STORAGE_KEYS.SETTINGS, settings);
  },

  getPantry(): PantryItem[] {
    const saved = readJson<PantryItem[] | null>(STORAGE_KEYS.PANTRY, null);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
      // Intentar migrar desde v4 si existe
      if (canUseStorage()) {
        const legacy = localStorage.getItem('recetario_familia_pantry_v4');
        if (legacy) {
          try {
            const parsedLegacy: PantryItem[] = JSON.parse(legacy);
            const mergedLegacy = DEFAULT_PANTRY.map((def) => {
              const prev = parsedLegacy.find((p) => p.id === def.id);
              return prev ? { ...def, inStock: prev.inStock } : { ...def };
            });
            const extras = parsedLegacy.filter((item) => !DEFAULT_PANTRY.some((d) => d.id === item.id));
            const full = [...mergedLegacy, ...extras];
            writeJson(STORAGE_KEYS.PANTRY, full);
            return full;
          } catch {
            // Ignorar error de migración
          }
        }
      }
      return DEFAULT_PANTRY.map((item) => ({ ...item }));
    }
    const savedMap = new Map(saved.map((item) => [item.id, item]));
    const merged = DEFAULT_PANTRY.map((def) => {
      const prev = savedMap.get(def.id);
      return prev ? { ...def, ...prev } : { ...def };
    });
    const extras = saved.filter((item) => !DEFAULT_PANTRY.some((d) => d.id === item.id));
    return [...merged, ...extras];
  },

  savePantry(pantry: PantryItem[]): void {
    writeJson(STORAGE_KEYS.PANTRY, pantry);
  },

  getExcludedFoods(): ExcludedFoodItem[] {
    return readJson<ExcludedFoodItem[]>(STORAGE_KEYS.EXCLUDED_FOODS, []);
  },

  saveExcludedFoods(items: ExcludedFoodItem[]): void {
    writeJson(STORAGE_KEYS.EXCLUDED_FOODS, items);
  },

  exportBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: 5,
      recipes: this.getRecipes(),
      plans: this.getPlans(),
      shoppingLists: this.getAllShoppingLists(),
      settings: this.getSettings(),
      pantry: this.getPantry(),
      excludedFoods: this.getExcludedFoods(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        this.saveRecipes(parsed.recipes);
      }
      if (parsed.plans && typeof parsed.plans === 'object') {
        writeJson(STORAGE_KEYS.PLANS, parsed.plans);
      }
      if (parsed.shoppingLists && typeof parsed.shoppingLists === 'object' && !Array.isArray(parsed.shoppingLists)) {
        this.clearAllShoppingLists();
        this.saveAllShoppingLists(parsed.shoppingLists);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      if (parsed.pantry && Array.isArray(parsed.pantry)) {
        this.savePantry(parsed.pantry);
      }
      if (parsed.excludedFoods && Array.isArray(parsed.excludedFoods)) {
        this.saveExcludedFoods(parsed.excludedFoods);
      }
      return true;
    } catch (e) {
      console.error('Error al importar backup:', e);
      return false;
    }
  },

  getDeviceId(): string {
    return getOrCreateDeviceId();
  },

  getLastLocalUpdate(): string {
    return readJson<string>(STORAGE_KEYS.LAST_UPDATE, '');
  },

  setLastLocalUpdate(isoString: string): void {
    writeJson(STORAGE_KEYS.LAST_UPDATE, isoString);
  },

  getFullPayload(deviceId?: string): FamilySyncPayload {
    const lastUpdate = this.getLastLocalUpdate() || new Date().toISOString();
    return {
      version: 1,
      updatedAt: lastUpdate,
      deviceId: deviceId || this.getDeviceId(),
      recipes: this.getRecipes(),
      plans: this.getPlans(),
      shoppingLists: this.getAllShoppingLists(),
      settings: this.getSettings(),
      pantry: this.getPantry(),
      excludedFoods: this.getExcludedFoods(),
    };
  },

  applyFullPayload(payload: FamilySyncPayload): void {
    if (!payload) return;
    if (Array.isArray(payload.recipes)) {
      this.saveRecipes(payload.recipes);
    }
    if (payload.plans && typeof payload.plans === 'object') {
      this.savePlans(payload.plans);
    }
    if (payload.shoppingLists && typeof payload.shoppingLists === 'object') {
      this.clearAllShoppingLists();
      this.saveAllShoppingLists(payload.shoppingLists);
    }
    if (payload.settings && typeof payload.settings === 'object') {
      this.saveSettings(payload.settings);
    }
    if (Array.isArray(payload.pantry)) {
      this.savePantry(payload.pantry);
    }
    if (Array.isArray(payload.excludedFoods)) {
      this.saveExcludedFoods(payload.excludedFoods);
    }
    if (payload.updatedAt) {
      this.setLastLocalUpdate(payload.updatedAt);
    }
  },

  resetToDefaults(): void {
    if (!canUseStorage()) return;
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PANTRY);
    localStorage.removeItem(STORAGE_KEYS.EXCLUDED_FOODS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    this.clearAllShoppingLists();
  },
};


