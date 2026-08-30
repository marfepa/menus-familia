'use client';

import React, { useState } from 'react';
import { Recipe, CATEGORY_LABELS } from '@/types';
import { X, Clock, Users, Star, Edit, ChefHat, CheckSquare } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onEdit,
  onToggleFavorite,
}) => {
  const [servings, setServings] = useState<number>(recipe?.servings || 4);

  if (!isOpen || !recipe) return null;

  const baseServings = recipe.servings || 4;
  const multiplier = servings / baseServings;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header con imagen/emoji y títulos */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-3xl shrink-0">
              {recipe.emoji || '🍲'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {recipe.mealType === 'lunch' ? 'Comida' : recipe.mealType === 'dinner' ? 'Cena' : 'Comida / Cena'}
                </span>
                {recipe.difficulty && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {recipe.difficulty}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
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

        {/* Barra de metadatos (Tiempo, Raciones ajustables) */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              {recipe.prepTimeMinutes} minutos
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ChefHat className="w-4 h-4 text-emerald-600" />
              {recipe.ingredients.length} ingredientes
            </span>
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

        {/* Contenido scrolleable: Ingredientes y Preparación */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
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
                <span>👨‍🍳</span> Paso a Paso
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
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-900">
              <span className="font-bold block mb-0.5">💡 Consejo familiar:</span>
              <span>{recipe.notes}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
