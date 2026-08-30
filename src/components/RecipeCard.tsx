'use client';

import React from 'react';
import { Recipe } from '@/types';
import { Clock, Users, Star, Edit, Trash2, ChefHat, Briefcase, Baby, RefreshCw } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onToggleFavorite: (recipeId: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-emerald-300">
      
      {/* Cabecera de la tarjeta */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0">
            {recipe.emoji || '🍲'}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(recipe.id);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                recipe.favorite
                  ? 'bg-amber-50 text-amber-500 border-amber-200'
                  : 'bg-white text-slate-300 border-slate-100 hover:text-amber-400 hover:border-slate-200'
              }`}
              title="Favorito familiar"
            >
              <Star className={`w-4 h-4 ${recipe.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(recipe);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar la receta "${recipe.name}"?`)) {
                  onDelete(recipe.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="cursor-pointer" onClick={() => onView(recipe)}>
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              {recipe.mealType === 'lunch' ? 'Comida' : recipe.mealType === 'dinner' ? 'Cena' : 'Comida / Cena'}
            </span>
            {recipe.isTupperFriendly && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                <Briefcase className="w-2.5 h-2.5" /> Tupper
              </span>
            )}
            {recipe.batchCooking && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5" /> Cocina x2
              </span>
            )}
          </div>

          <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {recipe.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {recipe.description || 'Sin descripción'}
          </p>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
              >
                #{tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer de la tarjeta */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {recipe.prepTimeMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {recipe.servings}p
          </span>
        </div>

        <button
          onClick={() => onView(recipe)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          Ver receta →
        </button>
      </div>

    </div>
  );
};
