'use client';

import React, { useMemo } from 'react';
import { WeeklyPlan, Recipe, DayOfWeek, DAYS_CONFIG, GenerateMode } from '@/types';
import { MealSlot } from './MealSlot';
import { formatWeekRange, getRelativeWeekMonday, getMonday } from '@/lib/utils';
import { countPlannedSlots, getPlanCookingSessions, SlotCookingContext } from '@/lib/planUtils';
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
  onViewRecipe: (recipe: Recipe, context?: SlotCookingContext) => void;
  onSmartGenerate: () => void;
  onClearWeek: () => void;
  onCopyPreviousWeek: () => void;
  onGoToShoppingList: () => void;
  generateMode: GenerateMode;
  onGenerateModeChange: (mode: GenerateMode) => void;
  householdServings: number;
  onHouseholdServingsChange: (servings: number) => void;
  warnings: string[];
  prioritizeAirFryerDinners?: boolean;
  onToggleAirFryerDinners?: (val: boolean) => void;
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
  prioritizeAirFryerDinners,
  onToggleAirFryerDinners,
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
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Barra de Control Semanal y Acciones Inteligentes */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        
        {/* Fila 1: Selector y Navegación de Semanas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setCurrentWeekStartDate(getRelativeWeekMonday(-1, currentWeekStartDate))}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all active:scale-95"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentWeekStartDate(currentMondayToday)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isCurrentWeek
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Hoy
              </button>

              <button
                onClick={() => setCurrentWeekStartDate(getRelativeWeekMonday(1, currentWeekStartDate))}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all active:scale-95"
                title="Semana siguiente"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Semana Planificada
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 justify-end sm:justify-start">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                {formatWeekRange(currentWeekStartDate)}
              </span>
            </div>
          </div>

          {/* Indicador de estado y comensales */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Indicador de platos completados */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>
                <strong className="text-slate-900 font-bold">{plannedCount}</strong>/14 comidas
              </span>
            </div>

            {/* Contador de comensales */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <button
                type="button"
                onClick={() => onHouseholdServingsChange(Math.max(2, householdServings - 1))}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                title="Menos comensales"
              >
                −
              </button>
              <span className="text-xs font-bold text-slate-800 w-12 sm:w-14 text-center">{householdServings} rac.</span>
              <button
                type="button"
                onClick={() => onHouseholdServingsChange(Math.min(8, householdServings + 1))}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                title="Más comensales"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Fila 2: Modos, Herramientas secundarias y Acciones Principales */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-0.5">
          
          {/* Herramientas de Planificación (Modo, Air-Fryer, Copiar, Vaciar) */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={generateMode}
              onChange={(e) => onGenerateModeChange(e.target.value as GenerateMode)}
              className="text-xs font-bold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            >
              <option value="full">Semana completa</option>
              <option value="dinners">Solo cenas</option>
              <option value="tuppers">Solo tuppers L–V</option>
            </select>

            {/* Toggle Air-Fryer en Cenas */}
            <button
              type="button"
              onClick={() => onToggleAirFryerDinners?.(!prioritizeAirFryerDinners)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                prioritizeAirFryerDinners
                  ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 shadow-2xs'
              }`}
              title="Priorizar recetas rápidas de Air-Fryer en las cenas de la semana"
            >
              <span>♨️</span>
              <span className="text-xs">Air-Fryer</span>
            </button>

            {/* Copiar semana anterior */}
            <button
              onClick={onCopyPreviousWeek}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 border border-slate-200/80 transition-all text-xs font-medium shadow-2xs"
              title="Copiar menú de la semana anterior"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Copiar</span>
            </button>

            {/* Vaciar semana */}
            {plannedCount > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Vaciar todo el menú de esta semana?')) {
                    onClearWeek();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all text-xs font-medium shadow-2xs"
                title="Vaciar menú de la semana"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
          </div>

          {/* Botones de Acción Primaria */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              onClick={handleGenerateWithCelebration}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 hover:shadow transition-all active:scale-[0.98] text-center"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
              <span>Generar menú</span>
            </button>

            <button
              onClick={onGoToShoppingList}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.98] text-center"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Ver Compra</span>
            </button>
          </div>

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

      {/* Cuadrícula Semanal Homogénea (7 Columnas Lunes a Domingo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {(() => {
          const cookingSessions = getPlanCookingSessions(weeklyPlan);
          return DAYS_CONFIG.map((dayConfig, index) => {
            const dayPlan = weeklyPlan.days[dayConfig.id] || {};
            const lunchSlot = dayPlan.lunch;
            const dinnerSlot = dayPlan.dinner;

            const lunchRecipe = lunchSlot?.recipeId ? recipeMap.get(lunchSlot.recipeId) : undefined;
            const dinnerRecipe = dinnerSlot?.recipeId ? recipeMap.get(dinnerSlot.recipeId) : undefined;

            const lunchContext = cookingSessions.get(`${dayConfig.id}-lunch`);
            const dinnerContext = cookingSessions.get(`${dayConfig.id}-dinner`);

            const isWeekend = dayConfig.id === 'sabado' || dayConfig.id === 'domingo';

            return (
              <div
                key={dayConfig.id}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-all p-3 sm:p-3.5 flex flex-col space-y-2.5"
              >
                
                {/* Cabecera del día */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 h-7">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                      {dayConfig.label}
                    </span>
                    {isWeekend && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 uppercase tracking-wider">
                        Finde
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Día {index + 1}
                  </span>
                </div>

                {/* Casilla Comida (Almuerzo) */}
                <MealSlot
                  type="lunch"
                  slotData={lunchSlot}
                  recipe={lunchRecipe}
                  cookingContext={lunchContext}
                  onAssignClick={() => onOpenSlotModal(dayConfig.id, 'lunch')}
                  onClearClick={() => onClearSlot(dayConfig.id, 'lunch')}
                  onViewRecipe={onViewRecipe}
                />

                {/* Casilla Cena */}
                <MealSlot
                  type="dinner"
                  slotData={dinnerSlot}
                  recipe={dinnerRecipe}
                  cookingContext={dinnerContext}
                  onAssignClick={() => onOpenSlotModal(dayConfig.id, 'dinner')}
                  onClearClick={() => onClearSlot(dayConfig.id, 'dinner')}
                  onViewRecipe={onViewRecipe}
                />

              </div>
            );
          });
        })()}
      </div>

    </div>
  );
};
