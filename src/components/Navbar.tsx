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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Título */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg sm:text-xl shadow-md shadow-emerald-500/20">
              🥑
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-1.5">
                Menús de Casa
                <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Familiar
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden lg:block">Planificación semanal, despensa y compra eficiente</p>
            </div>
          </div>

          {/* Navegación por pestañas (Desktop & Mobile) */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'planner'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Semana</span>
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative shrink-0 ${
                activeTab === 'shopping'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative shrink-0 ${
                activeTab === 'pantry'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'recipes'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
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
          <div className="flex items-center gap-1.5 shrink-0">
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
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
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
                  <span className="hidden xl:inline">Compartido</span>
                  <RefreshCw className="w-3 h-3 text-emerald-600 opacity-60 hover:opacity-100" />
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                  <span className="hidden xl:inline">Guardando...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <WifiOff className="w-3 h-3 text-slate-500" />
                  <span className="hidden xl:inline">Offline</span>
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
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Vetados</span>
              {excludedFoodsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                  {excludedFoodsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenBackupModal}
              title="Copias de seguridad"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onOpenDeployModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vercel</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

