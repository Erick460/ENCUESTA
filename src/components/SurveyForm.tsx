import React, { useState } from 'react';
import { SURVEY_QUESTIONS, SURVEY_SECTIONS } from '../data/surveyQuestions';
import { SurveyResponse, QuestionDefinition } from '../types/survey';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface SurveyFormProps {
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => Promise<void>;
  isSubmitting: boolean;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>({
    // Q1 - Q3
    q1_carrera_ciclo: '',
    q2_materias_perdidas: 0,
    q3_ciclo_mas_alto: 1,
    // Q4 - Q8
    q4_demora_examenes: undefined,
    q5_problema_examenes: undefined,
    q6_reducir_examenes: undefined,
    q7_demora_tareas: undefined,
    q8_reducir_tareas: undefined,
    // Q9 - Q19
    q9_miedo_calificacion: undefined,
    q10_falta_confianza: undefined,
    q11_desbordado_materia: undefined,
    q12_otras_cosas: undefined,
    q13_no_gusta_estudiar: undefined,
    q14_dificultad_priorizar: undefined,
    q15_companeros_no_estudian: undefined,
    q16_presion_amigos: undefined,
    q17_rechazo_plazos: undefined,
    q18_dudas_no_pregunta: undefined,
    q19_exceso_confianza: undefined,
    // Q20, Q23, Q25, Q28
    q20_dias_antes_estudio: 3,
    q23_horas_sueno_noche_previa: 6,
    q25_metodo_repaso: '',
    q25_metodo_repaso_otro: '',
    q28_porcentaje_companeros: 60,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function getKeyForQuestion(code: string): string {
    switch (code) {
      case 'Q1':
        return 'q1_carrera_ciclo';
      case 'Q2':
        return 'q2_materias_perdidas';
      case 'Q3':
        return 'q3_ciclo_mas_alto';
      case 'Q4':
        return 'q4_demora_examenes';
      case 'Q5':
        return 'q5_problema_examenes';
      case 'Q6':
        return 'q6_reducir_examenes';
      case 'Q7':
        return 'q7_demora_tareas';
      case 'Q8':
        return 'q8_reducir_tareas';
      case 'Q9':
        return 'q9_miedo_calificacion';
      case 'Q10':
        return 'q10_falta_confianza';
      case 'Q11':
        return 'q11_desbordado_materia';
      case 'Q12':
        return 'q12_otras_cosas';
      case 'Q13':
        return 'q13_no_gusta_estudiar';
      case 'Q14':
        return 'q14_dificultad_priorizar';
      case 'Q15':
        return 'q15_companeros_no_estudian';
      case 'Q16':
        return 'q16_presion_amigos';
      case 'Q17':
        return 'q17_rechazo_plazos';
      case 'Q18':
        return 'q18_dudas_no_pregunta';
      case 'Q19':
        return 'q19_exceso_confianza';
      case 'Q20':
        return 'q20_dias_antes_estudio';
      case 'Q23':
        return 'q23_horas_sueno_noche_previa';
      case 'Q25':
        return 'q25_metodo_repaso';
      case 'Q28':
        return 'q28_porcentaje_companeros';
      default:
        return code.toLowerCase();
    }
  }

  // Calculate progress
  const answeredCount = SURVEY_QUESTIONS.reduce((acc, q) => {
    const key = getKeyForQuestion(q.code);
    const val = formData[key];
    if (val !== undefined && val !== '' && val !== null) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const progressPercent = Math.round((answeredCount / SURVEY_QUESTIONS.length) * 100);

  const handleValueChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateSection = (secId: number): boolean => {
    const sec = SURVEY_SECTIONS.find((s) => s.id === secId);
    if (!sec) return true;

    const errors: Record<string, string> = {};
    for (const qCode of sec.questions) {
      const q = SURVEY_QUESTIONS.find((item) => item.code === qCode);
      if (!q || !q.required) continue;
      const key = getKeyForQuestion(qCode);
      const val = formData[key];

      if (val === undefined || val === null || val === '') {
        errors[key] = 'Esta pregunta es requerida';
      }
    }

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleNextSection = () => {
    if (validateSection(currentSection)) {
      if (currentSection < SURVEY_SECTIONS.length) {
        setCurrentSection((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 1) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    let firstIncompleteSection = 0;

    for (const sec of SURVEY_SECTIONS) {
      for (const qCode of sec.questions) {
        const q = SURVEY_QUESTIONS.find((item) => item.code === qCode);
        if (!q || !q.required) continue;
        const key = getKeyForQuestion(qCode);
        const val = formData[key];
        if (val === undefined || val === null || val === '') {
          errors[key] = 'Pregunta obligatoria';
          if (!firstIncompleteSection) firstIncompleteSection = sec.id;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      if (firstIncompleteSection && firstIncompleteSection !== currentSection) {
        setCurrentSection(firstIncompleteSection);
      }
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    await onSubmit(formData as any);
  };

  const currentSectionData = SURVEY_SECTIONS.find((s) => s.id === currentSection)!;
  const currentQuestions = SURVEY_QUESTIONS.filter(
    (q) => q.section === currentSection
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner Card: Clean and Academic */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-7 mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {currentSectionData.badge}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {answeredCount} de {SURVEY_QUESTIONS.length} preguntas respondidas
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentSectionData.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {currentSectionData.subtitle}
            </p>
          </div>

          <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
            <div className="text-2xl font-black text-emerald-600">
              {progressPercent}%
            </div>
            <span className="text-[11px] text-slate-400">Progreso</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100">
          {SURVEY_SECTIONS.map((sec) => {
            const isCompleted = sec.questions.every((qCode) => {
              const k = getKeyForQuestion(qCode);
              return formData[k] !== undefined && formData[k] !== '';
            });
            const isCurrent = sec.id === currentSection;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (validateSection(currentSection) || sec.id < currentSection) {
                    setCurrentSection(sec.id);
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-xs'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-slate-200/60 bg-white text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : sec.id}
                </div>
                <div className="truncate font-medium">{sec.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions List */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {currentQuestions.map((q) => {
          const key = getKeyForQuestion(q.code);
          const value = formData[key];
          const hasError = !!validationErrors[key];

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-6 border transition-all shadow-xs ${
                hasError
                  ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                    {q.code}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {q.title}
                      {q.required && <span className="text-rose-500 ml-1">*</span>}
                    </h3>
                    {q.description && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {q.description}
                      </p>
                    )}
                  </div>
                </div>

                {value !== undefined && value !== '' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>

              {/* INPUT TYPE 1: TEXT (Q1) */}
              {q.type === 'text' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={value || ''}
                    placeholder={q.placeholder}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/40 focus:bg-white"
                  />
                </div>
              )}

              {/* INPUT TYPE 2: SCALE 1 to 5 (Likert: Q4-Q19) */}
              {q.type === 'scale' && (
                <div className="mt-4">
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const isSelected = value === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleValueChange(key, num)}
                          className={`flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs scale-[1.02]'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700 font-medium'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            {num}
                          </span>
                          <span className="text-[10px] text-center text-slate-500 leading-tight hidden sm:block">
                            {num === 1 && (q.scaleLabels?.min.split(':')[1]?.trim() || 'Nunca')}
                            {num === 3 && (q.scaleLabels?.mid?.split(':')[1]?.trim() || 'A veces')}
                            {num === 5 && (q.scaleLabels?.max.split(':')[1]?.trim() || 'Siempre')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {q.scaleLabels && (
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium mt-2 px-1">
                      <span>◀ {q.scaleLabels.min}</span>
                      {q.scaleLabels.mid && (
                        <span className="hidden sm:inline">{q.scaleLabels.mid}</span>
                      )}
                      <span>{q.scaleLabels.max} ▶</span>
                    </div>
                  )}
                </div>
              )}

              {/* INPUT TYPE 3: NUMBER (Q2, Q3, Q20, Q23) */}
              {q.type === 'number' && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50/60 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-emerald-500">
                      <button
                        type="button"
                        onClick={() =>
                          handleValueChange(
                            key,
                            Math.max((q.min ?? 0), (Number(value) || 0) - 1)
                          )
                        }
                        className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 font-bold select-none text-base cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={q.min ?? 0}
                        max={q.max ?? 100}
                        value={value ?? ''}
                        placeholder={q.placeholder}
                        onChange={(e) =>
                          handleValueChange(
                            key,
                            e.target.value === '' ? '' : Math.max((q.min ?? 0), Number(e.target.value))
                          )
                        }
                        className="w-20 text-center py-2 bg-white font-bold text-slate-800 text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleValueChange(
                            key,
                            Math.min((q.max ?? 100), (Number(value) || 0) + 1)
                          )
                        }
                        className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 font-bold select-none text-base cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    {q.unit && (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        {q.unit}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* INPUT TYPE 4: RADIO (Q25) */}
              {q.type === 'radio' && q.options && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = value === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleValueChange(key, opt)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold shadow-xs'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600'
                                : 'border-slate-400 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Q25 "Otro" detail input */}
                  {q.code === 'Q25' && value === 'Otro' && (
                    <div className="mt-3 pt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Especifica qué otro método utilizas:
                      </label>
                      <input
                        type="text"
                        placeholder="Ejemplo: Flashcards de Anki, esquemas visuales, videos explicativos..."
                        value={formData.q25_metodo_repaso_otro || ''}
                        onChange={(e) =>
                          handleValueChange('q25_metodo_repaso_otro', e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* INPUT TYPE 5: SLIDER (Q28) */}
              {q.type === 'slider' && (
                <div className="mt-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Mueve la barra deslizadora:
                    </span>
                    <span className="text-xl font-black text-emerald-600 bg-emerald-100/80 px-3 py-0.5 rounded-lg border border-emerald-300">
                      {value ?? 50}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={q.min ?? 0}
                    max={q.max ?? 100}
                    step={q.step ?? 5}
                    value={value ?? 50}
                    onChange={(e) => handleValueChange(key, Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>0% (Casi ninguno)</span>
                    <span>50% (La mitad)</span>
                    <span>100% (La gran mayoría)</span>
                  </div>
                </div>
              )}

              {/* Validation error */}
              {hasError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors[key]}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Step Navigation Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 mt-7">
          <div>
            {currentSection > 1 ? (
              <button
                type="button"
                onClick={handlePrevSection}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400">Paso 1 de 4</span>
            )}
          </div>

          <div>
            {currentSection < SURVEY_SECTIONS.length ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>Siguiente sección</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando respuesta...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Finalizar y Enviar Encuesta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
