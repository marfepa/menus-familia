'use client';

import React from 'react';
import { Recipe, MealSlotData } from '@/types';
import { Plus, Clock, Star, X, Eye, Sparkles } from 'lucide-react';

interface MealSlotProps {
  type: 'lunch' | 'dinner';
  slotData?: MealSlotData;
  recipe?: Recipe;
  onAssignClick: () => void;
  onClearClick: () => void;
  onViewRecipe: (recipe: Recipe) => void;
}

export const MealSlot: React.FC<MealSlotProps> = ({
  type,
  slotData,
  recipe,
  onAssignClick,
  onClearClick,
  onViewRecipe,
}) => {
  const isLunch = type === 'lunch';
  const label = isLunch ? 'Comida' : 'Cena';
  const iconEmoji = isLunch ? '☀️' : '🌙';

  if (!recipe && !slotData?.customName) {
    return (
      <div className="group relative rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white/60 hover:bg-emerald-50/40 p-3 transition-all flex flex-col items-center justify-center min-h-[96px]">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span>{iconEmoji}</span> {label}
        </span>
        <button
          onClick={onAssignClick}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-emerald-700 bg-slate-100/80 group-hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Elegir plato</span>
        </button>
      </div>
    );
  }

  // Plato personalizado sin receta del catálogo
  if (!recipe && slotData?.customName) {
    return (
      <div className="relative rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs hover:shadow transition-all group min-h-[96px] flex flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span>{iconEmoji}</span> {label}
          </span>
          <button
            onClick={onClearClick}
            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition-colors"
            title="Quitar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="font-semibold text-sm text-slate-900 line-clamp-2 my-1">
          {slotData.customName}
        </p>
        <button
          onClick={onAssignClick}
          className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 mt-1 font-medium"
        >
          Cambiar
        </button>
      </div>
    );
  }

  // Plato asignado con receta completa
  return (
    <div className="relative rounded-xl border border-slate-200 hover:border-emerald-300 bg-white p-3 shadow-sm hover:shadow transition-all group min-h-[96px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
            isLunch ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            <span>{iconEmoji}</span> {label}
          </span>
          
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => recipe && onViewRecipe(recipe)}
              className="text-slate-400 hover:text-emerald-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Ver detalles e ingredientes"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearClick}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
              title="Quitar de este día"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-1.5 cursor-pointer" onClick={() => recipe && onViewRecipe(recipe)}>
          <span className="text-base leading-none">{recipe?.emoji || '🍲'}</span>
          <p className="font-semibold text-xs sm:text-sm text-slate-800 hover:text-emerald-700 leading-snug line-clamp-2 transition-colors">
            {recipe?.name}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          {recipe?.prepTimeMinutes && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {recipe.prepTimeMinutes}m
            </span>
          )}
          {recipe?.favorite && (
            <span className="flex items-center gap-0.5 text-amber-500 font-medium">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </span>
          )}
        </div>

        <button
          onClick={onAssignClick}
          className="text-emerald-600 hover:text-emerald-800 font-medium text-[11px] hover:underline"
        >
          Cambiar
        </button>
      </div>
    </div>
  );
};
