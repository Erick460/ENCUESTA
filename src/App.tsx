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
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
    const savedConfig = getStoredSheetConfig();
    if (savedConfig) {
      setSheetConfig(savedConfig);
    }

    const savedResponses = getStoredResponses();
    if (savedResponses.length > 0) {
      setResponses(savedResponses);
    }

    const unsubscribe = initAuth((currentUser, accessToken) => {
      setUser(currentUser);
      if (accessToken) {
        setToken(accessToken);
      }
    });

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
      showToast(`Cuenta conectada: ${result.user.email}`, 'success');
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast('Error al conectar con Google. Permite las ventanas emergentes.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showToast('Sesión cerrada.', 'info');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveConfig = (config: SheetConfig | null) => {
    setSheetConfig(config);
    saveStoredSheetConfig(config);
    if (config) {
      showToast(`Google Sheet conectado: ${config.sheetTitle}`, 'success');
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

  const handleTestConnection = async (spreadsheetId: string): Promise<string | boolean> => {
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

    if (res.ok) {
      const data = await res.json();
      return data.properties?.title || true;
    }

    return true;
  };

  const handleSendTestRow = async () => {
    if (!sheetConfig) {
      throw new Error('Primero vincula una hoja o ingresa la URL de la aplicación web.');
    }

    const testResponse: SurveyResponse = {
      id: `TEST-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleString('es-ES'),
      q1_carrera_ciclo: 'Ingeniería de Sistemas (Prueba)',
      q2_materias_perdidas: 0,
      q3_ciclo_mas_alto: 4,
      q4_demora_examenes: 2,
      q5_problema_examenes: 2,
      q6_reducir_examenes: 4,
      q7_demora_tareas: 2,
      q8_reducir_tareas: 4,
      q9_miedo_calificacion: 1,
      q10_falta_confianza: 1,
      q11_desbordado_materia: 1,
      q12_otras_cosas: 2,
      q13_no_gusta_estudiar: 1,
      q14_dificultad_priorizar: 1,
      q15_companeros_no_estudian: 1,
      q16_presion_amigos: 1,
      q17_rechazo_plazos: 1,
      q18_dudas_no_pregunta: 1,
      q19_exceso_confianza: 1,
      q20_dias_antes_estudio: 4,
      q23_horas_sueno_noche_previa: 7,
      q25_metodo_repaso: 'Resolver ejercicios o autoevaluarme',
      q28_porcentaje_companeros: 50,
      syncedToGoogleSheets: true,
    };

    let sent = false;

    // 1. If Webhook is configured, send via Webhook (no OAuth required!)
    if (sheetConfig.webhookUrl) {
      sent = await sendToWebhook(sheetConfig.webhookUrl, testResponse);
    }

    // 2. If direct OAuth token is available, also append via Sheets API
    if (!sent && sheetConfig.spreadsheetId && sheetConfig.spreadsheetId !== 'webhook-sheets') {
      let currentToken = token;
      if (!currentToken) {
        try {
          const res = await googleSignIn();
          currentToken = res.accessToken;
          setUser(res.user);
          setToken(currentToken);
        } catch {
          // popup blocked
        }
      }

      if (currentToken) {
        await appendResponseToSheet(currentToken, sheetConfig.spreadsheetId, testResponse);
        sent = true;
      }
    }

    if (!sent) {
      throw new Error(
        'Por favor ingresa la URL de la Aplicación Web (Webhook) de Apps Script para conectar tu hoja sin errores.'
      );
    }

    showToast('¡Fila de prueba insertada con éxito en Google Sheets!', 'success');
  };

  // Submit response quietly to Google Sheet without showing URL in the survey
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

    // 1. Send via Webhook if configured (preferred: 100% reliable for any student)
    if (sheetConfig?.webhookUrl) {
      try {
        synced = await sendToWebhook(sheetConfig.webhookUrl, newResponse);
      } catch (err) {
        console.warn('Webhook dispatch notice:', err);
      }
    }

    // 2. Or direct Sheets API if token available
    if (!synced && sheetConfig?.spreadsheetId && sheetConfig.spreadsheetId !== 'webhook-sheets') {
      try {
        let currentToken = token;
        if (!currentToken) {
          currentToken = await getAccessToken();
        }

        if (currentToken) {
          await appendResponseToSheet(currentToken, sheetConfig.spreadsheetId, newResponse);
          synced = true;
        }
      } catch (err: any) {
        console.warn('Google Sheets background sync notice:', err);
      }
    }

    newResponse.syncedToGoogleSheets = synced;

    // Save locally
    const updatedResponses = addStoredResponse(newResponse);
    setResponses(updatedResponses);
    setLastSubmittedResponse(newResponse);
    setIsSubmitting(false);

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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
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
        {/* View 1: Clean, Distraction-Free Survey Form */}
        {currentView === 'survey' && (
          <SurveyForm
            onSubmit={handleSurveySubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* View 2: Clean Confirmation View */}
        {currentView === 'completed' && lastSubmittedResponse && (
          <SurveyCompleted
            lastResponse={lastSubmittedResponse}
            onNewSubmission={() => setCurrentView('survey')}
            onViewDashboard={() => setCurrentView('dashboard')}
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

      {/* Google Sheets Config Modal (Hidden from respondents, opened via header/footer) */}
      <SheetsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        user={user}
        onSignIn={handleSignIn}
        sheetConfig={sheetConfig}
        onSaveConfig={handleSaveConfig}
        onCreateNewSheet={handleCreateNewSheet}
        onTestConnection={handleTestConnection}
        onSendTestRow={handleSendTestRow}
      />

      {/* Discreet Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-slate-600">
            Encuesta Académica sobre Hábitos de Estudio y Procrastinación
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-[11px]"
            >
              Configurar Google Sheet
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
