'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingItem, IngredientCategory, CATEGORY_LABELS, ShoppingPeriod } from '@/types';
import { formatShoppingListForShare } from '@/lib/shoppingListGenerator';
import { formatWeekRange } from '@/lib/utils';
import {
  Share2,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Building2,
  Home,
  Globe,
  Copy,
  Check,
  Package
} from 'lucide-react';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  weekStartDate: string;
  onToggleItem: (itemId: string) => void;
  onAddItem: (name: string, quantity: number | undefined, unit: string, category: IngredientCategory) => void;
  onDeleteItem: (itemId: string) => void;
  onClearChecked: () => void;
  onRegenerateFromMenu: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  weekStartDate,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearChecked,
  onRegenerateFromMenu,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ShoppingPeriod>('all');
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<string>('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState<IngredientCategory>('fruteria');
  const [copied, setCopied] = useState(false);

  const weekRange = formatWeekRange(weekStartDate);

  // Filtrar items por el tramo seleccionado
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (selectedPeriod === 'all') return true;
      if (item.isCustom) return true;
      return item.period === selectedPeriod || item.period === 'both';
    });
  }, [items, selectedPeriod]);

  // Agrupar items visibles por categoría
  const groupedItems = useMemo(() => {
    const map = new Map<IngredientCategory, ShoppingItem[]>();
    
    const categoryOrder: IngredientCategory[] = [
      'fruteria',
      'carniceria',
      'pescaderia',
      'lacteos',
      'despensa',
      'panaderia',
      'congelados',
      'otros',
    ];

    categoryOrder.forEach(cat => map.set(cat, []));

    visibleItems.forEach(item => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });

    return map;
  }, [visibleItems]);

  // Contadores
  const totalCount = visibleItems.length;
  const checkedCount = visibleItems.filter(i => i.checked).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const handleShareWhatsApp = () => {
    const text = formatShoppingListForShare(items, weekRange, selectedPeriod);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleCopyClipboard = async () => {
    const text = formatShoppingListForShare(items, weekRange, selectedPeriod);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddItem(
      customName.trim(),
      customQty ? parseFloat(customQty) : undefined,
      customUnit.trim(),
      customCategory
    );

    setCustomName('');
    setCustomQty('');
    setCustomUnit('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Cabecera Principal y Barra de Acciones */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🛒</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Lista de la Compra
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Formato por packs de supermercado para optimizar consumo y reducir desperdicio <span className="font-semibold text-slate-700">({weekRange})</span>.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          
          <button
            onClick={onRegenerateFromMenu}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Sincronizar con los últimos cambios del menú"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sincronizar menú</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp ({selectedPeriod === 'weekday' ? 'L-V' : selectedPeriod === 'weekend' ? 'Finde' : 'Todo'})</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

        </div>
      </div>

      {/* Selector de División por Tramos de Compra (L-V vs Finde vs Todo) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 no-print">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pl-2">
          <span>Tramo de compra:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Semana Completa</span>
          </button>

          <button
            onClick={() => setSelectedPeriod('weekday')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'weekday'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>🏢 L-V Mediodía (Oficina)</span>
          </button>

          <button
            onClick={() => setSelectedPeriod('weekend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'weekend'
                ? 'bg-white text-indigo-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-indigo-600" />
            <span>🏠 Viernes Noche a Domingo</span>
          </button>
        </div>
      </div>

      {/* Barra de Progreso de Compra */}
      {totalCount > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {progressPercent}%
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {checkedCount} de {totalCount} productos en el carrito
              </p>
              <p className="text-xs text-slate-500">
                {totalCount - checkedCount === 0
                  ? '🎉 ¡Compra completada!'
                  : `Quedan ${totalCount - checkedCount} artículos por comprar`}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {checkedCount > 0 && (
              <button
                onClick={onClearChecked}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:underline whitespace-nowrap"
              >
                Limpiar tachados
              </button>
            )}
          </div>
        </div>
      )}

      {/* Formulario para Añadir Artículos Manuales (Fuera de Menú) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Añadir producto extra (pañales, meriendas niños, café, hogar...)</span>
        </h3>

        <form onSubmit={handleAddCustomSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Nombre del producto (ej. Plátanos maduros, Papel cocina)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-2 w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <input
            type="number"
            step="any"
            placeholder="Cant."
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            className="w-full sm:w-20 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-center"
          />

          <input
            type="text"
            placeholder="Ud (l, kg, pack)"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            className="w-full sm:w-24 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-center"
          />

          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value as IngredientCategory)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!customName.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all whitespace-nowrap"
          >
            Añadir
          </button>
        </form>
      </div>

      {/* Lista agrupada por Secciones / Pasillos */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <span className="text-4xl">🥑</span>
          <h3 className="font-bold text-slate-800 text-base mt-3">No hay productos en este tramo</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Planifica platos en el <strong>Menú Semanal</strong> y pulsa &ldquo;Sincronizar menú&rdquo;, o selecciona &ldquo;Semana Completa&rdquo; arriba.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(groupedItems.entries()).map(([catKey, catItems]) => {
            if (catItems.length === 0) return null;
            const catInfo = CATEGORY_LABELS[catKey as IngredientCategory];

            return (
              <div
                key={catKey}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Título de la sección de supermercado */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{catInfo.emoji}</span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {catInfo.name}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {catItems.length}
                    </span>
                  </div>

                  {/* Items de la sección */}
                  <div className="space-y-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleItem(item.id)}
                        className={`group flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                          item.checked
                            ? 'bg-slate-50 border-slate-100 text-slate-400'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            className="text-slate-400 group-hover:text-emerald-600 transition-colors mt-0.5"
                          >
                            {item.checked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs sm:text-sm font-semibold ${
                                item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
                              }`}
                            >
                              {item.name}
                            </p>
                            
                            {/* Badges de Recetas e Indicador de Pack */}
                            {item.recipeSource && item.recipeSource.length > 0 && !item.checked && (
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {item.recipeSource.length > 1 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                    <Package className="w-3 h-3" /> Pack compartido ({item.recipeSource.length} recetas)
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 truncate">
                                  {item.recipeSource.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cantidad y botón eliminar */}
                        <div className="flex items-center gap-2 shrink-0 ml-2 mt-0.5">
                          {item.quantity !== undefined && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                item.checked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {item.quantity} {item.unit || ''}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem(item.id);
                            }}
                            className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all no-print"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
