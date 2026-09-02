'use client';

import React from 'react';
import { Recipe, MealSlotData } from '@/types';
import { getSlotKind, SlotCookingContext } from '@/lib/planUtils';
import { Plus, Clock, Star, X, Eye, RefreshCw } from 'lucide-react';

interface MealSlotProps {
  type: 'lunch' | 'dinner';
  slotData?: MealSlotData;
  recipe?: Recipe;
  cookingContext?: SlotCookingContext;
  onAssignClick: () => void;
  onClearClick: () => void;
  onViewRecipe: (recipe: Recipe, context?: SlotCookingContext) => void;
}

export const MealSlot: React.FC<MealSlotProps> = ({
  type,
  slotData,
  recipe,
  cookingContext,
  onAssignClick,
  onClearClick,
  onViewRecipe,
}) => {
  const isLunch = type === 'lunch';
  const label = isLunch ? 'Comida' : 'Cena';
  const iconEmoji = isLunch ? '☀️' : '🌙';
  const kind = getSlotKind(slotData);

  // 1. Estado Vacío
  if (kind === 'empty') {
    return (
      <div
        onClick={onAssignClick}
        className="group relative rounded-2xl border border-dashed border-slate-200/90 hover:border-emerald-400/80 bg-slate-50/40 hover:bg-emerald-50/30 p-3 transition-all duration-150 flex flex-col justify-between h-[132px] cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Elegir ${label}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span>{iconEmoji}</span> {label}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center my-auto text-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 group-hover:border-emerald-300 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-all shadow-2xs group-hover:scale-105">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 group-hover:text-emerald-700 transition-colors">
            Elegir plato
          </span>
        </div>

        <div className="h-4" />
      </div>
    );
  }

  // 2. Estado Fuera de casa
  if (kind === 'out') {
    return (
      <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-2xs h-[132px] flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span>{iconEmoji}</span> {label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearClick();
            }}
            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-white/80 transition-colors"
            title="Quitar"
            aria-label="Quitar plato fuera de casa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="my-auto">
          <p className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">Comemos fuera</p>
          <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-600 uppercase tracking-wider">
            Sin compra
          </span>
        </div>

        <div className="flex items-center justify-end pt-1.5 border-t border-slate-200/50 text-[10px]">
          <button
            onClick={onAssignClick}
            className="text-slate-500 hover:text-emerald-700 font-medium hover:underline"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  // 3. Estado Plato Libre / Personalizado
  if (kind === 'custom' || (!recipe && slotData?.customName)) {
    return (
      <div className="group relative rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3 shadow-2xs hover:shadow-xs transition-all h-[132px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-amber-700/80 uppercase tracking-wider flex items-center gap-1">
            <span>{iconEmoji}</span> {label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearClick();
            }}
            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-white/80 transition-colors"
            title="Quitar"
            aria-label="Quitar plato personalizado"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="my-auto">
          <p className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug">
            {slotData?.customName}
          </p>
        </div>

        <div className="flex items-center justify-end pt-1.5 border-t border-amber-200/40 text-[10px]">
          <button
            onClick={onAssignClick}
            className="text-amber-800 hover:text-amber-950 font-medium hover:underline"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  // 4. Estado Receta Planificada o Sobras
  const isLeftover = kind === 'leftover';

  return (
    <div
      className={`group relative rounded-2xl border p-3 shadow-2xs hover:shadow-xs transition-all duration-150 h-[132px] flex flex-col justify-between ${
        isLeftover
          ? 'border-teal-200/90 bg-teal-50/40 hover:border-teal-300'
          : 'border-slate-200/80 hover:border-slate-300 bg-white'
      }`}
    >
      {/* Cabecera del Slot */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            isLunch ? 'text-amber-700/90' : 'text-indigo-700/90'
          }`}
        >
          <span>{iconEmoji}</span> {label}
        </span>

        {/* Acciones directas sutiles */}
        <div className="flex items-center gap-0.5 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => recipe && onViewRecipe(recipe, cookingContext)}
            className="text-slate-400 hover:text-emerald-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            title="Ver receta y preparación"
            aria-label="Ver detalles de la receta"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearClick}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
            title="Quitar plato"
            aria-label="Quitar plato de este día"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cuerpo: Nombre de la receta con emoji */}
      <div
        className="my-auto flex items-start gap-1.5 cursor-pointer"
        onClick={() => recipe && onViewRecipe(recipe, cookingContext)}
        title={recipe?.name}
      >
        <span className="text-sm sm:text-base leading-none shrink-0 mt-0.5">{recipe?.emoji || '🍲'}</span>
        <p className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-700 leading-snug line-clamp-2 transition-colors">
          {recipe?.name}
        </p>
      </div>

      {/* Pie: Metadatos sutiles y botón cambiar */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
        <div className="flex items-center gap-1 flex-wrap overflow-hidden">
          {isLeftover && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-teal-100/90 text-teal-800 font-bold text-[9px] uppercase tracking-wide">
              {isLunch ? 'Tupper' : 'Sobra'}
            </span>
          )}
          {!isLeftover && cookingContext && cookingContext.leftoverCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-100/90 text-indigo-800 font-bold text-[9px]"
              title={`Cocina para ${cookingContext.totalInstances} comidas (${cookingContext.leftoverCount} de tupper/sobra)`}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              x{cookingContext.totalInstances}
            </span>
          )}
          {!isLeftover && recipe?.prepTimeMinutes ? (
            <span className="flex items-center gap-0.5 text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              {recipe.prepTimeMinutes}m
            </span>
          ) : null}
          {recipe?.favorite && (
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
          )}
        </div>

        <button
          onClick={onAssignClick}
          className="text-slate-400 hover:text-emerald-700 font-medium hover:underline shrink-0 ml-1"
        >
          Cambiar
        </button>
      </div>
    </div>
  );
};
