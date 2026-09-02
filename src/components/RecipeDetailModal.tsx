'use client';

import React, { useState, useEffect } from 'react';
import { Recipe, CATEGORY_LABELS } from '@/types';
import { SlotCookingContext } from '@/lib/planUtils';
import { X, Clock, Users, Star, Edit, ChefHat, Briefcase, Baby, Calendar, RefreshCw } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
  contextServings?: number;
  cookingContext?: SlotCookingContext | null;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onEdit,
  onToggleFavorite,
  contextServings,
  cookingContext,
}) => {
  const [servings, setServings] = useState<number>(contextServings || recipe?.servings || 4);

  useEffect(() => {
    if (contextServings) {
      setServings(contextServings);
    } else if (recipe?.servings) {
      setServings(recipe.servings);
    }
  }, [recipe, contextServings]);

  if (!isOpen || !recipe) return null;

  const baseServings = recipe.servings || 4;
  const multiplier = servings / baseServings;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header con imagen/emoji y títulos */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-amber-50/30 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-3xl shrink-0">
              {recipe.emoji || '🍲'}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {recipe.mealType === 'lunch' ? 'Comida' : recipe.mealType === 'dinner' ? 'Cena' : 'Comida / Cena'}
                </span>
                {recipe.isTupperFriendly && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Apto Tupper
                  </span>
                )}
                {recipe.batchCooking && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Cocina x2
                  </span>
                )}
                {(recipe.isAirFryerFriendly || recipe.tags.some(t => /air-?fryer/i.test(t))) && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                    <span>♨️</span> Air-Fryer {recipe.airFryerConfig?.timeMinutes ? `(${recipe.airFryerConfig.timeMinutes} min)` : ''}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {recipe.name}
              </h2>
              {recipe.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(recipe.id)}
              className={`p-2 rounded-xl border transition-colors ${
                recipe.favorite
                  ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-slate-50'
              }`}
              title="Marcar favorito"
            >
              <Star className={`w-5 h-5 ${recipe.favorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(recipe);
              }}
              className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Editar receta"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white text-slate-400 border border-slate-200 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de metadatos (Tiempo, Raciones ajustables, Conservación) */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              {recipe.prepTimeMinutes} minutos
            </span>
            {recipe.fridgeLifeDays && (
              <span className="flex items-center gap-1.5 font-medium text-indigo-700">
                <Calendar className="w-4 h-4" />
                Nevera: {recipe.fridgeLifeDays} días
              </span>
            )}
          </div>

          {/* Ajustador de raciones */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Raciones:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs shadow-xs"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-emerald-700">{servings}</span>
              <button
                onClick={() => setServings(servings + 1)}
                className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs shadow-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable: Ficha Niños/BLW, Ingredientes y Preparación */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Banner informativo de Cocina x2 / x3 con sobras */}
          {cookingContext?.isFreshCook && cookingContext.leftoverCount > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-xs sm:text-sm text-indigo-950 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-900">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Cocina x{1 + cookingContext.leftoverCount} ({servings} raciones automáticas)</span>
              </div>
              <p className="leading-relaxed pl-6 text-indigo-900/90">
                Esta receta está planificada para comer hoy y guardar {cookingContext.leftoverCount} {cookingContext.leftoverCount === 1 ? 'toma de tupper/sobras' : 'tomas de tupper/sobras'}. Las cantidades de los ingredientes están escaladas para cocinar la cantidad exacta.
              </p>
            </div>
          )}

          {/* Banner informativo de plato de sobras */}
          {cookingContext?.isLeftover && (
            <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200 text-xs sm:text-sm text-teal-950 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <span className="text-base">🥡</span>
                <span>Plato de sobras / Tupper</span>
              </div>
              <p className="leading-relaxed pl-6 text-teal-900/90">
                {cookingContext.parentCookDay
                  ? `Cocinado previamente el ${cookingContext.parentCookDay} (${cookingContext.parentCookMeal === 'lunch' ? 'comida' : 'cena'}).`
                  : 'Cocinado previamente en esta semana.'}{' '}
                ¡Listo para calentar en sartén, horno o microondas y servir!
              </p>
            </div>
          )}

          {/* Ficha Especial Niños & BLW */}
          {recipe.kidsNotes && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs sm:text-sm text-amber-950 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Baby className="w-4 h-4 text-amber-600" />
                <span>Adaptación para Niños Pequeños & BLW (Sólidos)</span>
              </div>
              <p className="leading-relaxed pl-6 text-amber-900/90">
                {recipe.kidsNotes}
              </p>
            </div>
          )}

          {/* Ficha Parámetros Air-Fryer */}
          {(recipe.isAirFryerFriendly || recipe.tags.some(t => /air-?fryer/i.test(t))) && (
            <div className="p-4 rounded-2xl bg-orange-50/90 border border-orange-200 text-xs sm:text-sm text-orange-950 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <span className="text-base">♨️</span>
                <span>Parámetros Recomendados para Freidora de Aire (Air-Fryer)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                {recipe.airFryerConfig?.temperatureDegrees && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-orange-200/70">
                    <span className="text-orange-700 block font-semibold text-[11px]">Temperatura</span>
                    <span className="text-sm font-extrabold text-orange-950">{recipe.airFryerConfig.temperatureDegrees}°C</span>
                  </div>
                )}
                {recipe.airFryerConfig?.timeMinutes && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-orange-200/70">
                    <span className="text-orange-700 block font-semibold text-[11px]">Tiempo en cubeta</span>
                    <span className="text-sm font-extrabold text-orange-950">{recipe.airFryerConfig.timeMinutes} minutos</span>
                  </div>
                )}
                <div className="bg-white/80 p-2.5 rounded-xl border border-orange-200/70 col-span-2 sm:col-span-1">
                  <span className="text-orange-700 block font-semibold text-[11px]">Manipulación</span>
                  <span className="text-xs font-bold text-orange-950">
                    {recipe.airFryerConfig?.shakeHalfway ? 'Agitar cesta a mitad' : 'Cocinado continuo directo'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Ingredientes con cantidades escaladas */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🛒</span> Ingredientes ({servings} raciones)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map(ing => {
                const scaledQty = ing.quantity ? Math.round((ing.quantity * multiplier) * 10) / 10 : null;
                const catInfo = CATEGORY_LABELS[ing.category] || { emoji: '📦' };

                return (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>{catInfo.emoji}</span>
                      <span>{ing.name}</span>
                    </span>
                    {scaledQty !== null && (
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {scaledQty} {ing.unit || ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pasos de preparación */}
          {recipe.instructions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>👨‍🍳</span> Paso a Paso Rápido ($\le 20$ min)
              </h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notas o consejos */}
          {recipe.notes && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950">
              <span className="font-bold block mb-0.5">💡 Consejo de Cocina / Tupper:</span>
              <span>{recipe.notes}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
