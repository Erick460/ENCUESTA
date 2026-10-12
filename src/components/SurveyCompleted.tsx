import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SurveyResponse } from '../types/survey';
import { SheetConfig } from '../services/googleSheets';
import {
  CheckCircle2,
  FileSpreadsheet,
  ExternalLink,
  RotateCcw,
  BarChart3,
  Download,
  AlertTriangle,
  Moon,
  Clock,
  Lightbulb,
} from 'lucide-react';

interface SurveyCompletedProps {
  lastResponse: SurveyResponse;
  sheetConfig: SheetConfig | null;
  onNewSubmission: () => void;
  onViewDashboard: () => void;
  onDownloadCsv: () => void;
}

export const SurveyCompleted: React.FC<SurveyCompletedProps> = ({
  lastResponse,
  sheetConfig,
  onNewSubmission,
  onViewDashboard,
  onDownloadCsv,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Diagnostic calculations
  const examDelay = lastResponse.q3_demora_examenes || 1;
  const examProblem = lastResponse.q4_problema_examenes || 1;
  const taskDelay = lastResponse.q6_demora_tareas || 1;

  // Identify highest triggers among Q9 - Q19
  const triggerItems = [
    { title: 'Miedo a una mala calificación', score: lastResponse.q9_miedo_calificacion },
    { title: 'Falta de autoconfianza', score: lastResponse.q10_falta_confianza },
    { title: 'Materia o temario desbordante', score: lastResponse.q11_desbordado_materia },
    { title: 'Múltiples responsabilidades externas', score: lastResponse.q12_otras_cosas },
    { title: 'Aversión al estudio de exámenes', score: lastResponse.q13_no_gusta_estudiar },
    { title: 'Dificultad para priorizar materias', score: lastResponse.q14_dificultad_priorizar },
    { title: 'Compañeros tampoco estudiaban', score: lastResponse.q15_companeros_no_estudian },
    { title: 'Presión social o planes de amigos', score: lastResponse.q16_presion_amigos },
    { title: 'Rechazo a plazos estrictos', score: lastResponse.q17_rechazo_plazos },
    { title: 'Dudas no resueltas con el docente', score: lastResponse.q18_dudas_no_pregunta },
    { title: 'Exceso de confianza en el tiempo', score: lastResponse.q19_exceso_confianza },
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  const topTriggers = triggerItems.filter((t) => (t.score || 0) >= 4);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      {/* Success Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center mb-8 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ¡Encuesta Completada con Éxito!
        </h2>
        <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
          Gracias por responder con honestidad. Los datos han sido procesados y
          almacenados de forma segura.
        </p>

        {/* Google Sheets Status Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-lg mx-auto">
          {sheetConfig ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizado en Google Sheets
                  </div>
                  <div className="text-xs font-medium text-slate-800 truncate max-w-[240px]">
                    {sheetConfig.sheetTitle}
                  </div>
                </div>
              </div>
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>Ver Hoja</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-amber-800">
                  Guardado en base de datos local.
                </span>{' '}
                Puedes vincular tu Google Sheet en la pestaña de configuración para
                sincronizar todas las respuestas recolectadas con 1 clic.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics & Student Insights */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Diagnóstico de Hábitos de Estudio
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación preliminar basada en las 28 preguntas del cuestionario
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Demora en Exámenes</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {examDelay} <span className="text-xs text-slate-400 font-normal">/ 5</span>
            </div>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                examDelay >= 4
                  ? 'bg-rose-100 text-rose-700'
                  : examDelay === 3
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {examDelay >= 4 ? 'Alta postergación' : examDelay === 3 ? 'Postergación moderada' : 'Buen inicio'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Demora en Tareas</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {taskDelay} <span className="text-xs text-slate-400 font-normal">/ 5</span>
            </div>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                taskDelay >= 4
                  ? 'bg-rose-100 text-rose-700'
                  : taskDelay === 3
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {taskDelay >= 4 ? 'Alto retraso semanal' : taskDelay === 3 ? 'Constancia variable' : 'Buen ritmo semanal'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Sueño Noche Previa</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
              <Moon className="w-5 h-5 text-indigo-500" />
              {lastResponse.q23_horas_sueno_noche_previa || 0} hrs
            </div>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                (lastResponse.q23_horas_sueno_noche_previa || 0) < 6
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {(lastResponse.q23_horas_sueno_noche_previa || 0) < 6
                ? 'Privación de sueño'
                : 'Descanso adecuado'}
            </span>
          </div>
        </div>

        {/* Factores detonantes */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Principales factores de postergación identificados
          </h4>
          {topTriggers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTriggers.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{t.title}</span>
                  <span className="font-bold text-rose-900 bg-rose-200/60 px-1.5 py-0.5 rounded text-[10px]">
                    {t.score}/5
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No reportaste motivos de postergación en niveles críticos (4 o 5). ¡Excelente equilibrio!
            </p>
          )}
        </div>

        {/* Comparativa de esfuerzo */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>
              Empezaste a estudiar{' '}
              <strong>{lastResponse.q20_dias_antes_estudio} días antes</strong>.
              Dedicaste{' '}
              <strong>{lastResponse.q21_horas_ultimos_3_dias} hrs</strong> en los 3 días
              finales vs{' '}
              <strong>{lastResponse.q22_horas_11_dias_previos} hrs</strong> en los 11 días
              previos.
            </span>
          </div>
          <div className="font-semibold text-slate-800 shrink-0">
            Método: {lastResponse.q25_metodo_repaso}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNewSubmission}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Llenar otra respuesta</span>
        </button>

        <button
          type="button"
          onClick={onViewDashboard}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ver todas las respuestas y analítica</span>
        </button>

        <button
          type="button"
          onClick={onDownloadCsv}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar CSV</span>
        </button>
      </div>
    </div>
  );
};
