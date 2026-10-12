import { SurveyResponse } from '../types/survey';
import { CSV_HEADERS } from '../data/surveyQuestions';

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string;
  webhookUrl?: string;
  autoSync: boolean;
}

export const STORAGE_SHEET_CONFIG_KEY = 'survey_sheets_config_v1';
export const STORAGE_RESPONSES_KEY = 'survey_local_responses_v1';

export const getStoredSheetConfig = (): SheetConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredSheetConfig = (config: SheetConfig | null) => {
  if (!config) {
    localStorage.removeItem(STORAGE_SHEET_CONFIG_KEY);
  } else {
    localStorage.setItem(STORAGE_SHEET_CONFIG_KEY, JSON.stringify(config));
  }
};

export const getStoredResponses = (): SurveyResponse[] => {
  try {
    const raw = localStorage.getItem(STORAGE_RESPONSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredResponses = (responses: SurveyResponse[]) => {
  localStorage.setItem(STORAGE_RESPONSES_KEY, JSON.stringify(responses));
};

export const addStoredResponse = (newResponse: SurveyResponse): SurveyResponse[] => {
  const current = getStoredResponses();
  const updated = [newResponse, ...current];
  saveStoredResponses(updated);
  return updated;
};

export const responseToRowValues = (res: SurveyResponse): (string | number)[] => {
  // Calculate average reasons score
  const reasons = [
    res.q9_miedo_calificacion,
    res.q10_falta_confianza,
    res.q11_desbordado_materia,
    res.q12_otras_cosas,
    res.q13_no_gusta_estudiar,
    res.q14_dificultad_priorizar,
    res.q15_companeros_no_estudian,
    res.q16_presion_amigos,
    res.q17_rechazo_plazos,
    res.q18_dudas_no_pregunta,
    res.q19_exceso_confianza,
  ];
  const avgReasons = +(
    reasons.reduce((acc, curr) => acc + (curr || 0), 0) / reasons.length
  ).toFixed(2);

  return [
    res.id,
    res.timestamp,
    res.q1_carrera_ciclo || '',
    res.q2_asignatura_fecha || '',
    res.q3_demora_examenes ?? '',
    res.q4_problema_examenes ?? '',
    res.q5_reducir_examenes ?? '',
    res.q6_demora_tareas ?? '',
    res.q7_problema_tareas ?? '',
    res.q8_reducir_tareas ?? '',
    res.q9_miedo_calificacion ?? '',
    res.q10_falta_confianza ?? '',
    res.q11_desbordado_materia ?? '',
    res.q12_otras_cosas ?? '',
    res.q13_no_gusta_estudiar ?? '',
    res.q14_dificultad_priorizar ?? '',
    res.q15_companeros_no_estudian ?? '',
    res.q16_presion_amigos ?? '',
    res.q17_rechazo_plazos ?? '',
    res.q18_dudas_no_pregunta ?? '',
    res.q19_exceso_confianza ?? '',
    res.q20_dias_antes_estudio ?? 0,
    res.q21_horas_ultimos_3_dias ?? 0,
    res.q22_horas_11_dias_previos ?? 0,
    res.q23_horas_sueno_noche_previa ?? 0,
    res.q24_horario_calendario || '',
    res.q25_metodo_repaso || '',
    res.q25_metodo_repaso_otro || '',
    res.q26_anticipacion_entrega || '',
    res.q27_consulta_docente || '',
    res.q28_porcentaje_companeros ?? 0,
    avgReasons,
  ];
};

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive
 * with a preformatted header row for all 28 survey fields.
 */
export const createSurveySpreadsheet = async (
  accessToken: string,
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const title =
    customTitle ||
    `Respuestas - Encuesta Procrastinación (${new Date().toLocaleDateString('es-ES')})`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Respuestas',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Error al crear la hoja de cálculo (${createRes.status} ${createRes.statusText})`
    );
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl =
    sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Add formatted Headers
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respuestas!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [CSV_HEADERS],
      }),
    }
  );

  if (!headerRes.ok) {
    console.warn('Headers append notice:', await headerRes.text());
  }

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Appends a single survey response to Google Sheets
 */
