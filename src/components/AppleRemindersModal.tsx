'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Download,
  Sparkles,
  Smartphone,
  Info,
  CheckCircle2,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import type { ShoppingItem } from '@/types';
import {
  formatRemindersPlainText,
  buildShortcutsUrl,
  generateRemindersIcsFile,
} from '@/lib/reminders/shortcutsFormatter';

interface AppleRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
}

export const AppleRemindersModal: React.FC<AppleRemindersModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [onlyUnchecked, setOnlyUnchecked] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'copy' | 'shortcut' | 'ics'>('copy');

  if (!isOpen) return null;

  const targetItems = onlyUnchecked ? items.filter((it) => !it.checked) : items;
  const plainText = formatRemindersPlainText(items, onlyUnchecked);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenShortcut = () => {
    const url = buildShortcutsUrl('Menús a Recordatorios', items, onlyUnchecked);
    window.location.href = url;
  };

  const handleDownloadIcs = () => {
    const icsContent = generateRemindersIcsFile(items, onlyUnchecked);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compra-recordatorios-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con estilo Apple */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <ListTodo className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Recordatorios de Apple</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-indigo-100">
                  iOS · Mac
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pasa tu lista de la compra ({targetItems.length} productos) a la app oficial de Apple
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro rápido */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={onlyUnchecked}
              onChange={(e) => setOnlyUnchecked(e.target.checked)}
              className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Solo artículos pendientes ({items.filter((it) => !it.checked).length})</span>
          </label>
          <span className="text-slate-400 text-[11px]">Total: {targetItems.length} items</span>
        </div>

        {/* Tabs de métodos */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 mx-6 mt-4 rounded-xl">
          <button
            onClick={() => setActiveTab('copy')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'copy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Clic Portapapeles</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcut')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'shortcut'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Atajo de Apple</span>
          </button>
          <button
            onClick={() => setActiveTab('ics')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Archivo .ICS</span>
          </button>
        </div>

        {/* Contenido de Tabs */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>El truco nativo más rápido de Apple:</span>
                </div>
                <ol className="text-xs text-indigo-900/90 space-y-1 pl-4 list-decimal">
                  <li>Pulsa el botón <strong>«Copiar lista para Recordatorios»</strong> de abajo.</li>
                  <li>Abre la app <strong>Recordatorios</strong> en tu iPhone, iPad o Mac.</li>
                  <li>Entra en tu lista (ej. <em>«Comestibles»</em>) y pulsa en una línea vacía.</li>
                  <li>Pulsa <strong>Pegar</strong>. ¡Apple convertirá cada línea en un recordatorio individual automáticamente!</li>
                </ol>
              </div>

              {/* Botón principal Copiar */}
              <button
                onClick={handleCopy}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>¡Lista copiada al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar lista para Recordatorios ({targetItems.length} items)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'shortcut' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Automatización con la app Atajos:</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Si tienes un atajo llamado <strong>«Menús a Recordatorios»</strong> en tu iPhone o Mac, este botón lo ejecutará enviándole la lista completa al instante.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cómo crear el atajo en 1 minuto en tu iPhone/Mac:</span>
                </p>
                <div className="text-[11px] text-slate-600 space-y-1 font-mono bg-white p-2.5 rounded-xl border border-slate-200">
                  <p>1. Acción: <strong>Dividir texto [Entrada del atajo] por saltos de línea</strong></p>
                  <p>2. Acción: <strong>Repetir con cada elemento</strong></p>
                  <p>3. Acción: <strong>Añadir nuevo recordatorio [Elemento del elemento repetido] a la lista [Comestibles]</strong></p>
                </div>
              </div>

              <button
                onClick={handleOpenShortcut}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ejecutar Atajo «Menús a Recordatorios»</span>
              </button>
            </div>
          )}

          {activeTab === 'ics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Descarga directa de archivo de tareas (.ics):</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Descarga un archivo con formato estándar de tareas (VTODO). Al abrirlo en tu Mac, se añadirán directamente a tu lista de Recordatorios de Apple.
                </p>
              </div>

              <button
                onClick={handleDownloadIcs}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Descargar archivo .ICS ({targetItems.length} tareas)</span>
              </button>
            </div>
          )}

          {/* Vista previa de items */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Vista previa del contenido a transferir:
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-40 overflow-y-auto text-xs text-slate-700 space-y-1 font-mono">
              {targetItems.length === 0 ? (
                <p className="text-slate-400 italic">No hay productos seleccionados.</p>
              ) : (
                plainText.split('\n').map((line, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{line}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Compatible con iPhone, iPad, Mac y Apple Watch
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
