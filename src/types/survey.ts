export interface SurveyResponse {
  id: string;
  timestamp: string;
  // Q1 - Q3: Perfil Académico
  q1_carrera_ciclo: string;
  q2_materias_perdidas: number;
  q3_ciclo_mas_alto: number;
  // Q4 - Q8: Demora e Impacto
  q4_demora_examenes: number;
  q5_problema_examenes: number;
  q6_reducir_examenes: number;
  q7_demora_tareas: number;
  q8_reducir_tareas: number;
  // Q9 - Q19: Motivos (1 a 5)
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
  // Q20, Q23, Q25, Q28: Hábitos reales
  q20_dias_antes_estudio: number;
  q23_horas_sueno_noche_previa: number;
  q25_metodo_repaso: string; // 'Releer apuntes' | 'Resolver ejercicios o autoevaluarme' | 'Estudiar en grupo' | 'Otro'
  q25_metodo_repaso_otro?: string;
  q28_porcentaje_companeros: number;
  // Metadata
  promedio_motivos?: number;
  syncedToGoogleSheets?: boolean;
}

export interface QuestionDefinition {
  id: string;
  number: number;
  code: string; // e.g. "Q1", "Q23", "Q25"
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
  questions: string[]; // question codes e.g. ["Q1", "Q2", "Q3"]
}
