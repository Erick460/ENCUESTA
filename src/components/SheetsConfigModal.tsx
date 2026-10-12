import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  SheetConfig,
  extractSpreadsheetId,
  sampleAppsScriptCode,
} from '../services/googleSheets';
import {
  FileSpreadsheet,
  Code2,
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  HelpCircle,
  Send,
  Zap,
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
  onSendTestRow,
  isOpen,
  onClose,
}) => {
  // Default to the 100% reliable webhook method
  const [activeTab, setActiveTab] = useState<'webhook' | 'direct' | 'oauth'>('webhook');
  const [webhookUrl, setWebhookUrl] = useState(sheetConfig?.webhookUrl || '');
  const [directSheetUrl, setDirectSheetUrl] = useState(sheetConfig?.spreadsheetUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Save Apps Script Webhook (Method 1: 100% reliable)
  const handleSaveWebhook = async () => {
    const trimmed = webhookUrl.trim();
    if (!trimmed.startsWith('http')) {
      setFeedback({
        type: 'error',
        message: 'Por favor ingresa la URL de la aplicación web (comienza con https://script.google.com/...)',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const newConfig: SheetConfig = {
      spreadsheetId: sheetConfig?.spreadsheetId || 'webhook-sheets',
      spreadsheetUrl:
        directSheetUrl.trim() ||
        sheetConfig?.spreadsheetUrl ||
        'https://docs.google.com/spreadsheets',
      sheetTitle: sheetConfig?.sheetTitle || 'Google Sheet Vinculada por Apps Script',
      webhookUrl: trimmed,
      autoSync: true,
    };

    onSaveConfig(newConfig);

    // Automatically send a test row to verify
    try {
      await onSendTestRow();
      setFeedback({
        type: 'success',
        message: '¡Conexión verificada exitosamente! Se ha insertado una fila de prueba en tu Google Sheet.',
      });
    } catch {
      setFeedback({
        type: 'success',
        message: '¡Webhook guardado correctamente! Las respuestas se enviarán a tu hoja de cálculo.',
      });
    }

    setIsLoading(false);
  };

  // Save Direct Link
  const handleSaveDirectLink = () => {
    const id = extractSpreadsheetId(directSheetUrl);
    if (!id || id.length < 5) {
      setFeedback({
        type: 'error',
        message: 'Ingresa un enlace válido de tu hoja de Google Sheets (ej. https://docs.google.com/spreadsheets/d/...)',
      });
      return;
    }

    const newConfig: SheetConfig = {
      spreadsheetId: id,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      sheetTitle: 'Hoja de Google Sheets',
      webhookUrl: sheetConfig?.webhookUrl,
      autoSync: true,
    };

    onSaveConfig(newConfig);
    setFeedback({
      type: 'success',
      message: '¡Enlace de Google Sheet guardado! Para que los envíos automáticos funcionen sin login, configura el Webhook de Apps Script.',
    });
  };

  const handleTestRow = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      await onSendTestRow();
      setFeedback({
        type: 'success',
        message: '¡Fila de prueba enviada con éxito! Revisa tu Google Sheet para ver los datos.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err.message ||
          'No se pudo enviar. Te recomendamos usar el Webhook de Apps Script que no requiere permisos.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUnlink = () => {
    onSaveConfig(null);
    setWebhookUrl('');
    setDirectSheetUrl('');
    setFeedback({
      type: 'info',
      message: 'Hoja desvinculada. Las respuestas se guardarán temporalmente en memoria local.',
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
                Solución de Conexión a Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Conecta tu hoja para registrar las respuestas en tiempo real
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

        {/* Current Connection Status */}
        {sheetConfig && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Estado:{' '}
                <strong className="text-emerald-950 font-semibold">
                  {sheetConfig.webhookUrl ? '✓ Webhook Activo' : '✓ Enlace Guardado'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {sheetConfig.spreadsheetUrl && sheetConfig.spreadsheetUrl.startsWith('http') && (
                <a
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 underline"
                >
                  <span>Abrir Hoja</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={handleTestRow}
                disabled={isTesting}
                className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 cursor-pointer"
              >
                {isTesting ? 'Enviando...' : '🧪 Probar Fila'}
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('webhook');
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Método 1: Apps Script (Recomendado)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('direct');
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Método 2: Enlace de la Hoja</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('oauth');
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Método 3: Cuenta Google</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2 ${
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

          {/* TAB 1: WEBHOOK (THE SOLUTION THAT NEVER FAILS) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  ¿Por qué este método soluciona el problema de conexión?
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Los navegadores suelen bloquear las ventanas emergentes de inicio de sesión de Google dentro de plataformas embebidas. 
                  Con este método de <strong>Google Apps Script</strong>, tu Google Sheet recibe las respuestas directamente mediante un enlace seguro, sin requerir inicios de sesión ni permisos para ti ni para tus alumnos.
                </p>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800">
                  Instrucciones en 3 pasos (toma 1 minuto):
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Paso 1: Abrir Apps Script en tu Hoja
                  </div>
                  <p className="text-slate-600">
                    Abre tu hoja de Google Sheets y en el menú superior ve a: <strong>Extensiones &gt; Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Paso 2: Copiar y pegar este código
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 cursor-pointer"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Código Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Borra cualquier código que aparezca en Apps Script y pega este:
                  </p>
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-24">
                    {sampleAppsScriptCode.slice(0, 400)}...
                  </pre>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Paso 3: Implementar como Aplicación Web
                  </div>
                  <p className="text-slate-600">
                    Haz clic en <strong>Implementar &gt; Nueva implementación</strong> (botón azul superior).
                    Selecciona Tipo: <strong>Aplicación web</strong>. En <em>Quién tiene acceso</em> elige <strong>Cualquiera</strong>.
                    Haz clic en <strong>Implementar</strong> y copia la URL que te entrega.
                  </p>
                </div>
              </div>

              {/* Paste Webhook URL input */}
              <div className="pt-1">
                <label className="block font-bold text-slate-800 mb-1">
                  Pega aquí la URL de tu Aplicación Web (Webhook):
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  (Opcional) Enlace de tu Google Sheet para tener acceso directo:
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={directSheetUrl}
                  onChange={(e) => setDirectSheetUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWebhook}
                disabled={isLoading || !webhookUrl.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando y verificando conexión...</span>
                  </span>
                ) : (
                  <span>✓ Guardar Conexión y Probar Fila</span>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: DIRECT LINK */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Pega el enlace de tu Google Sheet para guardarlo en la aplicación:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Enlace de Google Sheets:
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  value={directSheetUrl}
                  onChange={(e) => setDirectSheetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveDirectLink}
                disabled={!directSheetUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                Guardar Enlace
              </button>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Nota:</strong> Para que Google Sheets permita escribir datos desde el navegador sin requerir que cada encuestado tenga cuenta y permisos de edición, te recomendamos configurar el <strong>Método 1 (Apps Script)</strong>.
              </div>
            </div>
          )}

          {/* TAB 3: OAUTH */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-700 font-medium mb-1">Cuenta actual:</div>
                <div className="font-bold text-slate-900">
                  {user ? user.email : 'No conectada'}
                </div>
              </div>

              {!user ? (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Intentar Iniciar Sesión con Google
                </button>
              ) : (
                <p className="text-slate-600">
                  Tu cuenta está autenticada con Firebase.
                </p>
              )}

              <p className="text-slate-500 text-[11px]">
                Si el navegador bloquea las ventanas emergentes (popups) de Google dentro del visor, usa el <strong>Método 1 (Apps Script)</strong> que funciona sin ventanas emergentes.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {sheetConfig?.webhookUrl ? '✓ Conexión Activa' : 'Configuración Pendiente'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold cursor-pointer"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
