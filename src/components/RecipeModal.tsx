'use client';

import React, { useState, useMemo } from 'react';
import { Recipe, DayOfWeek } from '@/types';
import { Search, X, Star, Clock, Plus } from 'lucide-react';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: string, asLeftover?: boolean) => void;
  onSetCustomMeal: (customName: string) => void;
  onSetOutMeal: () => void;
  onOpenCreateRecipe: () => void;
  recipes: Recipe[];
  currentSlotInfo: { day: DayOfWeek; type: 'lunch' | 'dinner' } | null;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSelectRecipe,
  onSetCustomMeal,
  onSetOutMeal,
  onOpenCreateRecipe,
  recipes,
  currentSlotInfo,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [customText, setCustomText] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAirFryer, setOnlyAirFryer] = useState(false);

  // Extraer todos los tags únicos disponibles
  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => r.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [recipes]);

  // Filtrado
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase()));

      const matchTag = selectedTag === 'todos' || r.tags.includes(selectedTag);
      const matchFav = !onlyFavorites || r.favorite;
      const matchAirFryer = !onlyAirFryer || r.isAirFryerFriendly || r.tags.some(t => /air-?fryer/i.test(t));

      // Filtrar según si encaja con Comida o Cena
      const matchMealType = currentSlotInfo
        ? r.mealType === 'both' || r.mealType === currentSlotInfo.type
        : true;

      return matchSearch && matchTag && matchFav && matchAirFryer && matchMealType;
    });
  }, [recipes, search, selectedTag, onlyFavorites, onlyAirFryer, currentSlotInfo]);

  if (!isOpen || !currentSlotInfo) return null;

  const dayLabels: Record<DayOfWeek, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const isLunch = currentSlotInfo.type === 'lunch';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera del modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>{isLunch ? '☀️' : '🌙'}</span>
              <span>Elegir {isLunch ? 'Comida' : 'Cena'} para el {dayLabels[currentSlotInfo.day]}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona una receta del catálogo familiar o escribe un plato rápido
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador y filtros rápidos */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, ingrediente o etiqueta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Tags horizontales con scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedTag('todos')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedTag === 'todos'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({recipes.length})
            </button>
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                onlyFavorites
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              Favoritos
            </button>
            <button
              onClick={() => setOnlyAirFryer(!onlyAirFryer)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                onlyAirFryer
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              <span>♨️</span>
              Air-Fryer
            </button>

            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'todos' : tag)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de recetas scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm font-medium">No se encontraron recetas con estos filtros</p>
              <p className="text-xs text-slate-400 mt-1">Prueba con otra búsqueda o escribe un plato rápido abajo</p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  onSelectRecipe(recipe.id);
                  onClose();
                }}
                className="group p-3 rounded-xl hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center text-xl shadow-xs border border-slate-200/60">
                    {recipe.emoji || '🍲'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 group-hover:text-emerald-800 transition-colors flex items-center gap-1.5">
                      {recipe.name}
                      {recipe.favorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {recipe.prepTimeMinutes} min
                      </span>
                      <span>•</span>
                      <span>{recipe.ingredients.length} ingredientes</span>
                      {(recipe.isAirFryerFriendly || recipe.tags.some(t => /air-?fryer/i.test(t))) && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 text-[10px]">
                            ♨️ Air-Fryer{recipe.airFryerConfig?.timeMinutes ? ` ${recipe.airFryerConfig.timeMinutes}'` : ''}
                          </span>
                        </>
                      )}
                      {recipe.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 line-clamp-1">{recipe.tags.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                  >
                    Elegir
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRecipe(recipe.id, true);
                      onClose();
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-md text-teal-800 bg-teal-50 hover:bg-teal-100"
                  >
                    Sobra / tupper
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Opción de plato libre o crear nueva receta */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onSetOutMeal();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            >
              Comemos fuera
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCreateRecipe();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear receta</span>
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customText.trim()) {
                onSetCustomMeal(customText.trim());
                setCustomText('');
                onClose();
              }
            }}
            className="flex items-center gap-2 w-full"
          >
            <input
              type="text"
              placeholder="Plato libre (ej. Pizza) — no añade compra"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!customText.trim()}
              className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-medium hover:bg-slate-700 whitespace-nowrap transition-colors"
            >
              Asignar libre
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
