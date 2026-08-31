'use client';

import React, { useState } from 'react';
import { X, UploadCloud, Github, ExternalLink, Copy, Check, Terminal, Sparkles } from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Crear un repositorio en GitHub',
      desc: 'Entra en github.com/new y crea un repositorio llamado "menus-familia" (puede ser Público o Privado).',
      url: 'https://github.com/new',
      linkText: 'Abrir GitHub (Crear Repo)',
    },
    {
      title: '2. Subir el código a GitHub',
      desc: 'Ejecuta estos comandos en tu terminal para vincular y subir la app:',
      commands: [
        'git remote add origin https://github.com/TU_USUARIO/menus-familia.git',
        'git branch -M main',
        'git push -u origin main',
      ],
    },
    {
      title: '3. Importar el proyecto en Vercel',
      desc: 'Entra en Vercel, pulsa "Add New... -> Project" e importa tu repositorio "menus-familia". Pulsa "Deploy".',
      url: 'https://vercel.com/new',
      linkText: 'Abrir Vercel (Importar Proyecto)',
    },
    {
      title: '4. Activar Sincronización Familiar (1 Clic, 100% Gratis)',
      desc: 'En tu proyecto de Vercel, ve a la pestaña "Storage" -> pulsa "Connect Database" -> selecciona "KV" (o "Upstash Redis") -> "Create Free". ¡Vercel conectará automáticamente la base de datos compartida sin configurar nada más!',
    },
    {
      title: '5. ¡Menú y compra compartidos en tiempo real!',
      desc: 'Abre la URL de Vercel en tu móvil y en el de tu mujer (puedes pulsar "Añadir a pantalla de inicio" para tenerla como app). Cualquier cambio en el menú, la despensa o la compra se sincronizará automáticamente para ambos.',
    },
  ];


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Desplegar en Vercel vía GitHub</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gratuito
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Accede desde cualquier dispositivo con tu propio enlace web seguro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pasos */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                {idx + 1}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>

                {step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>{step.linkText}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                )}

                {step.commands && (
                  <div className="bg-slate-900 rounded-2xl p-3 text-slate-200 font-mono text-xs space-y-1 relative group">
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-emerald-400" /> Terminal
                      </span>
                      <button
                        onClick={() => copyCommand(step.commands!.join('\n'), idx)}
                        className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar comandos</span>
                          </>
                        )}
                      </button>
                    </div>
                    {step.commands.map((cmd, cIdx) => (
                      <div key={cIdx} className="leading-snug text-slate-300">
                        {cmd}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
