'use client';

import React from 'react';
import { DynamicPantryItem } from '@/types';
import { calculateShelfLifeInfo, ShelfLifeBatteryInfo } from '@/lib/pantryUtils';
import { Sparkles, AlertTriangle, Clock, Flame, BatteryCharging, BatteryWarning, Battery } from 'lucide-react';

interface ShelfLifeBatteryProps {
  item: DynamicPantryItem;
  compact?: boolean;
  referenceDateStr?: string;
  showPercent?: boolean;
  className?: string;
}

export const ShelfLifeBattery: React.FC<ShelfLifeBatteryProps> = ({
  item,
  compact = false,
  referenceDateStr,
  showPercent = true,
  className = '',
}) => {
  const info: ShelfLifeBatteryInfo = calculateShelfLifeInfo(item, referenceDateStr);

  const getStatusBadge = () => {
    switch (info.status) {
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>{info.daysRemaining === 0 ? 'Caduca hoy' : 'Caducado'}</span>
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200 animate-pulse">
            <Flame className="w-3 h-3 text-orange-600" />
            <span>{info.daysRemaining === 1 ? '¡Consumir hoy/mañana!' : `${info.daysRemaining}d restantes`}</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{info.daysRemaining} días restantes</span>
          </span>
        );
      case 'fresh':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{info.totalDays >= 90 ? 'Larga vida' : `${info.daysRemaining} días restantes`}</span>
          </span>
        );
    }
  };

  const getBatteryShellColor = () => {
    switch (info.status) {
      case 'expired':
        return 'border-rose-300 bg-rose-950/10 shadow-rose-500/10';
      case 'critical':
        return 'border-orange-300 bg-orange-950/10 shadow-orange-500/10';
      case 'medium':
        return 'border-amber-300 bg-amber-950/10 shadow-amber-500/10';
      case 'fresh':
      default:
        return 'border-slate-300 bg-slate-900/5 shadow-emerald-500/10';
    }
  };

  const getBatteryTerminalColor = () => {
    switch (info.status) {
      case 'expired':
        return 'bg-rose-400';
      case 'critical':
        return 'bg-orange-400';
      case 'medium':
        return 'bg-amber-400';
      case 'fresh':
      default:
        return 'bg-slate-400';
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {/* Cápsula de Batería Compacta */}
        <div className="relative flex items-center">
          <div
            className={`relative w-12 h-5 rounded-md border p-0.5 overflow-hidden flex items-center shadow-xs ${getBatteryShellColor()}`}
          >
            {/* Relleno de Energía */}
            <div
              className={`h-full rounded-xs bg-gradient-to-r ${info.gradientClass} transition-all duration-500 shadow-sm`}
              style={{ width: `${Math.max(info.percentRemaining, info.isExpired ? 0 : 8)}%` }}
            />
            {/* Efecto de brillo de vidrio */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-t-xs pointer-events-none" />
          </div>
          {/* Terminal positivo (+) */}
          <div className={`w-0.5 h-2.5 rounded-r-xs ml-[1px] ${getBatteryTerminalColor()}`} />
        </div>

        <span className={`text-[11px] font-bold ${info.colorClass}`}>
          {info.daysRemaining <= 0 ? '0d' : `${info.daysRemaining}d`}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Cabecera con Badge y % */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {getStatusBadge()}
        {showPercent && (
          <span className={`text-xs font-black tracking-tight ${info.colorClass}`}>
            {info.percentRemaining}%
          </span>
        )}
      </div>

      {/* Cápsula de Batería Premium */}
      <div className="flex items-center">
        <div
          className={`relative flex-1 h-6 rounded-lg border-2 p-0.5 overflow-hidden flex items-center shadow-inner ${getBatteryShellColor()}`}
        >
          {/* Rejilla de celdas de batería en el fondo */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10 opacity-20">
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
          </div>

          {/* Relleno de Energía con Gradiente */}
          <div
            className={`h-full rounded-md bg-gradient-to-r ${info.gradientClass} transition-all duration-700 shadow-sm relative overflow-hidden`}
            style={{ width: `${Math.max(info.percentRemaining, info.isExpired ? 0 : 5)}%` }}
          >
            {/* Brillo dinámico de lujo */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-md" />
            <div className="absolute inset-y-0 right-0 w-2 bg-white/20 blur-[1px]" />
          </div>
        </div>

        {/* Terminal positivo (+) */}
        <div className={`w-1 h-3.5 rounded-r-sm ml-0.5 ${getBatteryTerminalColor()} shadow-xs`} />
      </div>

      {/* Subtexto descriptivo */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
        <span>Vida útil: {info.totalDays} días</span>
        <span>
          {info.elapsedDays === 0
            ? 'Añadido hoy'
            : info.elapsedDays === 1
            ? 'Hace 1 día'
            : `Hace ${info.elapsedDays} días`}
        </span>
      </div>
    </div>
  );
};