export const appendResponseToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  response: SurveyResponse
): Promise<boolean> => {
  const row = responseToRowValues(response);

  // Attempt to append to "Respuestas" tab; if it fails, try root sheet
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respuestas!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!res.ok) {
    // Fallback without sheet name in case default is "Hoja 1" or "Sheet1"
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Error al enviar datos a Google Sheets (${res.status} ${res.statusText})`
    );
  }

  return true;
};

/**
 * Appends multiple survey responses in batch to Google Sheets
 */
export const appendBatchToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  responses: SurveyResponse[]
): Promise<number> => {
  if (responses.length === 0) return 0;
  const rows = responses.map(responseToRowValues);

  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respuestas!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Error al exportar lote a Google Sheets (${res.status} ${res.statusText})`
    );
  }

  return responses.length;
};

/**
 * Optional Webhook integration (Google Apps Script)
 * Useful for public distribution when survey respondents submit anonymously
 */
export const sendToWebhook = async (
  webhookUrl: string,
  response: SurveyResponse
): Promise<boolean> => {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard for Apps Script redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });
    return true;
  } catch (err) {
    console.warn('Webhook error:', err);
    return false;
  }
};

/**
 * Export responses as CSV file with UTF-8 BOM
 */
export const downloadResponsesAsCsv = (responses: SurveyResponse[]) => {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = responses.map((r) => responseToRowValues(r).map(escapeCell).join(','));
  const headerLine = CSV_HEADERS.map(escapeCell).join(',');
  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Encuesta_Procrastinacion_Respuestas_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export responses as JSON
 */
export const downloadResponsesAsJson = (responses: SurveyResponse[]) => {
  const jsonContent = JSON.stringify(responses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Encuesta_Procrastinacion_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const sampleAppsScriptCode = `// Código para Google Apps Script (Extensiones > Apps Script en tu Hoja de Cálculo)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la hoja está vacía, agregar encabezados
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Marca Temporal", "Q1 Carrera y Ciclo", "Q2 Asignatura y Fecha",
        "Q3 Demora Exámenes", "Q4 Problema Exámenes", "Q5 Reducir Exámenes",
        "Q6 Demora Tareas", "Q7 Problema Tareas", "Q8 Reducir Tareas",
        "Q9 Miedo Mala Calificación", "Q10 Falta Confianza", "Q11 Desbordado",
        "Q12 Otras Cosas", "Q13 No Gusta Estudiar", "Q14 Dificultad Priorizar",
        "Q15 Compañeros No Estudian", "Q16 Presión Amigos", "Q17 Rechazo Plazos",
        "Q18 Dudas No Pregunta", "Q19 Exceso Confianza",
        "Q20 Días Antes Estudio", "Q21 Horas Últimos 3 Días", "Q22 Horas 11 Días Previos",
        "Q23 Horas Sueño Previa", "Q24 Horario Calendario", "Q25 Método Repaso",
        "Q25 Otro", "Q26 Anticipación Entrega", "Q27 Consulta Docente", "Q28 % Compañeros"
      ]);
    }
    
    sheet.appendRow([
      data.id || new Date().getTime(),
      data.timestamp || new Date().toLocaleString(),
      data.q1_carrera_ciclo || "",
      data.q2_asignatura_fecha || "",
      data.q3_demora_examenes || "",
      data.q4_problema_examenes || "",
      data.q5_reducir_examenes || "",
      data.q6_demora_tareas || "",
      data.q7_problema_tareas || "",
      data.q8_reducir_tareas || "",
      data.q9_miedo_calificacion || "",
      data.q10_falta_confianza || "",
      data.q11_desbordado_materia || "",
      data.q12_otras_cosas || "",
      data.q13_no_gusta_estudiar || "",
      data.q14_dificultad_priorizar || "",
      data.q15_companeros_no_estudian || "",
      data.q16_presion_amigos || "",
      data.q17_rechazo_plazos || "",
      data.q18_dudas_no_pregunta || "",
      data.q19_exceso_confianza || "",
      data.q20_dias_antes_estudio || 0,
      data.q21_horas_ultimos_3_dias || 0,
      data.q22_horas_11_dias_previos || 0,
      data.q23_horas_sueno_noche_previa || 0,
      data.q24_horario_calendario || "",
      data.q25_metodo_repaso || "",
      data.q25_metodo_repaso_otro || "",
      data.q26_anticipacion_entrega || "",
      data.q27_consulta_docente || "",
      data.q28_porcentaje_companeros || 0
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
