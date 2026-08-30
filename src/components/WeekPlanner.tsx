'use client';

import React, { useState } from 'react';
import { WeeklyPlan, Recipe, DayOfWeek, DAYS_CONFIG, GenerateMode } from '@/types';
import { MealSlot } from './MealSlot';
import { formatWeekRange, getRelativeWeekMonday, getMonday } from '@/lib/utils';
import { countPlannedSlots } from '@/lib/planUtils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  ShoppingCart,
  Calendar,
  Copy,
  Users,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WeekPlannerProps {
  currentWeekStartDate: string;
  setCurrentWeekStartDate: (date: string) => void;
  weeklyPlan: WeeklyPlan;
  recipes: Recipe[];
  onOpenSlotModal: (day: DayOfWeek, type: 'lunch' | 'dinner') => void;
  onClearSlot: (day: DayOfWeek, type: 'lunch' | 'dinner') => void;
  onViewRecipe: (recipe: Recipe) => void;
  onSmartGenerate: () => void;
  onClearWeek: () => void;
  onCopyPreviousWeek: () => void;
  onGoToShoppingList: () => void;
  generateMode: GenerateMode;
  onGenerateModeChange: (mode: GenerateMode) => void;
  householdServings: number;
  onHouseholdServingsChange: (servings: number) => void;
  warnings: string[];
}

export const WeekPlanner: React.FC<WeekPlannerProps> = ({
  currentWeekStartDate,
  setCurrentWeekStartDate,
  weeklyPlan,
  recipes,
  onOpenSlotModal,
  onClearSlot,
  onViewRecipe,
  onSmartGenerate,
  onClearWeek,
  onCopyPreviousWeek,
  onGoToShoppingList,
  generateMode,
  onGenerateModeChange,
  householdServings,
  onHouseholdServingsChange,
  warnings,
}) => {
  const currentMondayToday = getMonday(new Date());
  const isCurrentWeek = currentWeekStartDate === currentMondayToday;
  const plannedCount = countPlannedSlots(weeklyPlan);

  const recipeMap = new Map<string, Recipe>(recipes.map(r => [r.id, r]));

  const handleGenerateWithCelebration = () => {
    onSmartGenerate();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignorar si no está soportado
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Barra de Control Semanal y Acciones Inteligentes */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Selector y Navegación de Semanas */}
        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setCurrentWeekStartDate(getRelativeWeekMonday(-1, currentWeekStartDate))}
              className="p-2 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentWeekStartDate(currentMondayToday)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isCurrentWeek
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Hoy
            </button>

            <button
              onClick={() => setCurrentWeekStartDate(getRelativeWeekMonday(1, currentWeekStartDate))}
              className="p-2 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Semana Planificada
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 hidden sm:inline" />
              {formatWeekRange(currentWeekStartDate)}
            </span>
          </div>
        </div>

        {/* Resumen de estado & Acciones del Menú */}
        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end flex-wrap">
          
          {/* Indicador de platos completados */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong className="text-slate-900 font-bold">{plannedCount}</strong> de 14 comidas
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <button
              type="button"
              onClick={() => onHouseholdServingsChange(Math.max(2, householdServings - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold"
            >
              −
            </button>
            <span className="text-xs font-bold text-slate-800 w-14 text-center">{householdServings} rac.</span>
            <button
              type="button"
              onClick={() => onHouseholdServingsChange(Math.min(8, householdServings + 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold"
            >
              +
            </button>
          </div>

          <select
            value={generateMode}
            onChange={(e) => onGenerateModeChange(e.target.value as GenerateMode)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-700"
          >
            <option value="full">Semana completa</option>
            <option value="dinners">Solo cenas</option>
            <option value="tuppers">Solo tuppers L–V</option>
          </select>

          <button
            onClick={onCopyPreviousWeek}
            className="p-2.5 rounded-2xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-all"
            title="Copiar semana anterior"
          >
            <Copy className="w-4 h-4" />
          </button>

          {plannedCount > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Vaciar todo el menú de esta semana?')) {
                  onClearWeek();
                }
              }}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all text-xs font-medium"
              title="Vaciar menú de la semana"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleGenerateWithCelebration}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>Generar menú</span>
          </button>

          {/* Botón Ir a Lista de la Compra */}
          <button
            onClick={onGoToShoppingList}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:shadow hover:scale-[1.02]"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Ver Lista Compra</span>
          </button>

        </div>

      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <ul className="text-xs text-amber-900 space-y-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cuadrícula Semanal (7 Columnas Lunes a Domingo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        {DAYS_CONFIG.map((dayConfig, index) => {
          const dayPlan = weeklyPlan.days[dayConfig.id] || {};
          const lunchSlot = dayPlan.lunch;
          const dinnerSlot = dayPlan.dinner;

          const lunchRecipe = lunchSlot?.recipeId ? recipeMap.get(lunchSlot.recipeId) : undefined;
          const dinnerRecipe = dinnerSlot?.recipeId ? recipeMap.get(dinnerSlot.recipeId) : undefined;

          // Es fin de semana?
          const isWeekend = dayConfig.id === 'sabado' || dayConfig.id === 'domingo';

          return (
            <div
              key={dayConfig.id}
              className={`rounded-3xl border transition-all p-3 sm:p-4 flex flex-col justify-between space-y-3 ${
                isWeekend
                  ? 'bg-amber-50/40 border-amber-200/70 shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              
              {/* Cabecera del día */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-800">
                    {dayConfig.label}
                  </span>
                  {isWeekend && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                      Finde
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Día {index + 1}
                </span>
              </div>

              {/* Casilla Comida (Almuerzo) */}
              <div className="space-y-1">
                <MealSlot
                  type="lunch"
                  slotData={lunchSlot}
                  recipe={lunchRecipe}
                  onAssignClick={() => onOpenSlotModal(dayConfig.id, 'lunch')}
                  onClearClick={() => onClearSlot(dayConfig.id, 'lunch')}
                  onViewRecipe={onViewRecipe}
                />
              </div>

              {/* Casilla Cena */}
              <div className="space-y-1">
                <MealSlot
                  type="dinner"
                  slotData={dinnerSlot}
                  recipe={dinnerRecipe}
                  onAssignClick={() => onOpenSlotModal(dayConfig.id, 'dinner')}
                  onClearClick={() => onClearSlot(dayConfig.id, 'dinner')}
                  onViewRecipe={onViewRecipe}
                />
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
