import React from 'react';
import { Calendar, ShoppingCart, BookOpen, UploadCloud, Database, Refrigerator, Ban, RefreshCw, Cloud, WifiOff, Check } from 'lucide-react';
import type { SyncStatusState } from '@/types';

interface NavbarProps {
  activeTab: 'planner' | 'shopping' | 'pantry' | 'recipes';
  setActiveTab: (tab: 'planner' | 'shopping' | 'pantry' | 'recipes') => void;
  shoppingItemsCount: number;
  pantryItemsCount?: number;
  expiringPantryCount?: number;
  recipesCount: number;
  excludedFoodsCount?: number;
  syncStatus?: SyncStatusState;
  onTriggerSync?: () => void;
  onOpenDeployModal: () => void;
  onOpenBackupModal: () => void;
  onOpenExcludedFoodsModal: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shoppingItemsCount,
  pantryItemsCount = 0,
  expiringPantryCount = 0,
  recipesCount,
  excludedFoodsCount = 0,
  syncStatus = 'synced',
  onTriggerSync,
  onOpenDeployModal,
  onOpenBackupModal,
  onOpenExcludedFoodsModal,
}) => {
  return (
    <>
      {/* Cabecera Superior Fija */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Logo & Título */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-base sm:text-xl shadow-md shadow-emerald-500/20">
                🥑
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-1.5">
                  Menús de Casa
                  <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Familiar
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden lg:block">Planificación semanal, despensa y compra eficiente</p>
              </div>
            </div>

            {/* Navegación por pestañas (Exclusiva de Desktop & Tablet >= 640px) */}
            <nav className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === 'planner'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Semana</span>
              </button>

              <button
                onClick={() => setActiveTab('shopping')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative shrink-0 ${
                  activeTab === 'shopping'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Compra</span>
                {shoppingItemsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    {shoppingItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('pantry')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative shrink-0 ${
                  activeTab === 'pantry'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Refrigerator className="w-4 h-4" />
                <span>Despensa</span>
                {expiringPantryCount > 0 ? (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse" title="Productos por caducar">
                    {expiringPantryCount}
                  </span>
                ) : pantryItemsCount > 0 ? (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {pantryItemsCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeTab === 'recipes'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Recetas</span>
                <span className="hidden md:inline text-xs text-slate-400 font-normal">
                  ({recipesCount})
                </span>
              </button>
            </nav>

            {/* Acciones secundarias: Sincronización, Alimentos Vetados, Backup y Despliegue Vercel */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Badge de Sincronización en Tiempo Real */}
              <button
                onClick={onTriggerSync || onOpenDeployModal}
                title={
                  syncStatus === 'synced'
                    ? 'Nube compartida al día (Clic para sincronizar ahora)'
                    : syncStatus === 'syncing'
                    ? 'Sincronizando cambios con la familia...'
                    : syncStatus === 'offline'
                    ? 'Sin conexión a internet (modo offline)'
                    : 'Modo local: Clic para ver cómo compartir en Vercel'
                }
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                    : syncStatus === 'offline'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {syncStatus === 'synced' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="hidden lg:inline">Compartido</span>
                    <RefreshCw className="w-3 h-3 text-emerald-600 opacity-60 hover:opacity-100" />
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                    <span className="hidden lg:inline">Guardando...</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <WifiOff className="w-3 h-3 text-slate-500" />
                    <span className="hidden lg:inline">Offline</span>
                  </>
                )}
                {(syncStatus === 'local_only' || syncStatus === 'error') && (
                  <>
                    <Cloud className="w-3 h-3 text-slate-500" />
                    <span className="hidden sm:inline">Nube</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenExcludedFoodsModal}
                title="Alimentos no deseados / Vetados en menús"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
              >
                <Ban className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden md:inline">Vetados</span>
                {excludedFoodsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                    {excludedFoodsCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenBackupModal}
                title="Copias de seguridad"
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/70"
              >
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={onOpenDeployModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all hover:shadow"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vercel</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Barra de Navegación Inferior Móvil (Bottom Tab Bar en < 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] px-2 pt-1 pb-safe no-print">
        <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
          {/* Pestaña Semana */}
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
              activeTab === 'planner'
                ? 'text-emerald-700 font-bold bg-emerald-50/90 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'planner' ? 'scale-110 text-emerald-600' : ''}`} />
            <span className="text-[11px] leading-tight">Semana</span>
          </button>

          {/* Pestaña Compra */}
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
              activeTab === 'shopping'
                ? 'text-emerald-700 font-bold bg-emerald-50/90 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <ShoppingCart className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'shopping' ? 'scale-110 text-emerald-600' : ''}`} />
              {shoppingItemsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 min-w-[16px] text-center rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                  {shoppingItemsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Compra</span>
          </button>

          {/* Pestaña Despensa */}
          <button
            onClick={() => setActiveTab('pantry')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
              activeTab === 'pantry'
                ? 'text-emerald-700 font-bold bg-emerald-50/90 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Refrigerator className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'pantry' ? 'scale-110 text-emerald-600' : ''}`} />
              {expiringPantryCount > 0 ? (
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 min-w-[16px] text-center rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse shadow-xs" title="Por caducar">
                  {expiringPantryCount}
                </span>
              ) : pantryItemsCount > 0 ? (
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 min-w-[16px] text-center rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                  {pantryItemsCount}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] leading-tight">Despensa</span>
          </button>

          {/* Pestaña Recetas */}
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
              activeTab === 'recipes'
                ? 'text-emerald-700 font-bold bg-emerald-50/90 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <BookOpen className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'recipes' ? 'scale-110 text-emerald-600' : ''}`} />
              {recipesCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-slate-200/80 text-slate-600">
                  {recipesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Recetas</span>
          </button>
        </div>
      </nav>
    </>
  );
};


