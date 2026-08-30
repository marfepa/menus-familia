'use client';

import React from 'react';
import { Calendar, ShoppingCart, BookOpen, UploadCloud, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'planner' | 'shopping' | 'recipes';
  setActiveTab: (tab: 'planner' | 'shopping' | 'recipes') => void;
  shoppingItemsCount: number;
  recipesCount: number;
  onOpenDeployModal: () => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shoppingItemsCount,
  recipesCount,
  onOpenDeployModal,
  onOpenBackupModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/20">
              🥑
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-2">
                Menús de Casa
                <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Familiar
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Planificación semanal y compra eficiente</p>
            </div>
          </div>

          {/* Navegación por pestañas (Desktop & Mobile) */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
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
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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

          {/* Acciones secundarias: Backup y Despliegue Vercel */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBackupModal}
              title="Copias de seguridad"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-all hover:shadow"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Desplegar en Vercel</span>
              <span className="sm:hidden">Vercel</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
