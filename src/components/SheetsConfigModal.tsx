import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  SheetConfig,
  extractSpreadsheetId,
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
  ShieldCheck,
  Send,
} from 'lucide-react';

interface SheetsConfigModalProps {
  user: User | null;
  onSignIn: () => void;
  sheetConfig: SheetConfig | null;
  onSaveConfig: (config: SheetConfig | null) => void;
  onCreateNewSheet: (customTitle?: string) => Promise<SheetConfig>;
  onTestConnection: (spreadsheetId: string) => Promise<string | boolean>;
  onSendTestRow: () => Promise<void>;
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
  onSendTestRow,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'create' | 'webhook'>('link');
  const [sheetTitle, setSheetTitle] = useState(
    'Respuestas - Encuesta Procrastinación y Hábitos de Estudio'
  );
  const [existingUrlOrId, setExistingUrlOrId] = useState(sheetConfig?.spreadsheetId || '');
  const [webhookUrl, setWebhookUrl] = useState(sheetConfig?.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(sheetConfig?.autoSync ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [isTestingRow, setIsTestingRow] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleCreateNew = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const config = await onCreateNewSheet(sheetTitle.trim());
      setFeedback({
        type: 'success',
        message: `¡Hoja de cálculo creada exitosamente en tu Google Drive (${config.sheetTitle})!`,
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
    if (!id || id.length < 5) {
      setFeedback({
        type: 'error',
        message: 'Por favor ingresa un enlace o ID válido de Google Sheets (ej. https://docs.google.com/spreadsheets/d/...)',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    let detectedTitle = 'Hoja de Google Sheets Vinculada';

    // Try testing connection if user is authenticated, but NEVER block saving
    if (user) {
      try {
        const testResult = await onTestConnection(id);
        if (typeof testResult === 'string') {
          detectedTitle = testResult;
        }
      } catch (err: any) {
        console.warn('Test connection notice:', err);
      }
    }

    const newConfig: SheetConfig = {
      spreadsheetId: id,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      sheetTitle: detectedTitle,
      webhookUrl: webhookUrl.trim() || sheetConfig?.webhookUrl,
      autoSync: true,
    };

    onSaveConfig(newConfig);

    setFeedback({
      type: 'success',
      message: '¡Hoja de cálculo vinculada exitosamente! Todas las respuestas se guardarán aquí.',
    });

    setIsLoading(false);
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
      message: '¡URL de Webhook guardada! Ahora las respuestas se envían sin requerir login.',
    });
  };

  const handleTestRow = async () => {
    setIsTestingRow(true);
    setFeedback(null);
    try {
      await onSendTestRow();
      setFeedback({
        type: 'success',
        message: '¡Fila de prueba enviada con éxito! Revisa tu Google Sheet para verla reflejada.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudo enviar la fila de prueba. Revisa los permisos de la hoja.',
      });
    } finally {
      setIsTestingRow(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleUnlink = () => {
    onSaveConfig(null);
    setFeedback({
      type: 'info',
      message: 'Hoja desvinculada. Las respuestas se seguirán guardando en memoria local.',
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
                Vincular con Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Conecta tu cuenta y tu hoja de cálculo para registrar respuestas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account State Card */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${user ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className="text-slate-600">
              Cuenta de Google:{' '}
              <strong className="text-slate-900 font-semibold">
                {user ? user.email : 'No iniciada aún'}
              </strong>
            </span>
          </div>

          {!user ? (
            <button
              type="button"
              onClick={onSignIn}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Conectar Cuenta de Google
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conectada</span>
            </div>
          )}
        </div>

        {/* Current Linked Sheet Status */}
        {sheetConfig && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Hoja Vinculada:{' '}
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
                <span>Abrir en Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleTestRow}
                disabled={isTestingRow}
                className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                {isTestingRow ? 'Enviando...' : '🧪 Probar fila'}
              </button>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-rose-600 hover:text-rose-800 font-medium ml-1 cursor-pointer"
              >
                Desvincular
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2 text-xs">
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
            <span>1. Vincular por Enlace (Recomendado)</span>
          </button>

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
            <span>2. Crear Nueva Hoja</span>
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
            <span>3. Webhook de Apps Script</span>
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
                  : feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
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

          {/* TAB 1: LINK EXISTING URL */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Vincular directamente tu Google Sheet
                </div>
                <p>
                  Pega el enlace completo de tu hoja de cálculo. La aplicación detectará
                  el ID y enviará las respuestas automáticamente a esa hoja.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace de tu Google Sheet:
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1abcXYZ.../edit"
                  value={existingUrlOrId}
                  onChange={(e) => setExistingUrlOrId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Puedes pegar la URL completa desde la barra de tu navegador o solo el ID del documento.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSyncDirect"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label
                  htmlFor="autoSyncDirect"
                  className="text-xs text-slate-700 font-medium cursor-pointer"
                >
                  Sincronizar automáticamente cada respuesta cuando un usuario complete la encuesta
                </label>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleLinkExisting}
                  disabled={isLoading || !existingUrlOrId.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? 'Vinculando hoja...' : '✓ Vincular Hoja de Google Sheets'}
                </button>

                {sheetConfig && (
                  <button
                    type="button"
                    onClick={handleTestRow}
                    disabled={isTestingRow}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isTestingRow ? 'Enviando...' : '🧪 Probar Fila'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Creación automática en tu cuenta
                </div>
                <p>
                  Crea una hoja de cálculo nueva en tu Google Drive con una pestaña
                  llamada <strong>Respuestas</strong> y los 28 encabezados preparados.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre para la nueva hoja de cálculo:
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creando hoja en Google Drive...</span>
                  </span>
                ) : (
                  <span>Crear Hoja de Cálculo Ahora</span>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT WEBHOOK */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  Envío anónimo universal (ideal para encuestas masivas)
                </div>
                <p>
                  Si no deseas que tus alumnos inicien sesión para guardar en tu hoja,
                  crea un script en tu Google Sheet:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Abre tu Hoja en Google Sheets &gt; Extensiones &gt; Apps Script.</li>
                  <li>Pega el código de abajo y guarda.</li>
                  <li>
                    Haz clic en <strong>Implementar &gt; Nueva implementación</strong>, elige{' '}
                    <strong>Aplicación web</strong>, acceso: <em>Cualquiera</em>.
                  </li>
                  <li>Pega la URL aquí.</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-700">
                    Código de Apps Script:
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
            {sheetConfig ? '✓ Hoja Vinculada' : 'Sin hoja vinculada'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
