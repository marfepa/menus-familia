'use client';

import React, { useState } from 'react';
import { ExcludedFoodItem } from '@/types';
import { extractMatchKeywords } from '@/lib/pantryUtils';
import {
  Ban,
  Plus,
  Trash2,
  X,
  ShieldAlert,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface ExcludedFoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  excludedFoods: ExcludedFoodItem[];
  onAddExcludedFood: (item: ExcludedFoodItem) => void;
  onRemoveExcludedFood: (id: string) => void;
}

const COMMON_EXCLUSIONS = [
  { name: 'Berenjena', reason: 'Preferencia familiar' },
  { name: 'Cilantro', reason: 'Preferencia familiar' },
  { name: 'Picante', reason: 'No apto para niños' },
  { name: 'Conejo', reason: 'Preferencia familiar' },
  { name: 'Marisco', reason: 'Alergia / Intolerancia' },
  { name: 'Queso azul', reason: 'Preferencia familiar' },
  { name: 'Brócoli', reason: 'No gusta a los niños' },
  { name: 'Cerdo', reason: 'Preferencia familiar' },
];

export const ExcludedFoodsModal: React.FC<ExcludedFoodsModalProps> = ({
  isOpen,
  onClose,
  excludedFoods,
  onAddExcludedFood,
  onRemoveExcludedFood,
}) => {
  const [foodName, setFoodName] = useState('');
  const [reason, setReason] = useState('Preferencia familiar');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const trimmed = foodName.trim();
    // Evitar duplicados
    const exists = excludedFoods.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert(`'${trimmed}' ya está en la lista de alimentos vetados.`);
      return;
    }

    const newItem: ExcludedFoodItem = {
      id: `excluded-${Date.now()}`,
      name: trimmed,
      matchKeywords: extractMatchKeywords(trimmed),
      reason: reason || 'Preferencia familiar',
      addedDate: new Date().toISOString().slice(0, 10),
    };

    onAddExcludedFood(newItem);
    setFoodName('');
  };

  const handleQuickAdd = (preset: { name: string; reason: string }) => {
    const exists = excludedFoods.some(
      (f) => f.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (exists) return;

    const newItem: ExcludedFoodItem = {
      id: `excluded-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: preset.name,
      matchKeywords: extractMatchKeywords(preset.name),
      reason: preset.reason,
      addedDate: new Date().toISOString().slice(0, 10),
    };
    onAddExcludedFood(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Alimentos No Deseados / Vetados
              </h3>
              <p className="text-xs text-slate-500">
                Se excluirán automáticamente al generar los menús semanales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nota informativa */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            El <strong>generador inteligente</strong> descartará cualquier receta que contenga estos ingredientes o palabras clave en su nombre o lista de ingredientes.
          </p>
        </div>

        {/* Formulario para añadir alimento vetado */}
        <form onSubmit={handleAddSubmit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Añadir nuevo alimento a excluir
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Nombre del alimento o ingrediente (ej. Berenjena, Cilantro)..."
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="sm:col-span-6 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
            />

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="sm:col-span-4 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl font-medium"
            >
              <option value="Preferencia familiar">Preferencia familiar</option>
              <option value="No gusta a los niños">No gusta a los niños</option>
              <option value="Alergia / Intolerancia">Alergia / Intolerancia</option>
              <option value="No de temporada">No de temporada</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>

            <button
              type="submit"
              disabled={!foodName.trim()}
              className="sm:col-span-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Vetar</span>
            </button>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 mb-1.5">Sugerencias habituales:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EXCLUSIONS.map((preset) => {
                const isAlready = excludedFoods.some(
                  (f) => f.name.toLowerCase() === preset.name.toLowerCase()
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={isAlready}
                    onClick={() => handleQuickAdd(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      isAlready
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700'
                    }`}
                  >
                    + {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Lista de Alimentos Vetados Actuales */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alimentos actualmente vetados ({excludedFoods.length})
            </h4>
          </div>

          {excludedFoods.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-3xl">✨</span>
              <p className="text-xs text-slate-500 font-medium mt-1">
                No hay alimentos vetados. Todos los platos del recetario están disponibles para el planificador.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {excludedFoods.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                      <Ban className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.name}
                      </p>
                      {item.reason && (
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveExcludedFood(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Permitir de nuevo este alimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de Cierre */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
