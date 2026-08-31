'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Recipe,
  WeeklyPlan,
  ShoppingItem,
  DayOfWeek,
  IngredientCategory,
  PackageFormat,
  AppSettings,
  DynamicPantryItem,
  ExcludedFoodItem,
  GenerateMode,
} from '@/types';
import { Storage } from '@/lib/storage';
import { getMonday, getRelativeWeekMonday } from '@/lib/utils';
import { generateShoppingListFromPlan } from '@/lib/shoppingListGenerator';
import { analyzePlanWarnings, generateSmartWeeklyPlanWithMeta } from '@/lib/menuGenerator';
import { clonePlanForWeek, emptyWeeklyPlan, isPlanEmpty } from '@/lib/planUtils';
import { createPantryItemFromShopping, calculateShelfLifeInfo } from '@/lib/pantryUtils';
import { normalizeText } from '@/lib/shoppingListGenerator';

import { Navbar } from '@/components/Navbar';
import { WeekPlanner } from '@/components/WeekPlanner';
import { ShoppingListView } from '@/components/ShoppingListView';
import { PantryView } from '@/components/PantryView';
import { RecipesView } from '@/components/RecipesView';
import { ExcludedFoodsModal } from '@/components/ExcludedFoodsModal';
import { RecipeModal } from '@/components/RecipeModal';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { RecipeFormModal } from '@/components/RecipeFormModal';
import { VercelDeployModal } from '@/components/VercelDeployModal';
import { BackupModal } from '@/components/BackupModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'planner' | 'shopping' | 'pantry' | 'recipes'>('planner');
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<string>(getMonday(new Date()));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ householdServings: 4, generateMode: 'full' });
  const [pantry, setPantry] = useState<DynamicPantryItem[]>([]);
  const [excludedFoods, setExcludedFoods] = useState<ExcludedFoodItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [slotModalInfo, setSlotModalInfo] = useState<{ day: DayOfWeek; type: 'lunch' | 'dinner' } | null>(null);
  const [recipeToView, setRecipeToView] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExcludedModalOpen, setIsExcludedModalOpen] = useState(false);

  const loadData = useCallback(() => {
    const loadedRecipes = Storage.getRecipes();
    setRecipes(loadedRecipes);
    const loadedSettings = Storage.getSettings();
    setSettings(loadedSettings);
    const loadedPantry = Storage.getPantry();
    setPantry(loadedPantry);
    const loadedExcluded = Storage.getExcludedFoods();
    setExcludedFoods(loadedExcluded);

    const loadedPlan = Storage.getPlanForWeek(currentWeekStartDate);
    setWeeklyPlan(loadedPlan);
    setWarnings(analyzePlanWarnings(loadedPlan, loadedRecipes, loadedExcluded));

    const savedList = Storage.getShoppingList(currentWeekStartDate);
    if (savedList) {
      setShoppingItems(savedList);
    } else {
      const generated = generateShoppingListFromPlan(loadedPlan, loadedRecipes, {
        householdServings: loadedSettings.householdServings,
        pantry: loadedPantry,
      });
      setShoppingItems(generated);
      Storage.saveShoppingList(currentWeekStartDate, generated);
    }
  }, [currentWeekStartDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistPlan = (
    nextPlan: WeeklyPlan,
    currentRecipes = recipes,
    currentSettings = settings,
    currentPantry = pantry,
    currentExcluded = excludedFoods
  ) => {
    setWeeklyPlan(nextPlan);
    Storage.savePlan(nextPlan);
    setWarnings(analyzePlanWarnings(nextPlan, currentRecipes, currentExcluded));
    const currentList = Storage.getShoppingList(nextPlan.weekStartDate);
    const updated = generateShoppingListFromPlan(nextPlan, currentRecipes, {
      existingShoppingList: currentList,
      householdServings: currentSettings.householdServings,
      pantry: currentPantry,
    });
    setShoppingItems(updated);
    Storage.saveShoppingList(nextPlan.weekStartDate, updated);
  };

  const handleAssignRecipeToSlot = (recipeId: string, asLeftover = false) => {
    if (!slotModalInfo || !weeklyPlan) return;
    persistPlan({
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: asLeftover
            ? { kind: 'leftover', recipeId, customName: undefined }
            : { kind: 'recipe', recipeId, customName: undefined },
        },
      },
    });
  };

  const handleSetCustomMeal = (customName: string) => {
    if (!slotModalInfo || !weeklyPlan) return;
    persistPlan({
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: { kind: 'custom', recipeId: undefined, customName },
        },
      },
    });
  };

  const handleSetOutMeal = () => {
    if (!slotModalInfo || !weeklyPlan) return;
    persistPlan({
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: { kind: 'out', recipeId: undefined, customName: 'Comemos fuera' },
        },
      },
    });
  };

  const handleClearSlot = (day: DayOfWeek, type: 'lunch' | 'dinner') => {
    if (!weeklyPlan) return;
    persistPlan({
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [day]: {
          ...weeklyPlan.days[day],
          [type]: undefined,
        },
      },
    });
  };

  const handleSmartGenerate = () => {
    const { plan, warnings: nextWarnings } = generateSmartWeeklyPlanWithMeta(
      currentWeekStartDate,
      recipes,
      {
        mode: settings.generateMode,
        excludedFoods,
        prioritizeAirFryerDinners: settings.prioritizeAirFryerDinners ?? false,
        prioritizeMeatOverFish: settings.prioritizeMeatOverFish ?? true,
        maxFishMealsPerWeek: settings.maxFishMealsPerWeek ?? 2,
      }
    );
    setWarnings(nextWarnings);
    persistPlan(plan, recipes, settings, pantry, excludedFoods);
  };

  const handleClearWeek = () => {
    persistPlan(emptyWeeklyPlan(currentWeekStartDate));
  };

  const handleCopyPreviousWeek = () => {
    const prevMonday = getRelativeWeekMonday(-1, currentWeekStartDate);
    const prevPlan = Storage.getPlanForWeek(prevMonday);
    if (isPlanEmpty(prevPlan)) {
      alert('La semana anterior está vacía.');
      return;
    }
    persistPlan(clonePlanForWeek(prevPlan, currentWeekStartDate));
  };

  const handleGenerateModeChange = (mode: GenerateMode) => {
    const next = { ...settings, generateMode: mode };
    setSettings(next);
    Storage.saveSettings(next);
  };

  const handleToggleAirFryerDinners = (val: boolean) => {
    const next = { ...settings, prioritizeAirFryerDinners: val };
    setSettings(next);
    Storage.saveSettings(next);
  };

  const handleHouseholdServingsChange = (servings: number) => {
    const next = { ...settings, householdServings: servings };
    setSettings(next);
    Storage.saveSettings(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, next, pantry, excludedFoods);
  };

  // Toggle de un staple básico en la despensa
  const handleTogglePantryItem = (id: string) => {
    const next = pantry.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item));
    setPantry(next);
    Storage.savePantry(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, settings, next, excludedFoods);
  };

  // Acciones completas de Despensa Viva
  const handleAddPantryItem = (newItem: DynamicPantryItem) => {
    const next = [newItem, ...pantry];
    setPantry(next);
    Storage.savePantry(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, settings, next, excludedFoods);
  };

  const handleRemovePantryItem = (id: string) => {
    const next = pantry.filter((item) => item.id !== id);
    setPantry(next);
    Storage.savePantry(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, settings, next, excludedFoods);
  };

  const handleUpdatePantryItem = (updatedItem: DynamicPantryItem) => {
    const next = pantry.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    setPantry(next);
    Storage.savePantry(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, settings, next, excludedFoods);
  };

  // Al marcar un producto como comprado en la lista de la compra, se añade automáticamente a la despensa
  const handleToggleShoppingItem = (itemId: string) => {
    let updatedPantry = [...pantry];

    const updated = shoppingItems.map((item) => {
      if (item.id === itemId) {
        const nextChecked = !item.checked;

        if (nextChecked) {
          // Marcar como comprado -> incorporar a la despensa o actualizar fecha de stock
          const existingIdx = updatedPantry.findIndex(
            (p) => normalizeText(p.name) === normalizeText(item.name)
          );

          if (existingIdx >= 0) {
            updatedPantry[existingIdx] = {
              ...updatedPantry[existingIdx],
              inStock: true,
              addedDate: new Date().toISOString().slice(0, 10),
            };
          } else {
            const newPantryItem = createPantryItemFromShopping(item);
            updatedPantry = [newPantryItem, ...updatedPantry];
          }
        }
        return { ...item, checked: nextChecked };
      }
      return item;
    });

    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
    setPantry(updatedPantry);
    Storage.savePantry(updatedPantry);
  };

  const handleAddCustomShoppingItem = (
    name: string,
    quantity: number | undefined,
    unit: string,
    category: IngredientCategory,
    packageFormat?: PackageFormat
  ) => {
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}`,
      name,
      quantity,
      unit,
      category,
      checked: false,
      isCustom: true,
      packageFormat: packageFormat || 'granel',
      commercialFormat: quantity ? `${quantity} ${unit || ''}`.trim() : name,
      recipeUsageNote: 'Artículo extra personalizado',
      storeTip: 'Añadido manualmente',
    };
    const updated = [...shoppingItems, newItem];
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleDeleteShoppingItem = (itemId: string) => {
    const updated = shoppingItems.filter((item) => item.id !== itemId);
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleClearCheckedShoppingItems = () => {
    const updated = shoppingItems.filter((item) => !item.checked);
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleRegenerateShoppingFromMenu = () => {
    if (!weeklyPlan) return;
    persistPlan(weeklyPlan, recipes, settings, pantry, excludedFoods);
  };

  // Gestión de Alimentos Vetados
  const handleAddExcludedFood = (item: ExcludedFoodItem) => {
    const next = [item, ...excludedFoods];
    setExcludedFoods(next);
    Storage.saveExcludedFoods(next);
    if (weeklyPlan) setWarnings(analyzePlanWarnings(weeklyPlan, recipes, next));
  };

  const handleRemoveExcludedFood = (id: string) => {
    const next = excludedFoods.filter((f) => f.id !== id);
    setExcludedFoods(next);
    Storage.saveExcludedFoods(next);
    if (weeklyPlan) setWarnings(analyzePlanWarnings(weeklyPlan, recipes, next));
  };

  const handleSaveRecipe = (recipeData: Recipe) => {
    let nextRecipes: Recipe[];
    const exists = recipes.some((r) => r.id === recipeData.id);
    if (exists) {
      nextRecipes = recipes.map((r) => (r.id === recipeData.id ? recipeData : r));
    } else {
      nextRecipes = [recipeData, ...recipes];
    }
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
    if (weeklyPlan) persistPlan(weeklyPlan, nextRecipes, settings, pantry, excludedFoods);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.filter((r) => r.id !== recipeId);
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
    Storage.removeRecipeFromAllPlans(recipeId);
    const refreshed = Storage.getPlanForWeek(currentWeekStartDate);
    persistPlan(refreshed, nextRecipes, settings, pantry, excludedFoods);
  };

  const handleToggleFavoriteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.map((r) =>
      r.id === recipeId ? { ...r, favorite: !r.favorite } : r
    );
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
  };

  // Conteo de elementos que caducan pronto en la despensa para el badge de navegación
  const expiringPantryCount = useMemo(() => {
    return pantry.filter((item) => {
      if (!item.inStock) return false;
      const info = calculateShelfLifeInfo(item);
      return info.status === 'critical' || info.status === 'expired';
    }).length;
  }, [pantry]);

  if (!weeklyPlan) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingItemsCount={shoppingItems.filter((i) => !i.checked).length}
        pantryItemsCount={pantry.filter((i) => i.inStock).length}
        expiringPantryCount={expiringPantryCount}
        recipesCount={recipes.length}
        excludedFoodsCount={excludedFoods.length}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenExcludedFoodsModal={() => setIsExcludedModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {activeTab === 'planner' && (
          <WeekPlanner
            currentWeekStartDate={currentWeekStartDate}
            setCurrentWeekStartDate={setCurrentWeekStartDate}
            weeklyPlan={weeklyPlan}
            recipes={recipes}
            onOpenSlotModal={(day, type) => setSlotModalInfo({ day, type })}
            onClearSlot={handleClearSlot}
            onViewRecipe={(r) => setRecipeToView(r)}
            onSmartGenerate={handleSmartGenerate}
            onClearWeek={handleClearWeek}
            onCopyPreviousWeek={handleCopyPreviousWeek}
            onGoToShoppingList={() => setActiveTab('shopping')}
            generateMode={settings.generateMode}
            onGenerateModeChange={handleGenerateModeChange}
            householdServings={settings.householdServings}
            onHouseholdServingsChange={handleHouseholdServingsChange}
            warnings={warnings}
            prioritizeAirFryerDinners={settings.prioritizeAirFryerDinners}
            onToggleAirFryerDinners={handleToggleAirFryerDinners}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            items={shoppingItems}
            weekStartDate={currentWeekStartDate}
            onToggleItem={handleToggleShoppingItem}
            onAddItem={handleAddCustomShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
            onClearChecked={handleClearCheckedShoppingItems}
            onRegenerateFromMenu={handleRegenerateShoppingFromMenu}
            pantry={pantry}
            onTogglePantryItem={handleTogglePantryItem}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryView
            pantry={pantry}
            onRemoveItem={handleRemovePantryItem}
            onAddItem={handleAddPantryItem}
            onUpdateItem={handleUpdatePantryItem}
            onToggleStock={handleTogglePantryItem}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            onOpenCreate={() => {
              setRecipeToEdit(null);
              setIsFormModalOpen(true);
            }}
            onViewRecipe={(r) => setRecipeToView(r)}
            onEditRecipe={(r) => {
              setRecipeToEdit(r);
              setIsFormModalOpen(true);
            }}
            onDeleteRecipe={handleDeleteRecipe}
            onToggleFavorite={handleToggleFavoriteRecipe}
            onResetDefaults={() => {
              Storage.resetToDefaults();
              loadData();
            }}
          />
        )}
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 no-print">
        <p>Planificador de Menús Familiar • Diseñado para una alimentación sana, variada y organizada 🥑</p>
      </footer>

      <RecipeModal
        isOpen={Boolean(slotModalInfo)}
        onClose={() => setSlotModalInfo(null)}
        onSelectRecipe={handleAssignRecipeToSlot}
        onSetCustomMeal={handleSetCustomMeal}
        onSetOutMeal={handleSetOutMeal}
        onOpenCreateRecipe={() => {
          setRecipeToEdit(null);
          setIsFormModalOpen(true);
        }}
        recipes={recipes}
        currentSlotInfo={slotModalInfo}
      />

      <RecipeDetailModal
        recipe={recipeToView}
        isOpen={Boolean(recipeToView)}
        onClose={() => setRecipeToView(null)}
        onEdit={(r) => {
          setRecipeToEdit(r);
          setIsFormModalOpen(true);
        }}
        onToggleFavorite={handleToggleFavoriteRecipe}
      />

      <RecipeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setRecipeToEdit(null);
        }}
        onSave={handleSaveRecipe}
        recipeToEdit={recipeToEdit}
      />

      <ExcludedFoodsModal
        isOpen={isExcludedModalOpen}
        onClose={() => setIsExcludedModalOpen(false)}
        excludedFoods={excludedFoods}
        onAddExcludedFood={handleAddExcludedFood}
        onRemoveExcludedFood={handleRemoveExcludedFood}
      />

      <VercelDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataReload={loadData}
      />
    </div>
  );
}

