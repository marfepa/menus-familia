import { Recipe, WeeklyPlan, ShoppingItem } from '@/types';
import { INITIAL_RECIPES } from '@/data/initialRecipes';

const STORAGE_KEYS = {
  RECIPES: 'recetario_familia_recipes_v1',
  PLANS: 'recetario_familia_plans_v1',
  SHOPPING_LISTS: 'recetario_familia_shopping_v1',
  CUSTOM_ITEMS: 'recetario_familia_custom_items_v1',
};

export const Storage = {
  // Recetas
  getRecipes(): Recipe[] {
    if (typeof window === 'undefined') return INITIAL_RECIPES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
        return INITIAL_RECIPES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error al cargar recetas:', e);
      return INITIAL_RECIPES;
    }
  },

  saveRecipes(recipes: Recipe[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error('Error al guardar recetas:', e);
    }
  },

  // Planes Semanales
  getPlans(): Record<string, WeeklyPlan> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error al cargar planes:', e);
      return {};
    }
  },

  getPlanForWeek(weekStartDate: string): WeeklyPlan {
    const plans = this.getPlans();
    if (plans[weekStartDate]) {
      return plans[weekStartDate];
    }
    // Plan vacío por defecto para la semana
    const emptyPlan: WeeklyPlan = {
      id: `plan-${weekStartDate}`,
      weekStartDate,
      days: {
        lunes: {},
        martes: {},
        miercoles: {},
        jueves: {},
        viernes: {},
        sabado: {},
        domingo: {},
      },
    };
    return emptyPlan;
  },

  savePlan(plan: WeeklyPlan): void {
    if (typeof window === 'undefined') return;
    try {
      const plans = this.getPlans();
      plans[plan.weekStartDate] = plan;
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Error al guardar plan semanal:', e);
    }
  },

  // Listas de la compra persistentes por semana
  getShoppingList(weekStartDate: string): ShoppingItem[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SHOPPING_LISTS}_${weekStartDate}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al cargar lista de compra:', e);
      return null;
    }
  },

  saveShoppingList(weekStartDate: string, items: ShoppingItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.SHOPPING_LISTS}_${weekStartDate}`, JSON.stringify(items));
    } catch (e) {
      console.error('Error al guardar lista de compra:', e);
    }
  },

  // Exportar backup
  exportBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      recipes: this.getRecipes(),
      plans: this.getPlans(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Importar backup
  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        this.saveRecipes(parsed.recipes);
      }
      if (parsed.plans && typeof parsed.plans === 'object') {
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(parsed.plans));
      }
      return true;
    } catch (e) {
      console.error('Error al importar backup:', e);
      return false;
    }
  },

  // Restaurar valores iniciales
  resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
  }
};
