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
  AlertCircle,
  X,
  Settings,
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

  const filteredResponses = responses.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.q1_carrera_ciclo?.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  });

  const total = responses.length;
  const avgQ4 = total
    ? (responses.reduce((sum, r) => sum + (r.q4_demora_examenes || 0), 0) / total).toFixed(1)
    : '0';
  const avgQ7 = total
    ? (responses.reduce((sum, r) => sum + (r.q7_demora_tareas || 0), 0) / total).toFixed(1)
    : '0';
  const avgSleep = total
    ? (responses.reduce((sum, r) => sum + (r.q23_horas_sueno_noche_previa || 0), 0) / total).toFixed(1)
    : '0';
  const avgPeers = total
    ? Math.round(
        responses.reduce((sum, r) => sum + (r.q28_porcentaje_companeros || 0), 0) / total
      )
    : 0;

  // Reasons ranking (Q9 to Q19)
  const reasonsData = [
    {
      code: 'Q9',
      label: 'Preocupación por mala calificación',
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
      label: 'Dificultad para priorizar materia',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q14_dificultad_priorizar || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q15',
      label: 'Compañeros tampoco empezaron',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q15_companeros_no_estudian || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q16',
      label: 'Presión de amigos / recreación',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q16_presion_amigos || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q17',
      label: 'Rechazo a plazos y fechas límite',
      avg: total
        ? (responses.reduce((s, r) => s + (r.q17_rechazo_plazos || 0), 0) / total).toFixed(2)
        : '0',
    },
    {
      code: 'Q18',
      label: 'Dudas no consultadas con el docente',
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Panel de Respuestas
              </span>
              <span className="text-xs text-slate-500">
                {total} {total === 1 ? 'registro' : 'registros'} capturados
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Resultados y Métricas de la Encuesta
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {sheetConfig && (
              <>
                <button
                  type="button"
                  onClick={onSyncAllToSheets}
                  disabled={isSyncing || total === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
            )}

            <button
              type="button"
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              disabled={total === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
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
                title="Limpiar base local"
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Respuestas
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{total}</div>
          <span className="text-[10px] text-slate-400">Estudiantes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Demora Exámenes (Q4)
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {avgQ4} <span className="text-xs font-normal text-slate-400">/ 5</span>
          </div>
          <span className="text-[10px] text-slate-400">Escala de 1 a 5</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Demora Tareas (Q7)
            </span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {avgQ7} <span className="text-xs font-normal text-slate-400">/ 5</span>
          </div>
          <span className="text-[10px] text-slate-400">Escala de 1 a 5</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sueño Pre-Examen (Q23)
            </span>
            <Moon className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {avgSleep} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400">
            % Compañeros al límite: {avgPeers}%
          </span>
        </div>
      </div>

      {/* Motivos Ranking */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Ranking de Motivos de Procrastinación (Q9 a Q19)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Puntuación promedio de cada factor según los estudiantes (escala de 1 a 5)
        </p>

        {total === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Aún no hay respuestas registradas para calcular estadísticas.
          </div>
        ) : (
          <div className="space-y-2.5">
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
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por carrera o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            <strong>{filteredResponses.length}</strong> de {total} respuestas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Q1 Carrera / Ciclo</th>
                <th className="px-3 py-3 text-center">Q2 Reprobadas</th>
                <th className="px-3 py-3 text-center">Q3 Ciclo Max</th>
                <th className="px-3 py-3 text-center">Q4 Exámenes</th>
                <th className="px-3 py-3 text-center">Q7 Tareas</th>
                <th className="px-3 py-3 text-center">Q20 Días</th>
                <th className="px-3 py-3 text-center">Q23 Sueño</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-xs">
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
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q2_materias_perdidas}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q3_ciclo_mas_alto}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          r.q4_demora_examenes >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : r.q4_demora_examenes === 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.q4_demora_examenes}/5
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          r.q7_demora_tareas >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : r.q7_demora_tareas === 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.q7_demora_tareas}/5
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q20_dias_antes_estudio}d
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {r.q23_horas_sueno_noche_previa}h
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedResponse(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Detalle de la Respuesta
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedResponse.id} • {selectedResponse.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-sm">Perfil Académico</div>
                <div><strong>Q1 Carrera y ciclo:</strong> {selectedResponse.q1_carrera_ciclo}</div>
                <div><strong>Q2 Materias perdidas:</strong> {selectedResponse.q2_materias_perdidas}</div>
                <div><strong>Q3 Ciclo más alto:</strong> {selectedResponse.q3_ciclo_mas_alto}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-sm">Demora e Impacto (1 a 5)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Q4 Demora exámenes: <strong>{selectedResponse.q4_demora_examenes}/5</strong></div>
                  <div>Q5 Problema exámenes: <strong>{selectedResponse.q5_problema_examenes}/5</strong></div>
                  <div>Q6 Reducir exámenes: <strong>{selectedResponse.q6_reducir_examenes}/5</strong></div>
                  <div>Q7 Demora tareas: <strong>{selectedResponse.q7_demora_tareas}/5</strong></div>
                  <div>Q8 Reducir tareas: <strong>{selectedResponse.q8_reducir_tareas}/5</strong></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-sm">Motivos de Procrastinación (1 a 5)</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>Q9 Miedo mala nota: <strong>{selectedResponse.q9_miedo_calificacion}/5</strong></div>
                  <div>Q10 Falta confianza: <strong>{selectedResponse.q10_falta_confianza}/5</strong></div>
                  <div>Q11 Desbordado: <strong>{selectedResponse.q11_desbordado_materia}/5</strong></div>
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

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-sm">Hábitos Reales</div>
                <div><strong>Q20 Días antes inicio:</strong> {selectedResponse.q20_dias_antes_estudio} días</div>
                <div><strong>Q23 Horas de sueño:</strong> {selectedResponse.q23_horas_sueno_noche_previa} hrs</div>
                <div><strong>Q25 Método repaso:</strong> {selectedResponse.q25_metodo_repaso} {selectedResponse.q25_metodo_repaso_otro ? `(${selectedResponse.q25_metodo_repaso_otro})` : ''}</div>
                <div><strong>Q28 % Compañeros últimos 3 días:</strong> {selectedResponse.q28_porcentaje_companeros}%</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              ¿Eliminar las respuestas locales?
            </h3>
            <p className="text-xs text-slate-600 mt-1.5">
              Esta acción borrará las respuestas guardadas en el navegador. Si ya están sincronizadas a Google Sheets, tus datos seguirán en tu hoja de cálculo.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllResponses();
                  setShowDeleteConfirm(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
