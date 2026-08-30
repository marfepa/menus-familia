'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Recipe,
  WeeklyPlan,
  ShoppingItem,
  DayOfWeek,
  IngredientCategory,
  PackageFormat,
  AppSettings,
  PantryItem,
  GenerateMode,
} from '@/types';
import { Storage } from '@/lib/storage';
import { getMonday, getRelativeWeekMonday } from '@/lib/utils';
import { generateShoppingListFromPlan } from '@/lib/shoppingListGenerator';
import { analyzePlanWarnings, generateSmartWeeklyPlanWithMeta } from '@/lib/menuGenerator';
import { clonePlanForWeek, emptyWeeklyPlan, isPlanEmpty } from '@/lib/planUtils';

import { Navbar } from '@/components/Navbar';
import { WeekPlanner } from '@/components/WeekPlanner';
import { ShoppingListView } from '@/components/ShoppingListView';
import { RecipesView } from '@/components/RecipesView';
import { RecipeModal } from '@/components/RecipeModal';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { RecipeFormModal } from '@/components/RecipeFormModal';
import { VercelDeployModal } from '@/components/VercelDeployModal';
import { BackupModal } from '@/components/BackupModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'planner' | 'shopping' | 'recipes'>('planner');
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<string>(getMonday(new Date()));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ householdServings: 4, generateMode: 'full' });
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [slotModalInfo, setSlotModalInfo] = useState<{ day: DayOfWeek; type: 'lunch' | 'dinner' } | null>(null);
  const [recipeToView, setRecipeToView] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const loadData = useCallback(() => {
    const loadedRecipes = Storage.getRecipes();
    setRecipes(loadedRecipes);
    const loadedSettings = Storage.getSettings();
    setSettings(loadedSettings);
    const loadedPantry = Storage.getPantry();
    setPantry(loadedPantry);

    const loadedPlan = Storage.getPlanForWeek(currentWeekStartDate);
    setWeeklyPlan(loadedPlan);
    setWarnings(analyzePlanWarnings(loadedPlan, loadedRecipes));

    const savedList = Storage.getShoppingList(currentWeekStartDate);
    const generated = generateShoppingListFromPlan(loadedPlan, loadedRecipes, {
      existingShoppingList: savedList,
      householdServings: loadedSettings.householdServings,
      pantry: loadedPantry,
    });
    setShoppingItems(generated);
    Storage.saveShoppingList(currentWeekStartDate, generated);
  }, [currentWeekStartDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistPlan = (nextPlan: WeeklyPlan, currentRecipes = recipes, currentSettings = settings, currentPantry = pantry) => {
    setWeeklyPlan(nextPlan);
    Storage.savePlan(nextPlan);
    setWarnings(analyzePlanWarnings(nextPlan, currentRecipes));
    const currentList = Storage.getShoppingList(nextPlan.weekStartDate);
    const updated = generateShoppingListFromPlan(nextPlan, currentRecipes, {
      existingShoppingList: currentList,
      householdServings: currentSettings.householdServings,
      pantry: currentPantry,
    });
    setShoppingItems(updated);
    Storage.saveShoppingList(nextPlan.weekStartDate, updated);
  };

  const handleAssignRecipeToSlot = (recipeId: string) => {
    if (!slotModalInfo || !weeklyPlan) return;
    persistPlan({
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: { kind: 'recipe', recipeId, customName: undefined },
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
      { mode: settings.generateMode }
    );
    setWarnings(nextWarnings);
    persistPlan(plan);
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

  const handleHouseholdServingsChange = (servings: number) => {
    const next = { ...settings, householdServings: servings };
    setSettings(next);
    Storage.saveSettings(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, next, pantry);
  };

  const handleTogglePantryItem = (id: string) => {
    const next = pantry.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item));
    setPantry(next);
    Storage.savePantry(next);
    if (weeklyPlan) persistPlan(weeklyPlan, recipes, settings, next);
  };

  const handleToggleShoppingItem = (itemId: string) => {
    const updated = shoppingItems.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
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
    persistPlan(weeklyPlan);
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
    if (weeklyPlan) persistPlan(weeklyPlan, nextRecipes);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.filter((r) => r.id !== recipeId);
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
    Storage.removeRecipeFromAllPlans(recipeId);
    const refreshed = Storage.getPlanForWeek(currentWeekStartDate);
    persistPlan(refreshed, nextRecipes);
  };

  const handleToggleFavoriteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.map((r) =>
      r.id === recipeId ? { ...r, favorite: !r.favorite } : r
    );
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
  };

  if (!weeklyPlan) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingItemsCount={shoppingItems.filter((i) => !i.checked).length}
        recipesCount={recipes.length}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
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
