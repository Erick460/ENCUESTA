import React, { useState } from 'react';
import { SurveyResponse } from '../types/survey';
import { SheetConfig } from '../services/googleSheets';
import {
  FileSpreadsheet,
  Download,
  Search,
  ExternalLink,
  RefreshCw,
  Trash2,
  TrendingUp,
  Clock,
  Moon,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';

interface ResponsesDashboardProps {
  responses: SurveyResponse[];
  sheetConfig: SheetConfig | null;
  onSyncAllToSheets: () => Promise<void>;
  isSyncing: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onClearAllResponses: () => void;
  onOpenConfig: () => void;
}

export const ResponsesDashboard: React.FC<ResponsesDashboardProps> = ({
  responses,
  sheetConfig,
  onSyncAllToSheets,
  isSyncing,
  onExportCsv,
  onExportJson,
  onClearAllResponses,
  onOpenConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter responses
  const filteredResponses = responses.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.q1_carrera_ciclo?.toLowerCase().includes(term) ||
      r.q2_asignatura_fecha?.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  });

  // Calculate aggregates
  const total = responses.length;
  const avgQ3 = total
    ? (responses.reduce((sum, r) => sum + (r.q3_demora_examenes || 0), 0) / total).toFixed(1)
    : '0';
  const avgQ6 = total
    ? (responses.reduce((sum, r) => sum + (r.q6_demora_tareas || 0), 0) / total).toFixed(1)
    : '0';
  const avgSleep = total
    ? (responses.reduce((sum, r) => sum + (r.q23_horas_sueno_noche_previa || 0), 0) / total).toFixed(1)
    : '0';
  const avgPeers = total
    ? Math.round(
        responses.reduce((sum, r) => sum + (r.q28_porcentaje_companeros || 0), 0) / total
      )
    : 0;

  // Reasons averages (Q9 to Q19)
  const reasonsData = [
    {
      code: 'Q9',
      label: 'Miedo a mala calificación',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q9_miedo_calificacion || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q10',
      label: 'Falta de autoconfianza',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q10_falta_confianza || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q11',
      label: 'Desbordado por la materia',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q11_desbordado_materia || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q12',
      label: 'Muchas otras obligaciones',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q12_otras_cosas || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q13',
      label: 'No gusta estudiar exámenes',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q13_no_gusta_estudiar || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q14',
      label: 'Dificultad para priorizar',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q14_dificultad_priorizar || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q15',
      label: 'Compañeros no estudian',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q15_companeros_no_estudian || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q16',
      label: 'Presión social de amigos',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q16_presion_amigos || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q17',
      label: 'Rechazo a plazos límite',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q17_rechazo_plazos || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q18',
      label: 'Dudas no resueltas con docente',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q18_dudas_no_pregunta || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q19',
      label: 'Exceso de confianza en el tiempo',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q19_exceso_confianza || 0), 0) / total).toFixed(2)
        : '0',
    },
  ].sort((a, b) => Number(b.avg) - Number(a.avg));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Panel de Respuestas
              </span>
              <span className="text-xs text-slate-500">
                {total} {total === 1 ? 'registro' : 'registros'} capturados
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Resultados y Sincronización con Google Sheets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisa las métricas, exporta datos y sincroniza directamente con tu hoja de cálculo
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {sheetConfig ? (
              <>
                <button
                  type="button"
                  onClick={onSyncAllToSheets}
                  disabled={isSyncing || total === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar a Google Sheets</span>
                </button>

                <a
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Hoja</span>
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenConfig}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Conectar Google Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportCsv}
              disabled={total === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV (Excel)</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              disabled={total === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            {total > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Limpiar base de datos local"
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Respuestas
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{total}</div>
          <span className="text-[11px] text-slate-400">Estudiantes o registros</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Demora Exámenes (Q3)
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {avgQ3} <span className="text-sm font-normal text-slate-400">/ 5</span>
          </div>
          <span className="text-[11px] text-slate-400">Promedio de escala 1 a 5</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Demora Tareas (Q6)
            </span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {avgQ6} <span className="text-sm font-normal text-slate-400">/ 5</span>
          </div>
          <span className="text-[11px] text-slate-400">Promedio lecturas y trabajos</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sueño Pre-Examen (Q23)
            </span>
            <Moon className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {avgSleep} <span className="text-sm font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[11px] text-slate-400">
            % Compañeros que corre al final: {avgPeers}%
          </span>
        </div>
      </div>

      {/* Breakdown Section: Motivos Ranking */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-8">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Ranking de Motivos de Procrastinación (Q9 a Q19)
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Puntuación promedio de cada factor según las respuestas (de 1 a 5)
        </p>

        {total === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aún no hay respuestas registradas para calcular estadísticas.
          </div>
        ) : (
          <div className="space-y-3">
            {reasonsData.map((item) => {
              const score = Number(item.avg);
              const percentage = Math.min(100, Math.round((score / 5) * 100));

              return (
                <div key={item.code} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">
                      <span className="text-slate-400 font-mono mr-1.5">{item.code}</span>
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.avg} / 5
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 3.8
                          ? 'bg-rose-500'
                          : score >= 2.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por carrera o asignatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Mostrando <strong>{filteredResponses.length}</strong> de {total} respuestas
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Q1 Carrera / Ciclo</th>
                <th className="px-4 py-3">Q2 Asignatura</th>
                <th className="px-3 py-3 text-center">Q3 Exámenes</th>
                <th className="px-3 py-3 text-center">Q6 Tareas</th>
                <th className="px-3 py-3 text-center">Q20 Días</th>
                <th className="px-3 py-3 text-center">Q23 Sueño</th>
                <th className="px-4 py-3">Q25 Método</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No se encontraron respuestas registradas.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {r.timestamp}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px] truncate">
                      {r.q1_carrera_ciclo}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">
                      {r.q2_asignatura_fecha}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          r.q3_demora_examenes >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : r.q3_demora_examenes === 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.q3_demora_examenes}/5
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          r.q6_demora_tareas >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : r.q6_demora_tareas === 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.q6_demora_tareas}/5
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q20_dias_antes_estudio}d
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q23_horas_sueno_noche_previa}h
                    </td>
                    <td className="px-4 py-3 max-w-[140px] truncate text-slate-600">
                      {r.q25_metodo_repaso}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedResponse(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver 28</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Full 28 Responses for a Student */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Detalle Completo de Respuesta
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedResponse.id} • {selectedResponse.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Part 1 */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Parte 1: Datos Académicos
                </div>
                <div>
                  <strong className="text-slate-700">Q1 Carrera y ciclo:</strong>{' '}
                  {selectedResponse.q1_carrera_ciclo}
                </div>
                <div>
                  <strong className="text-slate-700">Q2 Asignatura y fecha:</strong>{' '}
                  {selectedResponse.q2_asignatura_fecha}
                </div>
              </div>

              {/* Part 2 */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Parte 2: Frecuencia e Impacto de Procrastinación
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Q3 Demora exámenes: <strong>{selectedResponse.q3_demora_examenes}/5</strong></div>
                  <div>Q4 Problema exámenes: <strong>{selectedResponse.q4_problema_examenes}/5</strong></div>
                  <div>Q5 Reducir exámenes: <strong>{selectedResponse.q5_reducir_examenes}/5</strong></div>
                  <div>Q6 Demora tareas: <strong>{selectedResponse.q6_demora_tareas}/5</strong></div>
                  <div>Q7 Problema tareas: <strong>{selectedResponse.q7_problema_tareas}/5</strong></div>
                  <div>Q8 Reducir tareas: <strong>{selectedResponse.q8_reducir_tareas}/5</strong></div>
                </div>
              </div>

              {/* Part 3 */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Parte 3: Motivos de Procrastinación (1 a 5)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div>Q9 Miedo mala nota: <strong>{selectedResponse.q9_miedo_calificacion}/5</strong></div>
                  <div>Q10 Falta confianza: <strong>{selectedResponse.q10_falta_confianza}/5</strong></div>
                  <div>Q11 Desbordado materia: <strong>{selectedResponse.q11_desbordado_materia}/5</strong></div>
                  <div>Q12 Otras obligaciones: <strong>{selectedResponse.q12_otras_cosas}/5</strong></div>
                  <div>Q13 No gusta estudiar: <strong>{selectedResponse.q13_no_gusta_estudiar}/5</strong></div>
                  <div>Q14 Dificultad priorizar: <strong>{selectedResponse.q14_dificultad_priorizar}/5</strong></div>
                  <div>Q15 Compañeros igual: <strong>{selectedResponse.q15_companeros_no_estudian}/5</strong></div>
                  <div>Q16 Presión amigos: <strong>{selectedResponse.q16_presion_amigos}/5</strong></div>
                  <div>Q17 Rechazo plazos: <strong>{selectedResponse.q17_rechazo_plazos}/5</strong></div>
                  <div>Q18 Dudas docente: <strong>{selectedResponse.q18_dudas_no_pregunta}/5</strong></div>
                  <div>Q19 Exceso confianza: <strong>{selectedResponse.q19_exceso_confianza}/5</strong></div>
                </div>
              </div>

              {/* Part 4 */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Parte 4: Hábitos Reales
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Q20 Días antes estudio: <strong>{selectedResponse.q20_dias_antes_estudio} días</strong></div>
                  <div>Q21 Horas últimos 3 días: <strong>{selectedResponse.q21_horas_ultimos_3_dias} hrs</strong></div>
                  <div>Q22 Horas 11 días previas: <strong>{selectedResponse.q22_horas_11_dias_previos} hrs</strong></div>
                  <div>Q23 Horas sueño: <strong>{selectedResponse.q23_horas_sueno_noche_previa} hrs</strong></div>
                  <div>Q24 Horario / Calendario: <strong>{selectedResponse.q24_horario_calendario}</strong></div>
                  <div>Q25 Método repaso: <strong>{selectedResponse.q25_metodo_repaso} {selectedResponse.q25_metodo_repaso_otro ? `(${selectedResponse.q25_metodo_repaso_otro})` : ''}</strong></div>
                  <div>Q26 Anticipación entrega: <strong>{selectedResponse.q26_anticipacion_entrega}</strong></div>
                  <div>Q27 Consulta docente: <strong>{selectedResponse.q27_consulta_docente}</strong></div>
                  <div>Q28 % Compañeros últimos 3 días: <strong>{selectedResponse.q28_porcentaje_companeros}%</strong></div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing local responses (Required for destructive ops) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar {total} respuestas locales?
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Esta acción borrará las respuestas guardadas en el navegador. Si ya las
              sincronizaste a tu Google Sheet o descargaste el CSV, tus datos seguirán seguros
              en Google Drive.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllResponses();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Sí, eliminar respuestas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
