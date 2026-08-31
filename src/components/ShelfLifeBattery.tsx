'use client';

import React from 'react';
import { DynamicPantryItem } from '@/types';
import { calculateShelfLifeInfo, ShelfLifeBatteryInfo } from '@/lib/pantryUtils';
import { Sparkles, AlertTriangle, Clock, Flame } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{info.daysRemaining === 0 ? '¡Caduca hoy!' : `Caducado (${Math.abs(info.daysRemaining)}d)`}</span>
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-orange-500 text-white shadow-xs">
            <Flame className="w-3.5 h-3.5" />
            <span>{info.daysRemaining === 1 ? '¡Queda 1 día!' : `¡Quedan ${info.daysRemaining} días!`}</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-amber-950 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-950" />
            <span>Quedan {info.daysRemaining} días</span>
          </span>
        );
      case 'fresh':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{info.totalDays >= 90 ? 'Larga duración' : `Quedan ${info.daysRemaining} días`}</span>
          </span>
        );
    }
  };

  const getBatteryShellColor = () => {
    switch (info.status) {
      case 'expired':
        return 'border-rose-400 bg-rose-950/20 shadow-rose-500/20';
      case 'critical':
        return 'border-orange-400 bg-orange-950/20 shadow-orange-500/20';
      case 'medium':
        return 'border-amber-400 bg-amber-950/20 shadow-amber-500/20';
      case 'fresh':
      default:
        return 'border-slate-300 bg-slate-900/5 shadow-emerald-500/10';
    }
  };

  const getBatteryTerminalColor = () => {
    switch (info.status) {
      case 'expired':
        return 'bg-rose-500';
      case 'critical':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-amber-500';
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

        <span className={`text-xs font-black ${info.colorClass}`}>
          {info.daysRemaining <= 0 ? '0d' : `${info.daysRemaining}d`}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Cabecera con Badge de cuenta atrás ultra visible y % de carga */}
      <div className="flex items-center justify-between gap-2">
        {getStatusBadge()}
        {showPercent && (
          <div className="flex items-center gap-1">
            <span className={`text-xs sm:text-sm font-black tracking-tight ${info.colorClass}`}>
              {info.percentRemaining}%
            </span>
          </div>
        )}
      </div>

      {/* Cápsula de Batería Premium con Efecto Líquido / Neón */}
      <div className="flex items-center">
        <div
          className={`relative flex-1 h-6 sm:h-7 rounded-xl border-2 p-0.5 overflow-hidden flex items-center shadow-inner ${getBatteryShellColor()}`}
        >
          {/* Rejilla de celdas de batería en el fondo */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none z-10 opacity-20">
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
            <div className="w-px h-full bg-slate-900 border-r border-dashed" />
          </div>

          {/* Relleno de Energía con Gradiente Vibrante */}
          <div
            className={`h-full rounded-lg bg-gradient-to-r ${info.gradientClass} transition-all duration-700 shadow-sm relative overflow-hidden`}
            style={{ width: `${Math.max(info.percentRemaining, info.isExpired ? 0 : 6)}%` }}
          >
            {/* Brillo dinámico de lujo */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/35 rounded-t-lg" />
            <div className="absolute inset-y-0 right-0 w-2 bg-white/30 blur-[1px]" />
          </div>
        </div>

        {/* Terminal positivo (+) metálico */}
        <div className={`w-1.5 h-3.5 rounded-r-md ml-0.5 ${getBatteryTerminalColor()} shadow-xs`} />
      </div>

      {/* Subtexto descriptivo con días totales */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
        <span>Vida útil: <strong>{info.totalDays}d</strong></span>
        <span>
          {info.elapsedDays === 0
            ? '🛒 Comprado hoy'
            : info.elapsedDays === 1
            ? 'Hace 1 día'
            : `Hace ${info.elapsedDays} días`}
        </span>
      </div>
    </div>
  );
};

