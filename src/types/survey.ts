export interface SurveyResponse {
  id: string;
  timestamp: string; // ISO string & formatted local date
  // Q1 - Q2
  q1_carrera_ciclo: string;
  q2_asignatura_fecha: string;
  // Q3 - Q8 (1 to 5)
  q3_demora_examenes: number;
  q4_problema_examenes: number;
  q5_reducir_examenes: number;
  q6_demora_tareas: number;
  q7_problema_tareas: number;
  q8_reducir_tareas: number;
  // Q9 - Q19 (1 to 5)
  q9_miedo_calificacion: number;
  q10_falta_confianza: number;
  q11_desbordado_materia: number;
  q12_otras_cosas: number;
  q13_no_gusta_estudiar: number;
  q14_dificultad_priorizar: number;
  q15_companeros_no_estudian: number;
  q16_presion_amigos: number;
  q17_rechazo_plazos: number;
  q18_dudas_no_pregunta: number;
  q19_exceso_confianza: number;
  // Q20 - Q28
  q20_dias_antes_estudio: number;
  q21_horas_ultimos_3_dias: number;
  q22_horas_11_dias_previos: number;
  q23_horas_sueno_noche_previa: number;
  q24_horario_calendario: string; // 'Sí' | 'No' | 'A veces'
  q25_metodo_repaso: string; // 'Releer apuntes' | 'Resolver ejercicios o autoevaluarme' | 'Otro'
  q25_metodo_repaso_otro?: string;
  q26_anticipacion_entrega: string;
  q27_consulta_docente: string;
  q28_porcentaje_companeros: number; // 0 to 100
  // Derived analytical metrics
  indice_procrastinacion_examenes?: number; // Q3
  indice_procrastinacion_tareas?: number; // Q6
  promedio_motivos?: number;
  syncedToGoogleSheets?: boolean;
}

export interface QuestionDefinition {
  id: string;
  number: number;
  title: string;
  description?: string;
  section: number;
  type: 'text' | 'scale' | 'number' | 'radio' | 'slider';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  scaleLabels?: { min: string; mid?: string; max: string };
  placeholder?: string;
  required?: boolean;
}

export interface SurveySection {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  questions: number[]; // question numbers
}
