import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  SheetConfig,
  sampleAppsScriptCode,
} from '../services/googleSheets';
import {
  FileSpreadsheet,
  PlusCircle,
  Link,
  Code2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  HelpCircle,
} from 'lucide-react';

interface SheetsConfigModalProps {
  user: User | null;
  onSignIn: () => void;
  sheetConfig: SheetConfig | null;
  onSaveConfig: (config: SheetConfig | null) => void;
  onCreateNewSheet: (customTitle?: string) => Promise<SheetConfig>;
  onTestConnection: (spreadsheetId: string) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export const SheetsConfigModal: React.FC<SheetsConfigModalProps> = ({
  user,
  onSignIn,
  sheetConfig,
  onSaveConfig,
  onCreateNewSheet,
  onTestConnection,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'link' | 'webhook'>('create');
  const [sheetTitle, setSheetTitle] = useState(
    'Respuestas - Encuesta Procrastinación y Hábitos de Estudio'
  );
  const [existingUrlOrId, setExistingUrlOrId] = useState(sheetConfig?.spreadsheetId || '');
  const [webhookUrl, setWebhookUrl] = useState(sheetConfig?.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(sheetConfig?.autoSync ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  // Extract ID from full URL or return ID directly
  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleCreateNew = async () => {
    if (!user) {
      setFeedback({
        type: 'error',
        message: 'Debes iniciar sesión con Google para crear una hoja en tu cuenta.',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      const config = await onCreateNewSheet(sheetTitle.trim());
      setFeedback({
        type: 'success',
        message: `¡Hoja de cálculo creada exitosamente en tu Google Drive!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al crear la hoja en Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkExisting = async () => {
    const id = extractSpreadsheetId(existingUrlOrId);
    if (!id) {
      setFeedback({
        type: 'error',
        message: 'Por favor ingresa un ID o enlace válido de Google Sheets.',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      if (user) {
        await onTestConnection(id);
      }
      const newConfig: SheetConfig = {
        spreadsheetId: id,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        sheetTitle: 'Hoja de Cálculo Vinculada',
        webhookUrl: webhookUrl.trim() || undefined,
        autoSync,
      };
      onSaveConfig(newConfig);
      setFeedback({
        type: 'success',
        message: '¡Hoja de cálculo vinculada correctamente!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err.message ||
          'No se pudo conectar a la hoja. Asegúrate de tener permisos en esa hoja de cálculo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl.trim().startsWith('http')) {
      setFeedback({
        type: 'error',
        message: 'Ingresa una URL válida de Web App (comienza con https://script.google.com/...)',
      });
      return;
    }

    const newConfig: SheetConfig = {
      spreadsheetId: sheetConfig?.spreadsheetId || 'webhook-only',
      spreadsheetUrl:
        sheetConfig?.spreadsheetUrl ||
        'https://docs.google.com/spreadsheets',
      sheetTitle: sheetConfig?.sheetTitle || 'Hoja por Webhook de Apps Script',
      webhookUrl: webhookUrl.trim(),
      autoSync: true,
    };
    onSaveConfig(newConfig);
    setFeedback({
      type: 'success',
      message: '¡URL de Webhook guardada! Las respuestas se enviarán a través de Apps Script.',
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleUnlink = () => {
    onSaveConfig(null);
    setFeedback({
      type: 'success',
      message: 'Hoja desvinculada. Las respuestas se seguirán guardando localmente.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Conexión con Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Registra y sincroniza las 28 preguntas en una hoja de cálculo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        {sheetConfig && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Conectado a:{' '}
                <strong className="text-emerald-950 font-semibold">
                  {sheetConfig.sheetTitle}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 underline"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-rose-600 hover:text-rose-800 font-medium ml-2"
              >
                Desvincular
              </button>
            </div>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setFeedback(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>1. Crear Nueva Hoja</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('link');
              setFeedback(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>2. Vincular Hoja Existente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('webhook');
              setFeedback(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. Webhook para Alumnos</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notification / Feedback */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: CREATE NEW SHEET */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Creación automática en 1 Clic
                </div>
                <p>
                  Esta opción creará un nuevo archivo de hoja de cálculo en tu Google Drive
                  personal con una pestaña llamada <strong>Respuestas</strong> y los 28
                  encabezados organizados y congelados.
                </p>
              </div>

              {!user ? (
                <div className="p-5 border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                  <p className="text-xs text-slate-600">
                    Para crear la hoja en tu Google Drive, primero inicia sesión con tu
                    cuenta de Google:
                  </p>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Iniciar sesión con Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Título de la nueva hoja de cálculo:
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoSyncCreate"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label
                      htmlFor="autoSyncCreate"
                      className="text-xs text-slate-700 font-medium cursor-pointer"
                    >
                      Sincronizar automáticamente cada nueva respuesta al enviarse
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isLoading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creando hoja en Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Crear Hoja de Cálculo Ahora</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINK EXISTING */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Pega el enlace o el ID de una hoja de cálculo existente de Google Sheets
                donde tengas permisos de edición.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace o ID de la Hoja de Google Sheets:
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit"
                  value={existingUrlOrId}
                  onChange={(e) => setExistingUrlOrId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ejemplo: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSyncLink"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label
                  htmlFor="autoSyncLink"
                  className="text-xs text-slate-700 font-medium cursor-pointer"
                >
                  Sincronizar automáticamente cada envío
                </label>
              </div>

              <button
                type="button"
                onClick={handleLinkExisting}
                disabled={isLoading || !existingUrlOrId.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? 'Verificando y vinculando...' : 'Vincular Hoja Existente'}
              </button>
            </div>
          )}

          {/* TAB 3: WEBHOOK FOR STUDENTS */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  ¿Cómo funciona el Webhook para tus alumnos?
                </div>
                <p>
                  Si compartes el enlace de la encuesta con decenas de alumnos y no quieres
                  que cada alumno tenga que iniciar sesión en Google para guardar en tu hoja,
                  puedes crear un <strong>Google Apps Script</strong> público en 2 minutos:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Abre tu Hoja en Google Sheets &gt; Extensiones &gt; Apps Script.</li>
                  <li>Pega el código de abajo y haz clic en Guardar.</li>
                  <li>
                    Haz clic en <strong>Implementar &gt; Nueva implementación</strong>, elige{' '}
                    <strong>Aplicación web</strong>, acceso: <em>Cualquiera</em>.
                  </li>
                  <li>Copia la URL resultante y pégala aquí abajo.</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-700">
                    Código de Apps Script listo para copiar:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36">
                  {sampleAppsScriptCode}
                </pre>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL de la Aplicación Web (Webhook):
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWebhook}
                disabled={!webhookUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                Guardar URL de Webhook
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {sheetConfig ? 'Sincronización activa' : 'Sin conexión activa'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
