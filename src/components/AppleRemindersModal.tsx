'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  Download,
  Sparkles,
  Smartphone,
  Info,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Mic,
  Send,
  Loader2,
  Check,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  HelpCircle,
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
  const [mainTab, setMainTab] = useState<'import' | 'export'>('import');
  const [exportSubTab, setExportSubTab] = useState<'copy' | 'shortcut' | 'ics'>('copy');
  const [onlyUnchecked, setOnlyUnchecked] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Estado del probador en vivo de importación
  const [testPayload, setTestPayload] = useState(
    '2 kg de patatas\n1 docena de huevos\nPechuga de pollo\nLeche desnatada\nPapel de cocina'
  );
  const [isTestingImport, setIsTestingImport] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    items?: Array<{ name: string; category: string; quantity?: number; unit?: string }>;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const targetItems = onlyUnchecked ? items.filter((it) => !it.checked) : items;
  const plainText = formatRemindersPlainText(items, onlyUnchecked);

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/reminders/import`;
    }
    return 'https://tu-app.vercel.app/api/reminders/import';
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(getWebhookUrl());
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback
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

  const handleRunTestImport = async () => {
    if (!testPayload.trim()) return;
    setIsTestingImport(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/reminders/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: testPayload.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Productos añadidos correctamente',
          items: data.importedItems || [],
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Error al procesar la importación',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Error de conexión con el endpoint',
      });
    } finally {
      setIsTestingImport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header con estilo Apple */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <ListTodo className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Apple Recordatorios & Siri</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-indigo-100">
                  iOS · Mac · Watch
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sincronización bidireccional entre Siri, Apple Recordatorios y tu lista de la compra familiar
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

        {/* Selector de Dirección Principal (Import vs Export) */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 gap-2">
          <button
            onClick={() => setMainTab('import')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              mainTab === 'import'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white/70 text-slate-700 hover:bg-white'
            }`}
          >
            <Mic className="w-4 h-4 text-amber-300" />
            <span>📥 De Siri / Recordatorios ➡️ App</span>
          </button>
          <button
            onClick={() => setMainTab('export')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              mainTab === 'export'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-white'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
            <span>📤 De tu App ➡️ Recordatorios</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {mainTab === 'import' ? (
            /* TAB DE IMPORTACIÓN (SIRI / RECORDATORIOS -> APP) */
            <div className="space-y-5">
              {/* Banner Explicativo */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>¿Cómo funciona el dictado con Siri y Recordatorios?</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Dicta a Siri en el coche, reloj o iPhone: <br />
                  <span className="font-semibold italic text-slate-800">«Oye Siri, añade leche y plátanos a la lista Compra»</span>.
                  <br />
                  Un Atajo de Apple lee los recordatorios y los envía a tu app, clasificándolos automáticamente en su pasillo del supermercado.
                </p>
              </div>

              {/* Paso 1: URL del Webhook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[11px] font-black">
                      1
                    </span>
                    <span>URL del Webhook de tu App</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Endpoint POST</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-3">
                  <input
                    type="text"
                    readOnly
                    value={getWebhookUrl()}
                    className="bg-transparent text-xs text-slate-700 font-mono flex-1 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>¡Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Paso 2: Guía de Atajos de Apple */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>Crear el Atajo en tu iPhone / iPad / Mac (2 minutos)</span>
                </h4>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-3 font-sans">
                  <p className="font-semibold text-slate-800">
                    Abre la app <strong>Atajos (Shortcuts)</strong> en tu dispositivo Apple y crea un atajo llamado{' '}
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                      «Pasar a la app»
                    </span>:
                  </p>

                  <div className="space-y-2 font-mono text-[11px] bg-white p-3 rounded-xl border border-slate-200 text-slate-800">
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">1.</span>
                      <div>
                        <strong>Obtener recordatorios</strong> de la lista <span className="text-amber-700 font-semibold">[Compra]</span> donde <span className="text-slate-600">No completado</span>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">2.</span>
                      <div>
                        <strong>Obtener contenido de URL</strong>:
                        <ul className="pl-3 mt-1 space-y-0.5 text-slate-600 font-sans text-[11px]">
                          <li>• <strong>URL:</strong> Pega la URL del Webhook copiada arriba</li>
                          <li>• <strong>Método:</strong> POST</li>
                          <li>• <strong>Cuerpo de solicitud:</strong> JSON</li>
                          <li>• <strong>Campo:</strong> <code className="bg-slate-100 px-1 rounded">items</code> = Variable [Recordatorios]</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">3.</span>
                      <div>
                        <em>(Opcional)</em> <strong>Marcar recordatorio como completado</strong> [Recordatorios].
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    💡 ¡Listo! Ahora solo di <strong>«Oye Siri, pasar a la app»</strong> o pulsa el icono del atajo en tu pantalla de inicio para que se vuelquen inmediatamente a tu lista de la compra.
                  </p>
                </div>
              </div>

              {/* Paso 3: Probador en vivo */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Probar la importación en vivo</span>
                </h4>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <textarea
                    rows={3}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    placeholder="Escribe productos (uno por línea, ej: 2 kg de manzanas)"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Auto-detecta cantidades, unidades y secciones de súper
                    </span>
                    <button
                      onClick={handleRunTestImport}
                      disabled={isTestingImport || !testPayload.trim()}
                      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
                    >
                      {isTestingImport ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Importando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Probar importación</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs border ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      {testResult.success ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{testResult.message}</span>
                          </div>
                          {testResult.items && testResult.items.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {testResult.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-800"
                                >
                                  {it.name} <span className="text-slate-400 font-normal">({it.category})</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold">{testResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* TAB DE EXPORTACIÓN (APP -> RECORDATORIOS) */
            <div className="space-y-4">
              {/* Filtro rápido */}
              <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
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

              {/* Sub-tabs de exportación */}
              <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 rounded-xl">
                <button
                  onClick={() => setExportSubTab('copy')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    exportSubTab === 'copy'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1-Clic Portapapeles</span>
                </button>
                <button
                  onClick={() => setExportSubTab('shortcut')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    exportSubTab === 'shortcut'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Atajo de Apple</span>
                </button>
                <button
                  onClick={() => setExportSubTab('ics')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    exportSubTab === 'ics'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Archivo .ICS</span>
                </button>
              </div>

              {exportSubTab === 'copy' && (
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

                  <button
                    onClick={handleCopyText}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {copiedText ? (
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

              {exportSubTab === 'shortcut' && (
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

                  <button
                    onClick={handleOpenShortcut}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ejecutar Atajo «Menús a Recordatorios»</span>
                  </button>
                </div>
              )}

              {exportSubTab === 'ics' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Descarga directa de archivo de tareas (.ics):</span>
                    </div>
                    <p className="text-xs text-emerald-900/90 leading-relaxed">
                      Descarga un archivo con formato estándar de tareas (VTODO). Al abrirlo en tu Mac o iOS, se añadirán directamente a tu lista de Recordatorios.
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

              {/* Vista previa de items a exportar */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Vista previa del contenido a transferir:
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto text-xs text-slate-700 space-y-1 font-mono">
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Compatible con Siri, iPhone, iPad, Apple Watch, HomePod y Mac
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
