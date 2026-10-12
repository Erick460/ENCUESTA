import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SurveyResponse } from '../types/survey';
import {
  CheckCircle2,
  RotateCcw,
  BarChart3,
  Moon,
  Clock,
  BookOpen,
  Award,
} from 'lucide-react';

interface SurveyCompletedProps {
  lastResponse: SurveyResponse;
  onNewSubmission: () => void;
  onViewDashboard: () => void;
}

export const SurveyCompleted: React.FC<SurveyCompletedProps> = ({
  lastResponse,
  onNewSubmission,
  onViewDashboard,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6'],
      });
    } catch {
      // ignore
    }
  }, []);

  const examDelay = lastResponse.q4_demora_examenes || 1;
  const taskDelay = lastResponse.q7_demora_tareas || 1;

  // Identify highest triggers among Q9 - Q19
  const triggerItems = [
    { title: 'Preocupación por mala calificación', score: lastResponse.q9_miedo_calificacion },
    { title: 'Falta de autoconfianza', score: lastResponse.q10_falta_confianza },
    { title: 'Cantidad desbordante de materia', score: lastResponse.q11_desbordado_materia },
    { title: 'Muchas otras obligaciones', score: lastResponse.q12_otras_cosas },
    { title: 'No gusta estudiar para exámenes', score: lastResponse.q13_no_gusta_estudiar },
    { title: 'Dificultad para priorizar materias', score: lastResponse.q14_dificultad_priorizar },
    { title: 'Compañeros tampoco empezaron', score: lastResponse.q15_companeros_no_estudian },
    { title: 'Presión social o de amigos', score: lastResponse.q16_presion_amigos },
    { title: 'Rechazo a plazos y fechas límite', score: lastResponse.q17_rechazo_plazos },
    { title: 'Dudas no consultadas al docente', score: lastResponse.q18_dudas_no_pregunta },
    { title: 'Exceso de confianza en el tiempo', score: lastResponse.q19_exceso_confianza },
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  const topTriggers = triggerItems.filter((t) => (t.score || 0) >= 4);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      {/* Success Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ¡Respuesta Registrada con Éxito!
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
          Tus respuestas han sido procesadas y guardadas correctamente. Agradecemos tu participación
          en este estudio de investigación sobre hábitos académicos.
        </p>
      </div>

      {/* Student Academic Snapshot */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm mb-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Resumen de tu Perfil Académico
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lastResponse.q1_carrera_ciclo} • Ciclo más alto: {lastResponse.q3_ciclo_mas_alto}
            </p>
          </div>
          <span className="text-xs bg-slate-100 font-mono text-slate-600 px-2.5 py-1 rounded-lg">
            {lastResponse.id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="text-[11px] text-slate-500 font-medium">Demora en Exámenes</div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {examDelay} <span className="text-xs text-slate-400 font-normal">/ 5</span>
            </div>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                examDelay >= 4
                  ? 'bg-rose-100 text-rose-700'
                  : examDelay === 3
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {examDelay >= 4 ? 'Alta postergación' : examDelay === 3 ? 'Moderado' : 'Buen ritmo'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="text-[11px] text-slate-500 font-medium">Sueño Pre-Examen</div>
            <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1">
              <Moon className="w-4 h-4 text-indigo-500" />
              {lastResponse.q23_horas_sueno_noche_previa || 0} hrs
            </div>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
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

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="text-[11px] text-slate-500 font-medium">Método Principal</div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {lastResponse.q25_metodo_repaso}
            </div>
            <span className="inline-block mt-1 text-[10px] text-slate-400">
              Inicio {lastResponse.q20_dias_antes_estudio} días antes
            </span>
          </div>
        </div>

        {/* Top drivers */}
        {topTriggers.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-700 mb-1.5">
              Factores de mayor peso en tu postergación:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topTriggers.map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-medium"
                >
                  {t.title} ({t.score}/5)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNewSubmission}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Llenar otra respuesta</span>
        </button>

        <button
          type="button"
          onClick={onViewDashboard}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Ver panel general</span>
        </button>
      </div>
    </div>
  );
};
