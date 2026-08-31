'use client';

import React, { useState, useMemo } from 'react';
import {
  DynamicPantryItem,
  IngredientCategory,
  PackageFormat,
  PantryZone,
  CATEGORY_LABELS,
  PACKAGE_FORMAT_CONFIG,
  PANTRY_ZONES_CONFIG,
} from '@/types';
import { ShelfLifeBattery } from '@/components/ShelfLifeBattery';
import {
  calculateShelfLifeInfo,
  getEstimatedShelfLifeDays,
  extractMatchKeywords,
  getPantryZoneForItem,
} from '@/lib/pantryUtils';
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
  LayoutGrid,
  Store,
  ChevronRight,
  Check,
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
  const [viewMode, setViewMode] = useState<'zones' | 'list'>('zones');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'urgent' | 'medium' | 'fresh'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Barra de adición rápida superior
  const [quickName, setQuickName] = useState('');
  const [quickZone, setQuickZone] = useState<PantryZone>('nevera');

  // Form State para modal detallado
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<IngredientCategory>('carniceria');
  const [formShelfLife, setFormShelfLife] = useState<number>(4);
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formPackageFormat, setFormPackageFormat] = useState<PackageFormat>('bandeja');

  // Estadísticas globales de despensa
  const stats = useMemo(() => {
    let freshCount = 0;
    let mediumCount = 0;
    let urgentCount = 0;
    let expiredCount = 0;

    pantry.forEach((item) => {
      if (!item.inStock) return;
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
    };
  }, [pantry]);

  // Agrupar items por Zonas Físicas de Cocina
  const itemsByZone = useMemo(() => {
    const map = new Map<PantryZone, DynamicPantryItem[]>();
    const zoneKeys: PantryZone[] = ['nevera', 'frescos', 'despensa_seca', 'panera', 'congelador'];
    zoneKeys.forEach((z) => map.set(z, []));

    pantry.forEach((item) => {
      // Filtrar por búsqueda si existe
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchKw = item.matchKeywords?.some((k) => k.toLowerCase().includes(query));
        if (!matchName && !matchKw) return;
      }

      // Filtrar por estado de urgencia si está activo
      if (selectedStatusFilter !== 'all') {
        const info = calculateShelfLifeInfo(item);
        if (selectedStatusFilter === 'urgent' && info.status !== 'critical' && info.status !== 'expired') return;
        if (selectedStatusFilter === 'medium' && info.status !== 'medium') return;
        if (selectedStatusFilter === 'fresh' && info.status !== 'fresh') return;
      }

      const zone = getPantryZoneForItem(item);
      const list = map.get(zone) || [];
      list.push(item);
      map.set(zone, list);
    });

    return map;
  }, [pantry, searchTerm, selectedStatusFilter]);

  // Lista plana filtrada para la vista en cuadrícula
  const flatFilteredPantry = useMemo(() => {
    return pantry.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchKw = item.matchKeywords?.some((k) => k.toLowerCase().includes(query));
        if (!matchName && !matchKw) return false;
      }

      if (selectedZoneFilter !== 'all') {
        const zone = getPantryZoneForItem(item);
        if (zone !== selectedZoneFilter) return false;
      }

      if (selectedStatusFilter !== 'all') {
        const info = calculateShelfLifeInfo(item);
        if (selectedStatusFilter === 'urgent' && info.status !== 'critical' && info.status !== 'expired') return false;
        if (selectedStatusFilter === 'medium' && info.status !== 'medium') return false;
        if (selectedStatusFilter === 'fresh' && info.status !== 'fresh') return false;
      }

      return true;
    });
  }, [pantry, searchTerm, selectedZoneFilter, selectedStatusFilter]);

  // Guardar alimento rápido desde la barra superior
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    const zoneCfg = PANTRY_ZONES_CONFIG[quickZone];
    const defaultCat = zoneCfg.categories[0] || 'despensa';
    const shelfLife = getEstimatedShelfLifeDays(quickName.trim(), defaultCat);

    const newItem: DynamicPantryItem = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: quickName.trim(),
      category: defaultCat,
      inStock: true,
      addedDate: new Date().toISOString().slice(0, 10),
      shelfLifeDays: shelfLife,
      matchKeywords: extractMatchKeywords(quickName.trim()),
      source: 'manual',
    };

    onAddItem(newItem);
    setQuickName('');
  };

  // Añadir preset directo con 1 clic desde una zona
  const handleAddPreset = (preset: { name: string; category: IngredientCategory; shelfLifeDays: number; defaultFormat?: string }) => {
    const newItem: DynamicPantryItem = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      category: preset.category,
      inStock: true,
      addedDate: new Date().toISOString().slice(0, 10),
      shelfLifeDays: preset.shelfLifeDays,
      commercialFormat: preset.defaultFormat,
      matchKeywords: extractMatchKeywords(preset.name),
      source: 'manual',
    };
    onAddItem(newItem);
  };

  const handleOpenAddModal = (initialZone?: PantryZone) => {
    if (initialZone) {
      const zoneCfg = PANTRY_ZONES_CONFIG[initialZone];
      const cat = zoneCfg.categories[0] || 'carniceria';
      setFormCategory(cat);
      setFormShelfLife(getEstimatedShelfLifeDays('', cat));
    } else {
      setFormCategory('carniceria');
      setFormShelfLife(4);
    }
    setFormName('');
    setFormQuantity('');
    setFormUnit('');
    setFormPackageFormat('granel');
    setIsAddModalOpen(true);
  };

  const handleSaveModalItem = (e: React.FormEvent) => {
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
      {/* Banner Principal Estilo Cocina Real */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-bold border border-emerald-400/20">
              <Refrigerator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventario Real de Cocina & Contador de Frescura</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>Mi Despensa & Nevera</span>
              <span className="text-2xl sm:text-3xl">🏠🧊🥫</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tus alimentos organizados por compartimentos reales de cocina con <strong className="text-emerald-300 font-bold">batería de caducidad</strong>. Al tachar la compra se incorporan solos y se descuentan de futuros menús.
            </p>
          </div>

          {/* Selector de Modo de Vista y Botón Añadir */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end shrink-0">
            <div className="inline-flex p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <button
                onClick={() => setViewMode('zones')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'zones'
                    ? 'bg-emerald-400 text-emerald-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Zonas de Cocina</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-emerald-400 text-emerald-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cuadrícula</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Alimento</span>
            </button>
          </div>
        </div>

        {/* Semáforo de Baterías y KPIs de Frescura */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-white/20 border-white/40 shadow-inner ring-1 ring-white/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <p className="text-[11px] font-bold text-slate-300">Total Alimentos</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('urgent')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'urgent'
                ? 'bg-rose-500/40 border-rose-300 shadow-inner ring-1 ring-rose-400'
                : 'bg-rose-950/40 border-rose-800/40 hover:bg-rose-900/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <p className="text-[11px] font-bold text-rose-300">¡Consumir ya!</p>
            </div>
            <p className="text-2xl font-black text-rose-200 mt-0.5">{stats.urgentCount}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('medium')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'medium'
                ? 'bg-amber-500/40 border-amber-300 shadow-inner ring-1 ring-amber-400'
                : 'bg-amber-950/40 border-amber-800/40 hover:bg-amber-900/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[11px] font-bold text-amber-300">Consumir pronto</p>
            </div>
            <p className="text-2xl font-black text-amber-200 mt-0.5">{stats.mediumCount}</p>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('fresh')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'fresh'
                ? 'bg-emerald-500/40 border-emerald-300 shadow-inner ring-1 ring-emerald-400'
                : 'bg-emerald-950/40 border-emerald-800/40 hover:bg-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[11px] font-bold text-emerald-300">Frescura óptima</p>
            </div>
            <p className="text-2xl font-black text-emerald-200 mt-0.5">{stats.freshCount}</p>
          </button>
        </div>
      </div>

      {/* Barra de Entrada Rápida de Alimentos (1 clic) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Añadir alimento directo a la cocina (Guardado en 1 clic)</span>
        </h3>

        <form onSubmit={handleQuickAddSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="¿Qué alimento quieres guardar? (ej. Salmón fresco, Plátanos, Garbanzos, Pan de molde)..."
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            className="sm:col-span-6 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <select
            value={quickZone}
            onChange={(e) => setQuickZone(e.target.value as PantryZone)}
            className="sm:col-span-4 px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            {Object.entries(PANTRY_ZONES_CONFIG).map(([key, z]) => (
              <option key={key} value={key}>
                {z.emoji} {z.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!quickName.trim()}
            className="sm:col-span-2 px-4 py-2.5 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </form>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por nombre o ingrediente..."
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

        {/* Filtro por Zona para Cuadrícula */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedZoneFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedZoneFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las zonas ({pantry.length})
          </button>

          {Object.entries(PANTRY_ZONES_CONFIG).map(([key, z]) => {
            const count = pantry.filter((i) => getPantryZoneForItem(i) === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedZoneFilter(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedZoneFilter === key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{z.emoji}</span>
                <span>{z.name.split('/')[0].trim()}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VISTA 1: ESTRUCTURA REAL POR ZONAS FÍSICAS DE COCINA */}
      {viewMode === 'zones' && (
        <div className="space-y-8">
          {(Object.entries(PANTRY_ZONES_CONFIG) as [PantryZone, typeof PANTRY_ZONES_CONFIG[PantryZone]][]).map(
            ([zoneKey, zoneCfg]) => {
              if (selectedZoneFilter !== 'all' && selectedZoneFilter !== zoneKey) return null;
              const zoneItems = itemsByZone.get(zoneKey) || [];

              return (
                <section
                  key={zoneKey}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
                >
                  {/* Cabecera del Compartimento de Cocina con Estética Temática */}
                  <div className={`p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl p-2 rounded-2xl bg-white shadow-2xs border border-slate-200">
                        {zoneCfg.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {zoneCfg.name}
                          </h3>
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
                            {zoneItems.length} {zoneItems.length === 1 ? 'alimento' : 'alimentos'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded">
                            {zoneCfg.temperatureTip}
                          </span>
                          <span>• {zoneCfg.subtitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleOpenAddModal(zoneKey)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Añadir aquí</span>
                      </button>
                    </div>
                  </div>

                  {/* Fila de Presets Rápidos en la Zona */}
                  <div className="px-4 sm:px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Añadir rápido:
                    </span>
                    {zoneCfg.quickPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleAddPreset(preset)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200 shadow-2xs transition-all"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Estante con los Alimentos del Compartimento */}
                  <div className="p-4 sm:p-6">
                    {zoneItems.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-xs sm:text-sm font-bold text-slate-500">
                          No hay alimentos en {zoneCfg.name.toLowerCase()}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Usa los botones de arriba para añadir productos a este estante.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {zoneItems.map((item) => {
                          const catInfo = item.category ? CATEGORY_LABELS[item.category] : CATEGORY_LABELS.despensa;
                          const pkgConfig = item.packageFormat ? PACKAGE_FORMAT_CONFIG[item.packageFormat] : null;
                          const info = calculateShelfLifeInfo(item);

                          return (
                            <div
                              key={item.id}
                              className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                                !item.inStock
                                  ? 'border-slate-200 opacity-60 bg-slate-50'
                                  : info.status === 'expired'
                                  ? 'border-rose-300 ring-1 ring-rose-500/20'
                                  : info.status === 'critical'
                                  ? 'border-orange-300 ring-1 ring-orange-500/20'
                                  : 'border-slate-200/90 hover:border-emerald-300'
                              }`}
                            >
                              <div>
                                {/* Fila Superior: Categoría y Tag */}
                                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-base">{catInfo.emoji}</span>
                                    <span className="text-[11px] font-bold text-slate-500 truncate">
                                      {catInfo.name}
                                    </span>
                                  </div>

                                  {pkgConfig && (
                                    <span
                                      className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${pkgConfig.bg} ${pkgConfig.text} ${pkgConfig.border}`}
                                    >
                                      <span>{pkgConfig.emoji}</span>
                                      <span>{pkgConfig.label}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Nombre y Formato */}
                                <div className="space-y-1">
                                  <h4
                                    className={`text-sm sm:text-base font-black ${
                                      item.inStock ? 'text-slate-900' : 'text-slate-400 line-through'
                                    }`}
                                  >
                                    {item.name}
                                  </h4>

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

                              {/* Barra de Acciones Rápidas (Ajustar días y Eliminar) */}
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
                                    title="Extender 1 semana (+7d)"
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  >
                                    +7d
                                  </button>
                                </div>

                                <button
                                  onClick={() => onRemoveItem(item.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
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
                  </div>
                </section>
              );
            }
          )}
        </div>
      )}

      {/* VISTA 2: CUADRÍCULA COMPACTA */}
      {viewMode === 'list' && (
        <div>
          {flatFilteredPantry.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <span className="text-4xl">🥑</span>
              <h3 className="font-bold text-slate-800 text-base mt-3">No hay alimentos con este filtro</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Prueba a limpiar la búsqueda o cambiar el filtro de zona.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flatFilteredPantry.map((item) => {
                const zone = getPantryZoneForItem(item);
                const zoneCfg = PANTRY_ZONES_CONFIG[zone];
                const catInfo = item.category ? CATEGORY_LABELS[item.category] : CATEGORY_LABELS.despensa;
                const pkgConfig = item.packageFormat ? PACKAGE_FORMAT_CONFIG[item.packageFormat] : null;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <span>{zoneCfg.emoji}</span>
                          <span>{zoneCfg.name.split('/')[0].trim()}</span>
                        </span>

                        {pkgConfig && (
                          <span
                            className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${pkgConfig.bg} ${pkgConfig.text} ${pkgConfig.border}`}
                          >
                            <span>{pkgConfig.emoji}</span>
                            <span>{pkgConfig.label}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900">
                        {item.name}
                      </h4>
                      {item.commercialFormat && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          📦 {item.commercialFormat}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <ShelfLifeBattery item={item} />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustDays(item, -1)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          -1d
                        </button>
                        <button
                          onClick={() => handleAdjustDays(item, 1)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          +1d
                        </button>
                        <button
                          onClick={() => handleAdjustDays(item, 7)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          +7d
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
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
        </div>
      )}

      {/* Modal para Añadir Alimento Manual con Detalle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Refrigerator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Guardar alimento en la Despensa</h3>
                  <p className="text-xs text-slate-500">Configura la zona física y los días de caducidad</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del alimento / producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Salmón fresco, Plátanos de Canarias, Garbanzos..."
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formShelfLife || formShelfLife === 4) {
                      setFormShelfLife(getEstimatedShelfLifeDays(e.target.value, formCategory));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as IngredientCategory;
                      setFormCategory(cat);
                      setFormShelfLife(getEstimatedShelfLifeDays(formName, cat));
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
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
                  className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-all"
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
