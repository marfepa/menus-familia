'use client';

import React, { useState, useEffect } from 'react';
import {
  AppleRemindersConfig,
  AppleRemindersListInfo,
  ShoppingItem,
  ShoppingPeriod,
} from '@/types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ListTodo,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Key,
  Mail,
  ListFilter,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface AppleRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  currentPeriod: ShoppingPeriod;
  initialConfig: AppleRemindersConfig | null;
  onSaveConfig: (config: AppleRemindersConfig | null) => void;
}

export const AppleRemindersModal: React.FC<AppleRemindersModalProps> = ({
  isOpen,
  onClose,
  items,
  currentPeriod,
  initialConfig,
  onSaveConfig,
}) => {
  const [appleId, setAppleId] = useState(initialConfig?.appleId || '');
  const [appSpecificPassword, setAppSpecificPassword] = useState(
    initialConfig?.appSpecificPassword || ''
  );
  const [selectedHref, setSelectedHref] = useState<string>(
    initialConfig?.calendarHref || ''
  );
  const [selectedName, setSelectedName] = useState<string>(
    initialConfig?.calendarName || ''
  );
  const [availableLists, setAvailableLists] = useState<AppleRemindersListInfo[]>([]);
  const [syncPeriod, setSyncPeriod] = useState<ShoppingPeriod>(
    initialConfig?.syncPeriod || currentPeriod || 'all'
  );
  const [onlyUnchecked, setOnlyUnchecked] = useState(false);

  // Estados de carga y mensajes
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(Boolean(initialConfig?.appleId));

  useEffect(() => {
    if (initialConfig) {
      setAppleId(initialConfig.appleId);
      setAppSpecificPassword(initialConfig.appSpecificPassword);
      setSelectedHref(initialConfig.calendarHref || '');
      setSelectedName(initialConfig.calendarName || '');
      setSyncPeriod(initialConfig.syncPeriod || currentPeriod || 'all');
      setIsConfigured(Boolean(initialConfig.appleId && initialConfig.appSpecificPassword));
    }
  }, [initialConfig, currentPeriod]);

  if (!isOpen) return null;

  // Filtrar los items a sincronizar según el periodo y el check
  const itemsToSync = items.filter((item) => {
    if (syncPeriod !== 'all' && !item.isCustom) {
      if (item.period !== syncPeriod && item.period !== 'both') return false;
    }
    if (onlyUnchecked && item.checked) return false;
    return true;
  });

  const handleTestAndDiscover = async () => {
    if (!appleId.trim() || !appSpecificPassword.trim()) {
      setErrorMessage('Introduce tu Apple ID y la contraseña de aplicación.');
      return;
    }

    setTestingConnection(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/reminders/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appleId: appleId.trim(),
          appSpecificPassword: appSpecificPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con iCloud');
      }

      setAvailableLists(data.lists || []);
      if (data.lists && data.lists.length > 0) {
        // Seleccionar por defecto la primera lista (o la predeterminada)
        const def = data.lists.find((l: AppleRemindersListInfo) => l.isDefault) || data.lists[0];
        setSelectedHref(def.href);
        setSelectedName(def.name);
        setSuccessMessage(`¡Conexión exitosa! Se encontraron ${data.lists.length} listas en tu Recordatorios.`);
        setIsConfigured(true);
      } else {
        setErrorMessage('Se conectó con iCloud pero no se encontraron listas de Recordatorios.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo conectar con Apple iCloud.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncNow = async () => {
    if (!appleId.trim() || !appSpecificPassword.trim() || !selectedHref) {
      setErrorMessage('Completa la configuración y selecciona una lista primero.');
      return;
    }

    if (itemsToSync.length === 0) {
      setErrorMessage('No hay productos que coincidan con el filtro seleccionado para sincronizar.');
      return;
    }

    setSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/reminders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appleId: appleId.trim(),
          appSpecificPassword: appSpecificPassword.trim(),
          calendarHref: selectedHref,
          items: itemsToSync,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error durante la sincronización');
      }

      const result = data.result;
      const count = result?.syncedCount || itemsToSync.length;
      const nowStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      setSuccessMessage(`✅ ¡${count} artículos cargados con éxito en «${selectedName || 'Recordatorios'}» a las ${nowStr}!`);

      // Guardar configuración
      const newConfig: AppleRemindersConfig = {
        appleId: appleId.trim(),
        appSpecificPassword: appSpecificPassword.trim(),
        calendarHref: selectedHref,
        calendarName: selectedName,
        syncPeriod,
        lastSyncedAt: new Date().toISOString(),
      };
      onSaveConfig(newConfig);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al sincronizar con Recordatorios de Apple');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    onSaveConfig(null);
    setAppleId('');
    setAppSpecificPassword('');
    setSelectedHref('');
    setSelectedName('');
    setAvailableLists([]);
    setIsConfigured(false);
    setSuccessMessage('Configuración de Recordatorios de Apple eliminada de este navegador.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Recordatorios de Apple</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  iCloud CalDAV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Sincronización en segundo plano con tu iPhone, Apple Watch y Mac
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guía rápida de Contraseña de Aplicación */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ¿Cómo obtener la contraseña de aplicación?
            </span>
            <a
              href="https://appleid.apple.com/account/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
            >
              <span>appleid.apple.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Apple no permite usar tu contraseña habitual. Debes generar una contraseña específica (100% segura y revocable cuando quieras):
          </p>
          <ol className="list-decimal list-inside text-slate-600 space-y-1 pl-1">
            <li>Entra en <strong>appleid.apple.com</strong> o en tu iPhone en <em>Ajustes &gt; [Tu Nombre] &gt; Inicio de sesión y seguridad</em>.</li>
            <li>Selecciona <strong>Contraseñas de aplicaciones</strong> y pulsa <strong>Generar</strong>.</li>
            <li>Escribe de etiqueta <em>Menús Familia</em> y copia el código generado (ej. <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">abcd-efgh-ijkl-mnop</code>).</li>
          </ol>
        </div>

        {/* Formulario de Credenciales */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Apple ID (Correo iCloud)</span>
              </label>
              <input
                type="email"
                placeholder="ejemplo@icloud.com"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contraseña de App</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline font-normal"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={appSpecificPassword}
                onChange={(e) => setAppSpecificPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium"
              />
            </div>
          </div>

          {/* Botón de probar conexión y detectar listas */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestAndDiscover}
              disabled={testingConnection || !appleId || !appSpecificPassword}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Conectando con iCloud...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Probar y detectar listas</span>
                </>
              )}
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desconectar cuenta</span>
              </button>
            )}
          </div>

          {/* Selector de lista si hay listas detectadas */}
          {availableLists.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-indigo-600" />
                <span>Lista de Recordatorios de destino en tu iPhone/Mac:</span>
              </label>

              <select
                value={selectedHref}
                onChange={(e) => {
                  const href = e.target.value;
                  setSelectedHref(href);
                  const found = availableLists.find((l) => l.href === href);
                  if (found) setSelectedName(found.name);
                }}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableLists.map((list) => (
                  <option key={list.href} value={list.href}>
                    {list.isDefault ? '⭐ ' : '📋 '} {list.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-indigo-700 font-medium">
                💡 Consejo: Si en Recordatorios creas una lista llamada <strong>Compra</strong> de tipo &ldquo;Compras&rdquo; (iOS 17+), Apple clasificará los productos automáticamente por pasillos.
              </p>
            </div>
          )}

          {/* Opciones de Sincronización */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Opciones de sincronización
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tramo a sincronizar:
                </label>
                <select
                  value={syncPeriod}
                  onChange={(e) => setSyncPeriod(e.target.value as ShoppingPeriod)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="all">Semana Completa</option>
                  <option value="weekday">L-V Mediodía (Tuppers)</option>
                  <option value="weekend">Fin de Semana</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mt-4 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={onlyUnchecked}
                    onChange={(e) => setOnlyUnchecked(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Omitir productos ya tachados</span>
                </label>
              </div>
            </div>
          </div>

          {/* Mensajes de Estado */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Botón Principal de Sincronizar */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing || !appleId || !appSpecificPassword || (!selectedHref && availableLists.length === 0)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Cargando {itemsToSync.length} artículos en Recordatorios...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Sincronizar {itemsToSync.length} artículos en Recordatorios</span>
                </>
              )}
            </button>
          </div>

          {initialConfig?.lastSyncedAt && (
            <p className="text-center text-[11px] text-slate-400 font-medium">
              Última sincronización con Apple:{' '}
              {new Date(initialConfig.lastSyncedAt).toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
