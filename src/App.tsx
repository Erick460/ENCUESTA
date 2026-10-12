/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedToken,
} from './services/auth';
import {
  SheetConfig,
  getStoredSheetConfig,
  saveStoredSheetConfig,
  getStoredResponses,
  saveStoredResponses,
  addStoredResponse,
  createSurveySpreadsheet,
  appendResponseToSheet,
  appendBatchToSheet,
  sendToWebhook,
  downloadResponsesAsCsv,
  downloadResponsesAsJson,
} from './services/googleSheets';
import { SurveyResponse } from './types/survey';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { SurveyCompleted } from './components/SurveyCompleted';
import { ResponsesDashboard } from './components/ResponsesDashboard';
import { SheetsConfigModal } from './components/SheetsConfigModal';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [currentView, setCurrentView] = useState<'survey' | 'completed' | 'dashboard' | 'config'>(
    'survey'
  );
  const [lastSubmittedResponse, setLastSubmittedResponse] = useState<SurveyResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Initialize Auth & load local storage
  useEffect(() => {
    // 1. Load stored sheet config
    const savedConfig = getStoredSheetConfig();
    if (savedConfig) {
      setSheetConfig(savedConfig);
    }

    // 2. Load stored responses
    const savedResponses = getStoredResponses();
    if (savedResponses.length > 0) {
      setResponses(savedResponses);
    }

    // 3. Setup Firebase Auth listener
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setToken(result.accessToken);
      showToast(`¡Bienvenido, ${result.user.displayName || result.user.email}!`, 'success');

      // If user doesn't have a sheet connected, open config modal to help them create one
      if (!sheetConfig) {
        setIsConfigModalOpen(true);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast('No se pudo iniciar sesión con Google.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showToast('Sesión de Google cerrada.', 'info');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveConfig = (config: SheetConfig | null) => {
    setSheetConfig(config);
    saveStoredSheetConfig(config);
    if (config) {
      showToast(`Hoja conectada: ${config.sheetTitle}`, 'success');
    }
  };

  const handleCreateNewSheet = async (customTitle?: string): Promise<SheetConfig> => {
    let currentToken = token;
    if (!currentToken) {
      const res = await googleSignIn();
      currentToken = res.accessToken;
      setUser(res.user);
      setToken(currentToken);
    }

    const { spreadsheetId, spreadsheetUrl } = await createSurveySpreadsheet(
      currentToken,
      customTitle
    );

    const newConfig: SheetConfig = {
      spreadsheetId,
      spreadsheetUrl,
      sheetTitle: customTitle || 'Respuestas - Encuesta Procrastinación',
      autoSync: true,
    };

    handleSaveConfig(newConfig);
    return newConfig;
  };

  const handleTestConnection = async (spreadsheetId: string): Promise<boolean> => {
    let currentToken = token;
    if (!currentToken) {
      const res = await googleSignIn();
      currentToken = res.accessToken;
      setUser(res.user);
      setToken(currentToken);
    }

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`,
      {
        headers: { Authorization: `Bearer ${currentToken}` },
      }
    );

    if (!res.ok) {
      throw new Error(
        'No se pudo acceder a la hoja. Verifica que tengas permisos de edición con esta cuenta.'
      );
    }

    return true;
  };

  const handleSurveySubmit = async (formData: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    setIsSubmitting(true);

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newResponse: SurveyResponse = {
      ...formData,
      id: `RESP-${now.getTime().toString(36).toUpperCase()}`,
      timestamp: formattedTimestamp,
      syncedToGoogleSheets: false,
    };

    let synced = false;

    // 1. Sync via direct Google Sheets API if connected and token available
    if (sheetConfig && sheetConfig.spreadsheetId && sheetConfig.spreadsheetId !== 'webhook-only') {
      try {
        let currentToken = token;
        if (!currentToken && user) {
          currentToken = await getAccessToken();
        }

        if (currentToken) {
          await appendResponseToSheet(currentToken, sheetConfig.spreadsheetId, newResponse);
          synced = true;
        }
      } catch (err: any) {
        console.warn('Google Sheets append error:', err);
      }
    }

    // 2. Also send to Webhook if configured (ideal for distributed anonymous students)
    if (sheetConfig?.webhookUrl) {
      try {
        await sendToWebhook(sheetConfig.webhookUrl, newResponse);
        synced = true;
      } catch (err) {
        console.warn('Webhook dispatch warning:', err);
      }
    }

    newResponse.syncedToGoogleSheets = synced;

    // Save locally
    const updatedResponses = addStoredResponse(newResponse);
    setResponses(updatedResponses);
    setLastSubmittedResponse(newResponse);
    setIsSubmitting(false);

    if (synced) {
      showToast('¡Respuesta guardada y sincronizada en tu Google Sheet!', 'success');
    } else {
      showToast('Respuesta guardada localmente.', 'info');
    }

    setCurrentView('completed');
  };

  const handleSyncAllToSheets = async () => {
    if (!sheetConfig) {
      setIsConfigModalOpen(true);
      return;
    }

    if (responses.length === 0) {
      showToast('No hay respuestas para sincronizar.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      let currentToken = token;
      if (!currentToken) {
        const sign = await googleSignIn();
        currentToken = sign.accessToken;
        setUser(sign.user);
        setToken(currentToken);
      }

      await appendBatchToSheet(currentToken, sheetConfig.spreadsheetId, responses);
      showToast(`¡Se han sincronizado ${responses.length} respuestas a Google Sheets!`, 'success');
    } catch (err: any) {
      console.error('Batch sync error:', err);
      showToast(err.message || 'Error al sincronizar con Google Sheets', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllResponses = () => {
    saveStoredResponses([]);
    setResponses([]);
    showToast('Respuestas locales eliminadas.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              notification.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/30'
                : notification.type === 'error'
                ? 'bg-slate-900 text-rose-400 border-rose-500/30'
                : 'bg-slate-900 text-sky-400 border-sky-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        sheetConfig={sheetConfig}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        currentView={currentView === 'completed' ? 'survey' : currentView}
        onViewChange={(view) => {
          if (view === 'config') {
            setIsConfigModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        totalResponsesCount={responses.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Banner if Google Sheets is not yet linked */}
        {!sheetConfig && currentView === 'survey' && (
          <div className="bg-emerald-900 text-emerald-100 py-2.5 px-4 text-xs">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  <strong>Tip para el docente/administrador:</strong> Conecta tu cuenta de Google
                  para crear o vincular la hoja de cálculo donde se registrarán las respuestas en
                  tiempo real.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="underline font-bold text-white hover:text-emerald-200 shrink-0 cursor-pointer"
              >
                Conectar ahora
              </button>
            </div>
          </div>
        )}

        {/* View 1: Survey Form */}
        {currentView === 'survey' && (
          <SurveyForm
            onSubmit={handleSurveySubmit}
            isSubmitting={isSubmitting}
            hasGoogleSheetConnected={!!sheetConfig}
          />
        )}

        {/* View 2: Survey Completed Confirmation */}
        {currentView === 'completed' && lastSubmittedResponse && (
          <SurveyCompleted
            lastResponse={lastSubmittedResponse}
            sheetConfig={sheetConfig}
            onNewSubmission={() => setCurrentView('survey')}
            onViewDashboard={() => setCurrentView('dashboard')}
            onDownloadCsv={() => downloadResponsesAsCsv([lastSubmittedResponse])}
          />
        )}

        {/* View 3: Responses Dashboard */}
        {currentView === 'dashboard' && (
          <ResponsesDashboard
            responses={responses}
            sheetConfig={sheetConfig}
            onSyncAllToSheets={handleSyncAllToSheets}
            isSyncing={isSyncing}
            onExportCsv={() => downloadResponsesAsCsv(responses)}
            onExportJson={() => downloadResponsesAsJson(responses)}
            onClearAllResponses={handleClearAllResponses}
            onOpenConfig={() => setIsConfigModalOpen(true)}
          />
        )}
      </main>

      {/* Google Sheets Config Modal */}
      <SheetsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        user={user}
        onSignIn={handleSignIn}
        sheetConfig={sheetConfig}
        onSaveConfig={handleSaveConfig}
        onCreateNewSheet={handleCreateNewSheet}
        onTestConnection={handleTestConnection}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800">
              Encuesta de Hábitos y Procrastinación
            </span>{' '}
            • 28 Preguntas Académicas
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Sincronización con Google Sheets</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-emerald-600 hover:underline font-medium cursor-pointer"
            >
              Configurar Hoja
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
