'use client';

import React, { useState, useMemo } from 'react';
import {
  DynamicPantryItem,
  IngredientCategory,
  PackageFormat,
  CATEGORY_LABELS,
  PACKAGE_FORMAT_CONFIG,
} from '@/types';
import { ShelfLifeBattery } from '@/components/ShelfLifeBattery';
import { calculateShelfLifeInfo, getEstimatedShelfLifeDays, extractMatchKeywords } from '@/lib/pantryUtils';
import {
  Refrigerator,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  Flame,
  Search,
  CheckCircle2,
  X,
  Package,
  Calendar,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface PantryViewProps {
  pantry: DynamicPantryItem[];
  onRemoveItem: (id: string) => void;
  onAddItem: (item: DynamicPantryItem) => void;
  onUpdateItem: (item: DynamicPantryItem) => void;
  onToggleStock: (id: string) => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  pantry,
  onRemoveItem,
  onAddItem,
  onUpdateItem,
  onToggleStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'urgent' | 'medium' | 'fresh' | 'staple'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State para añadir alimento manual
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<IngredientCategory>('fruteria');
  const [formShelfLife, setFormShelfLife] = useState<number>(7);
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formPackageFormat, setFormPackageFormat] = useState<PackageFormat>('granel');

  // Estadísticas globales de despensa
  const stats = useMemo(() => {
    let freshCount = 0;
    let mediumCount = 0;
    let urgentCount = 0;
    let expiredCount = 0;
    let stapleCount = 0;

    pantry.forEach((item) => {
      if (!item.inStock) return;
      if (item.source === 'staple') stapleCount++;
      const info = calculateShelfLifeInfo(item);
      if (info.status === 'expired') expiredCount++;
      else if (info.status === 'critical') urgentCount++;
      else if (info.status === 'medium') mediumCount++;
      else freshCount++;
    });

    return {
      total: pantry.filter((i) => i.inStock).length,
      freshCount,
      mediumCount,
      urgentCount: urgentCount + expiredCount,
      stapleCount,
    };
  }, [pantry]);

  // Filtrado de alimentos
  const filteredPantry = useMemo(() => {
    return pantry.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchKw = item.matchKeywords?.some((k) => k.toLowerCase().includes(query));
        if (!matchName && !matchKw) return false;
      }

      if (selectedStatusFilter !== 'all') {
        const info = calculateShelfLifeInfo(item);
        if (selectedStatusFilter === 'urgent') {
          return info.status === 'critical' || info.status === 'expired';
        }
        if (selectedStatusFilter === 'medium') {
          return info.status === 'medium';
        }
        if (selectedStatusFilter === 'fresh') {
          return info.status === 'fresh';
        }
        if (selectedStatusFilter === 'staple') {
          return item.source === 'staple';
        }
      }

      return true;
    });
  }, [pantry, selectedCategory, searchTerm, selectedStatusFilter]);

  const handleOpenAddModal = (category: IngredientCategory = 'fruteria') => {
    setFormCategory(category);
    setFormShelfLife(getEstimatedShelfLifeDays('', category));
    setFormName('');
    setFormQuantity('');
    setFormUnit('');
    setFormPackageFormat('granel');
    setIsAddModalOpen(true);
  };

  const handleFormCategoryChange = (cat: IngredientCategory) => {
    setFormCategory(cat);
    setFormShelfLife(getEstimatedShelfLifeDays(formName, cat));
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newItem: DynamicPantryItem = {
      id: `pantry-manual-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      inStock: true,
      addedDate: new Date().toISOString().slice(0, 10),
      shelfLifeDays: Math.max(1, formShelfLife),
      quantity: formQuantity ? parseFloat(formQuantity) : undefined,
      unit: formUnit.trim() || undefined,
      commercialFormat: formQuantity ? `${formQuantity} ${formUnit || ''}`.trim() : undefined,
      packageFormat: formPackageFormat,
      matchKeywords: extractMatchKeywords(formName.trim()),
      source: 'manual',
    };

    onAddItem(newItem);
    setIsAddModalOpen(false);
  };

  const handleAdjustDays = (item: DynamicPantryItem, deltaDays: number) => {
    const currentTotal = item.shelfLifeDays || getEstimatedShelfLifeDays(item.name, item.category);
    const nextTotal = Math.max(1, currentTotal + deltaDays);
    onUpdateItem({
      ...item,
      shelfLifeDays: nextTotal,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner Principal de Despensa Inteligente */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 p-6 sm:p-7 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
              <Refrigerator className="w-3.5 h-3.5" />
              <span>Despensa Viva & Contador de Frescura</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>Mi Despensa y Nevera</span>
              <span className="text-2xl">🔋</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Los alimentos comprados en la lista se incorporan con su <strong className="text-emerald-300">batería de caducidad</strong>. Mientras estén disponibles, no se añadirán de nuevo a la lista de compra para futuros menús.
            </p>
          </div>

          {/* Botón de añadir alimento manual */}
          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleOpenAddModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir alimento directo</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Estadísticas / Semáforo de Baterías */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-white/20 border-white/40 shadow-inner'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <p className="text-[11px] font-bold text-slate-300">Total en Stock</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.total}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('urgent')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'urgent'
                ? 'bg-rose-500/30 border-rose-400 shadow-inner'
                : 'bg-rose-950/30 border-rose-800/40 hover:bg-rose-900/40'
            }`}
          >
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <p className="text-[11px] font-bold text-rose-300">¡Consumir hoy!</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-200 mt-0.5">{stats.urgentCount}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('medium')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'medium'
                ? 'bg-amber-500/30 border-amber-400 shadow-inner'
                : 'bg-amber-950/30 border-amber-800/40 hover:bg-amber-900/40'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[11px] font-bold text-amber-300">Consumir pronto</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-200 mt-0.5">{stats.mediumCount}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('fresh')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'fresh'
                ? 'bg-emerald-500/30 border-emerald-400 shadow-inner'
                : 'bg-emerald-950/30 border-emerald-800/40 hover:bg-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[11px] font-bold text-emerald-300">Frescura óptima</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-200 mt-0.5">{stats.freshCount}</p>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en despensa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({pantry.length})
          </button>

          {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
            const count = pantry.filter((i) => i.category === key).length;
            if (count === 0 && selectedCategory !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name.split(' ')[0]}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Alimentos en Despensa */}
      {filteredPantry.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <span className="text-4xl">🥑</span>
          <h3 className="font-bold text-slate-800 text-base mt-3">No hay alimentos en este filtro</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {pantry.length === 0
              ? 'Cuando marques artículos como comprados en la Lista de Compra o pulses "+ Añadir alimento directo", aparecerán aquí con su contador de frescura.'
              : 'Prueba a cambiar el filtro de estado o la búsqueda para ver otros alimentos.'}
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir alimento ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPantry.map((item) => {
            const catInfo = item.category ? CATEGORY_LABELS[item.category] : CATEGORY_LABELS.despensa;
            const pkgConfig = item.packageFormat
              ? PACKAGE_FORMAT_CONFIG[item.packageFormat]
              : null;
            const info = calculateShelfLifeInfo(item);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                  !item.inStock
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : info.status === 'expired'
                    ? 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/10'
                    : info.status === 'critical'
                    ? 'border-orange-200 hover:border-orange-300 ring-1 ring-orange-500/10'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Fila Superior: Categoría e Interruptor de Stock */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base">{catInfo.emoji}</span>
                      <span className="text-[11px] font-bold text-slate-500 truncate">
                        {catInfo.name}
                      </span>
                    </div>

                    {item.source === 'staple' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        Fondo despensa
                      </span>
                    )}
                  </div>

                  {/* Nombre y Formato */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm sm:text-base font-black ${item.inStock ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {item.name}
                      </h4>
                      {pkgConfig && (
                        <span
                          className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${pkgConfig.bg} ${pkgConfig.text} ${pkgConfig.border}`}
                        >
                          <span>{pkgConfig.emoji}</span>
                          <span>{pkgConfig.label}</span>
                        </span>
                      )}
                    </div>

                    {item.commercialFormat && (
                      <p className="text-xs text-slate-500 font-medium">
                        📦 {item.commercialFormat}
                      </p>
                    )}
                  </div>

                  {/* Componente de Batería de Frescura Premium */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <ShelfLifeBattery item={item} />
                  </div>
                </div>

                {/* Botones de Acción Rápida */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustDays(item, -1)}
                      title="Reducir 1 día de vida útil"
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      -1d
                    </button>
                    <button
                      onClick={() => handleAdjustDays(item, 1)}
                      title="Añadir 1 día de vida útil"
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      +1d
                    </button>
                    <button
                      onClick={() => handleAdjustDays(item, 7)}
                      title="Extender 1 semana"
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      +7d
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Se ha acabado: retirar de la despensa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Se ha acabado</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Añadir Alimento Manual a la Despensa */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Refrigerator className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Añadir alimento a la Despensa</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del alimento / producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Salmón fresco, Pimientos, Arroz, Huevos..."
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formShelfLife || formShelfLife === 7) {
                      setFormShelfLife(getEstimatedShelfLifeDays(e.target.value, formCategory));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => handleFormCategoryChange(e.target.value as IngredientCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Formato de envase</label>
                  <select
                    value={formPackageFormat}
                    onChange={(e) => setFormPackageFormat(e.target.value as PackageFormat)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {Object.entries(PACKAGE_FORMAT_CONFIG).map(([key, fmt]) => (
                      <option key={key} value={key}>
                        {fmt.emoji} {fmt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad / Detalle</label>
                  <input
                    type="text"
                    placeholder="ej. 500g, 1 Malla, 2 uds"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vida útil estimada (Días) 🔋
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="730"
                    value={formShelfLife}
                    onChange={(e) => setFormShelfLife(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Botones de sugerencias rápidas de días */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400">Presets rápidos:</span>
                {[
                  { label: 'Pescado (3d)', days: 3 },
                  { label: 'Carne (4d)', days: 4 },
                  { label: 'Frescos (7d)', days: 7 },
                  { label: 'Lácteos (18d)', days: 18 },
                  { label: 'Huevos (28d)', days: 28 },
                  { label: 'Despensa (180d)', days: 180 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setFormShelfLife(preset.days)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      formShelfLife === preset.days
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all"
                >
                  Guardar en Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
