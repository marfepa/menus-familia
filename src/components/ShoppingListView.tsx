'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingItem,
  IngredientCategory,
  PackageFormat,
  CATEGORY_LABELS,
  PACKAGE_FORMAT_CONFIG,
  ShoppingPeriod,
  PantryItem,
  AppleRemindersConfig,
} from '@/types';
import { formatShoppingListForShare } from '@/lib/shoppingListGenerator';
import { formatWeekRange } from '@/lib/utils';
import { AppleRemindersModal } from '@/components/AppleRemindersModal';
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
  Package,
  Store,
  Info,
  Refrigerator,
  ListTodo,
} from 'lucide-react';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  weekStartDate: string;
  onToggleItem: (itemId: string) => void;
  onAddItem: (
    name: string,
    quantity: number | undefined,
    unit: string,
    category: IngredientCategory,
    packageFormat?: PackageFormat
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onClearChecked: () => void;
  onRegenerateFromMenu: () => void;
  pantry: PantryItem[];
  onTogglePantryItem: (id: string) => void;
  remindersConfig?: AppleRemindersConfig | null;
  onSaveRemindersConfig?: (config: AppleRemindersConfig | null) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  weekStartDate,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearChecked,
  onRegenerateFromMenu,
  pantry,
  onTogglePantryItem,
  remindersConfig = null,
  onSaveRemindersConfig = () => {},
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ShoppingPeriod>('all');
  const [storeMode, setStoreMode] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<string>('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState<IngredientCategory>('fruteria');
  const [customPackageFormat, setCustomPackageFormat] = useState<PackageFormat>('granel');
  const [copied, setCopied] = useState(false);

  const weekRange = formatWeekRange(weekStartDate);

  // Filtrar items por el tramo seleccionado
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
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

    categoryOrder.forEach((cat) => map.set(cat, []));

    visibleItems.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });

    return map;
  }, [visibleItems]);

  // Contadores
  const totalCount = visibleItems.length;
  const checkedCount = visibleItems.filter((i) => i.checked).length;
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
      customCategory,
      customPackageFormat
    );

    setCustomName('');
    setCustomQty('');
    setCustomUnit('');
    setCustomPackageFormat('granel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner Explicativo de Formatos Comerciales Lidl / Aldi / Consum */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-md relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
              <Store className="w-3.5 h-3.5" />
              <span>Estándar Comercial LIDL · ALDI · CONSUM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Lista de la Compra por Formatos de Lineal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Los alimentos se agrupan automáticamente en sus unidades comerciales reales (mallas de 2kg, bandejas protegidas de 500g, botes de 400g, docenas) calculando el aprovechamiento entre recetas para <strong className="text-emerald-300 font-bold">desperdicio cero</strong>.
            </p>
            <p className="text-[11px] text-emerald-300/90 font-medium flex items-center gap-1.5">
              <span>🔋</span>
              <span>Al tachar un artículo comprado, se transfiere automáticamente a tu <strong>Despensa</strong> con su batería de frescura activa.</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end shrink-0">
            <button
              onClick={onRegenerateFromMenu}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
              title="Sincronizar con los últimos cambios del menú"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sincronizar menú</span>
            </button>

            <button
              onClick={() => setIsRemindersModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-300/30 rounded-xl transition-all shadow-xs backdrop-blur-sm relative"
              title="Sincronizar con Recordatorios de Apple (iCloud)"
            >
              <ListTodo className="w-3.5 h-3.5 text-indigo-300" />
              <span>Recordatorios</span>
              {remindersConfig?.appleId && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Conectado a iCloud" />
              )}
            </button>

            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 rounded-xl transition-all backdrop-blur-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => setStoreMode(!storeMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                storeMode ? 'bg-emerald-400 text-emerald-950' : 'text-white bg-white/15 hover:bg-white/25'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{storeMode ? 'Modo súper ON' : 'Modo súper'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de División por Tramos de Compra (L-V vs Finde vs Todo) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 pl-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>Tramo de compra en tienda:</span>
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
            <span>🏢 L-V Mediodía (Tuppers / Oficina)</span>
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
            <span>🏠 Fin de Semana</span>
          </button>
        </div>
      </div>

      {/* Barra de Progreso de Compra */}
      {totalCount > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
              {progressPercent}%
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {checkedCount} de {totalCount} artículos en el carrito
              </p>
              <p className="text-xs text-slate-500">
                {totalCount - checkedCount === 0
                  ? '🎉 ¡Lista de la compra completa!'
                  : `Quedan ${totalCount - checkedCount} productos por coger del lineal`}
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

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Refrigerator className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ya lo tengo (se resta de la lista)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {pantry.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTogglePantryItem(item.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                item.inStock
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {item.inStock ? '✓ ' : ''}
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario para Añadir Artículos Manuales (Fuera de Menú) */}
      <div className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs no-print ${storeMode ? 'hidden' : ''}`}>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Añadir producto extra (pañales, meriendas infantiles, café, limpieza...)</span>
        </h3>

        <form onSubmit={handleAddCustomSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="Nombre del producto (ej. Plátanos de Canarias, Papel cocina)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="sm:col-span-4 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <input
            type="number"
            step="any"
            placeholder="Cant."
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            className="sm:col-span-2 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-center"
          />

          <select
            value={customPackageFormat}
            onChange={(e) => setCustomPackageFormat(e.target.value as PackageFormat)}
            className="sm:col-span-3 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            {Object.entries(PACKAGE_FORMAT_CONFIG).map(([key, fmt]) => (
              <option key={key} value={key}>
                {fmt.emoji} {fmt.label}
              </option>
            ))}
          </select>

          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value as IngredientCategory)}
            className="sm:col-span-2 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
            className="sm:col-span-1 px-4 py-2 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center"
          >
            Añadir
          </button>
        </form>
      </div>

      {/* Lista agrupada por Pasillos Reales de LIDL/ALDI/Consum */}
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
                  {/* Título de la sección y pasillo de supermercado */}
                  <div className="pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{catInfo.emoji}</span>
                        <h3 className="font-bold text-sm text-slate-900">
                          {catInfo.name}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {catItems.length} {catItems.length === 1 ? 'artículo' : 'artículos'}
                      </span>
                    </div>
                    {catInfo.aisleTip && (
                      <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span>{catInfo.aisleTip}</span>
                      </p>
                    )}
                  </div>

                  {/* Items de la sección con presentación comercial de supermercado */}
                  <div className="space-y-2.5">
                    {catItems.map((item) => {
                      const pkgConfig = item.packageFormat
                        ? PACKAGE_FORMAT_CONFIG[item.packageFormat]
                        : PACKAGE_FORMAT_CONFIG.granel;

                      return (
                        <div
                          key={item.id}
                          onClick={() => onToggleItem(item.id)}
                          className={`group flex items-start justify-between rounded-xl cursor-pointer transition-all border ${
                            storeMode ? 'p-4 min-h-[64px]' : 'p-3'
                          } ${
                            item.checked
                              ? 'bg-slate-50 border-slate-200/60 opacity-60'
                              : 'bg-white hover:bg-slate-50/90 border-slate-200/90 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              className="text-slate-400 group-hover:text-emerald-600 transition-colors mt-0.5 shrink-0"
                            >
                              {item.checked ? (
                                <CheckCircle2 className={`${storeMode ? 'w-8 h-8' : 'w-5 h-5'} text-emerald-600 fill-emerald-100`} />
                              ) : (
                                <Circle className={`${storeMode ? 'w-8 h-8' : 'w-5 h-5'} text-slate-300 group-hover:text-emerald-500`} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              {/* Nombre del producto */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p
                                  className={`text-xs sm:text-sm font-bold ${
                                    item.checked
                                      ? 'line-through text-slate-400 font-normal'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {item.name}
                                </p>

                                {/* Badge de tipo de envase comercial */}
                                {pkgConfig && !item.checked && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${pkgConfig.bg} ${pkgConfig.text} ${pkgConfig.border}`}
                                  >
                                    <span>{pkgConfig.emoji}</span>
                                    <span>{pkgConfig.label}</span>
                                  </span>
                                )}
                              </div>

                              {/* Formato de compra recomendado para el súper */}
                              {item.commercialFormat && (
                                <p
                                  className={`text-xs font-bold mt-1 ${
                                    item.checked ? 'text-slate-400' : 'text-emerald-700'
                                  }`}
                                >
                                  🛒 Comprar: <span className="underline decoration-emerald-300 decoration-2">{item.commercialFormat}</span>
                                </p>
                              )}

                              {/* Subtexto: consumo en recetas y remanente / residuo cero */}
                              {item.recipeUsageNote && !item.checked && !storeMode && (
                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.recipeUsageNote}</span>
                                </p>
                              )}

                              {/* Badges de recetas que lo consumen */}
                              {item.recipeSource && item.recipeSource.length > 0 && !item.checked && (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  {item.recipeSource.length > 1 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                      <Package className="w-3 h-3" /> Pack compartido ({item.recipeSource.length} recetas)
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                                    {item.recipeSource.join(' · ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botón de eliminar */}
                          <div className="shrink-0 ml-2 mt-0.5">
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
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Configuración y Sincronización con Recordatorios de Apple */}
      <AppleRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        items={items}
      />
    </div>
  );
};
