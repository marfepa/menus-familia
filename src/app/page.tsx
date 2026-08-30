'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, WeeklyPlan, ShoppingItem, DayOfWeek, IngredientCategory } from '@/types';
import { Storage } from '@/lib/storage';
import { getMonday } from '@/lib/utils';
import { generateShoppingListFromPlan } from '@/lib/shoppingListGenerator';
import { generateSmartWeeklyPlan } from '@/lib/menuGenerator';

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

  // Modals state
  const [slotModalInfo, setSlotModalInfo] = useState<{ day: DayOfWeek; type: 'lunch' | 'dinner' } | null>(null);
  const [recipeToView, setRecipeToView] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // 1. Cargar recetas y planes al inicio
  const loadData = useCallback(() => {
    const loadedRecipes = Storage.getRecipes();
    setRecipes(loadedRecipes);

    const loadedPlan = Storage.getPlanForWeek(currentWeekStartDate);
    setWeeklyPlan(loadedPlan);

    // Cargar o generar lista de la compra
    const savedList = Storage.getShoppingList(currentWeekStartDate);
    if (savedList) {
      setShoppingItems(savedList);
    } else {
      const generated = generateShoppingListFromPlan(loadedPlan, loadedRecipes);
      setShoppingItems(generated);
      Storage.saveShoppingList(currentWeekStartDate, generated);
    }
  }, [currentWeekStartDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sincronizar lista de la compra al cambiar el plan semanal
  const syncShoppingList = (newPlan: WeeklyPlan, currentRecipes: Recipe[]) => {
    const currentList = Storage.getShoppingList(newPlan.weekStartDate);
    const updated = generateShoppingListFromPlan(newPlan, currentRecipes, currentList);
    setShoppingItems(updated);
    Storage.saveShoppingList(newPlan.weekStartDate, updated);
  };

  // --- Handlers de Menú Semanal ---
  const handleAssignRecipeToSlot = (recipeId: string) => {
    if (!slotModalInfo || !weeklyPlan) return;
    const nextPlan = {
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: { recipeId, customName: undefined },
        },
      },
    };
    setWeeklyPlan(nextPlan);
    Storage.savePlan(nextPlan);
    syncShoppingList(nextPlan, recipes);
  };

  const handleSetCustomMeal = (customName: string) => {
    if (!slotModalInfo || !weeklyPlan) return;
    const nextPlan = {
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [slotModalInfo.day]: {
          ...weeklyPlan.days[slotModalInfo.day],
          [slotModalInfo.type]: { recipeId: undefined, customName },
        },
      },
    };
    setWeeklyPlan(nextPlan);
    Storage.savePlan(nextPlan);
  };

  const handleClearSlot = (day: DayOfWeek, type: 'lunch' | 'dinner') => {
    if (!weeklyPlan) return;
    const nextPlan = {
      ...weeklyPlan,
      days: {
        ...weeklyPlan.days,
        [day]: {
          ...weeklyPlan.days[day],
          [type]: undefined,
        },
      },
    };
    setWeeklyPlan(nextPlan);
    Storage.savePlan(nextPlan);
    syncShoppingList(nextPlan, recipes);
  };

  const handleSmartGenerate = () => {
    if (!weeklyPlan) return;
    const smartPlan = generateSmartWeeklyPlan(currentWeekStartDate, recipes);
    setWeeklyPlan(smartPlan);
    Storage.savePlan(smartPlan);
    syncShoppingList(smartPlan, recipes);
  };

  const handleClearWeek = () => {
    const emptyPlan: WeeklyPlan = {
      id: `plan-${currentWeekStartDate}`,
      weekStartDate: currentWeekStartDate,
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
    setWeeklyPlan(emptyPlan);
    Storage.savePlan(emptyPlan);
    syncShoppingList(emptyPlan, recipes);
  };

  // --- Handlers de Lista de la Compra ---
  const handleToggleShoppingItem = (itemId: string) => {
    const updated = shoppingItems.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleAddCustomShoppingItem = (
    name: string,
    quantity: number | undefined,
    unit: string,
    category: IngredientCategory
  ) => {
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}`,
      name,
      quantity,
      unit,
      category,
      checked: false,
      isCustom: true,
    };
    const updated = [...shoppingItems, newItem];
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleDeleteShoppingItem = (itemId: string) => {
    const updated = shoppingItems.filter(item => item.id !== itemId);
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleClearCheckedShoppingItems = () => {
    const updated = shoppingItems.filter(item => !item.checked);
    setShoppingItems(updated);
    Storage.saveShoppingList(currentWeekStartDate, updated);
  };

  const handleRegenerateShoppingFromMenu = () => {
    if (!weeklyPlan) return;
    const regenerated = generateShoppingListFromPlan(weeklyPlan, recipes, shoppingItems);
    setShoppingItems(regenerated);
    Storage.saveShoppingList(currentWeekStartDate, regenerated);
  };

  // --- Handlers de Recetas ---
  const handleSaveRecipe = (recipeData: Recipe) => {
    let nextRecipes: Recipe[];
    const exists = recipes.some(r => r.id === recipeData.id);
    if (exists) {
      nextRecipes = recipes.map(r => (r.id === recipeData.id ? recipeData : r));
    } else {
      nextRecipes = [recipeData, ...recipes];
    }
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
    if (weeklyPlan) {
      syncShoppingList(weeklyPlan, nextRecipes);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.filter(r => r.id !== recipeId);
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
  };

  const handleToggleFavoriteRecipe = (recipeId: string) => {
    const nextRecipes = recipes.map(r =>
      r.id === recipeId ? { ...r, favorite: !r.favorite } : r
    );
    setRecipes(nextRecipes);
    Storage.saveRecipes(nextRecipes);
  };

  if (!weeklyPlan) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingItemsCount={shoppingItems.filter(i => !i.checked).length}
        recipesCount={recipes.length}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Contenido Principal */}
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
            onGoToShoppingList={() => setActiveTab('shopping')}
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

      {/* Footer sencillo */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 no-print">
        <p>Planificador de Menús Familiar • Diseñado para una alimentación sana, variada y organizada 🥑</p>
      </footer>

      {/* Modales */}
      <RecipeModal
        isOpen={Boolean(slotModalInfo)}
        onClose={() => setSlotModalInfo(null)}
        onSelectRecipe={handleAssignRecipeToSlot}
        onSetCustomMeal={handleSetCustomMeal}
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
