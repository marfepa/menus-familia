'use client';

import React, { useState, useMemo } from 'react';
import { Recipe } from '@/types';
import { RecipeCard } from './RecipeCard';
import { Search, Plus, Star, Filter, Sparkles, BookOpen, RotateCcw } from 'lucide-react';

interface RecipesViewProps {
  recipes: Recipe[];
  onOpenCreate: () => void;
  onViewRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onToggleFavorite: (recipeId: string) => void;
  onResetDefaults: () => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  onOpenCreate,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onToggleFavorite,
  onResetDefaults,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [mealTypeFilter, setMealTypeFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAirFryer, setOnlyAirFryer] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'rating'>('name');

  // Extraer tags únicos
  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => r.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [recipes]);

  // Filtrado y ordenación
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(r => {
        const matchSearch =
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          r.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
          r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase()));

        const matchTag = selectedTag === 'todos' || r.tags.includes(selectedTag);
        const matchFav = !onlyFavorites || r.favorite;
        const matchAirFryer = !onlyAirFryer || r.isAirFryerFriendly || r.tags.some(t => /air-?fryer/i.test(t));
        const matchMealType =
          mealTypeFilter === 'all' || r.mealType === 'both' || r.mealType === mealTypeFilter;

        return matchSearch && matchTag && matchFav && matchAirFryer && matchMealType;
      })
      .sort((a, b) => {
        if (sortBy === 'time') return a.prepTimeMinutes - b.prepTimeMinutes;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return a.name.localeCompare(b.name, 'es');
      });
  }, [recipes, search, selectedTag, mealTypeFilter, onlyFavorites, onlyAirFryer, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Cabecera y botón principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📖</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recetario de Casa
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {recipes.length} recetas familiares guardadas. Organiza ingredientes, tiempos y platos favoritos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Restaurar las recetas iniciales de ejemplo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar ejemplos</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:shadow hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Receta</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por receta, ingrediente (ej. pollo, salmón) o etiqueta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filtro por momento */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-medium">
            <button
              onClick={() => setMealTypeFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors ${
                mealTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setMealTypeFilter('lunch')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors ${
                mealTypeFilter === 'lunch' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☀️ Comidas
            </button>
            <button
              onClick={() => setMealTypeFilter('dinner')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors ${
                mealTypeFilter === 'dinner' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌙 Cenas
            </button>
          </div>

          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-auto font-medium"
          >
            <option value="name">Alfabético (A-Z)</option>
            <option value="time">Más rápidas primero</option>
            <option value="rating">Mejor valoradas</option>
          </select>
        </div>

        {/* Tags y Favoritos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
              onlyFavorites
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Favoritos familiares
          </button>

          <button
            onClick={() => setOnlyAirFryer(!onlyAirFryer)}
            className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
              onlyAirFryer
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span>♨️</span>
            Air-Fryer
          </button>

          <button
            onClick={() => setSelectedTag('todos')}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
              selectedTag === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las etiquetas
          </button>

          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? 'todos' : tag)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Recetas */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <span className="text-4xl">🔍</span>
          <h3 className="font-bold text-slate-800 text-base mt-3">No hay recetas que coincidan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Prueba a cambiar los filtros o crea una nueva receta con el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={onViewRecipe}
              onEdit={onEditRecipe}
              onDelete={onDeleteRecipe}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

    </div>
  );
};
