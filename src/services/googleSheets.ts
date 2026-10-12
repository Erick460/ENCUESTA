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

export const extractSpreadsheetId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const match =
    trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
    trimmed.match(/id=([a-zA-Z0-9-_]+)/) ||
    trimmed.match(/([a-zA-Z0-9-_]{20,})/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

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
    res.q2_materias_perdidas ?? 0,
    res.q3_ciclo_mas_alto ?? 1,
    res.q4_demora_examenes ?? '',
    res.q5_problema_examenes ?? '',
    res.q6_reducir_examenes ?? '',
    res.q7_demora_tareas ?? '',
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
    res.q23_horas_sueno_noche_previa ?? 0,
    res.q25_metodo_repaso || '',
    res.q25_metodo_repaso_otro || '',
    res.q28_porcentaje_companeros ?? 0,
    avgReasons,
  ];
};

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive
 */
export const createSurveySpreadsheet = async (
  accessToken: string,
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const title =
    customTitle ||
    `Respuestas - Encuesta Procrastinación (${new Date().toLocaleDateString('es-ES')})`;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Respuestas',
            gridProperties: { frozenRowCount: 1 },
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

  // Append formatted Headers
  await fetch(
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
  ).catch(() => {});

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

  // 1. Try appending to 'Respuestas' sheet
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respuestas!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  // 2. If 'Respuestas' tab doesn't exist, append to active first sheet
  if (!res.ok) {
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Error al registrar en Google Sheets (${res.status} ${res.statusText})`
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
      body: JSON.stringify({ values: rows }),
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
        body: JSON.stringify({ values: rows }),
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
 * Optional Webhook integration (Google Apps Script Web App)
 * 100% reliable, no OAuth popups or permissions required.
 */
export const sendToWebhook = async (
  webhookUrl: string,
  response: SurveyResponse
): Promise<boolean> => {
  try {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) return false;

    // Use text/plain with no-cors to bypass browser CORS preflight restrictions
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(response),
    });
    return true;
  } catch (err) {
    console.warn('Webhook dispatch error:', err);
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

export const sampleAppsScriptCode = `// ====================================================================
// SCRIPT DE CONEXIÓN A GOOGLE SHEETS
// 1. En tu hoja de Google Sheets, ve a: Extensiones > Apps Script
// 2. Borra todo y pega este código exactamente como está.
// 3. Haz clic en "Guardar" (ícono de disco) y luego en "Implementar" > "Nueva implementación"
// 4. Selecciona: Tipo: "Aplicación web"
//    - Descripción: "Encuesta Procrastinación"
//    - Ejecutar como: "Yo" (tu cuenta)
//    - Quién tiene acceso: "Cualquiera" (Anyone)
// 5. Haz clic en "Implementar", autoriza los permisos y copia la URL resultante.
// ====================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas");
    
    // Si no existe la pestaña "Respuestas", la creamos automáticamente
    if (!sheet) {
      sheet = ss.insertSheet("Respuestas");
    }
    
    // Si la hoja está vacía, insertamos los encabezados de las 23 preguntas
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Marca Temporal", "Q1 Carrera", "Q2 Materias Perdidas",
        "Q3 Ciclo Más Alto", "Q4 Demora Exámenes", "Q5 Problema Exámenes",
        "Q6 Reducir Exámenes", "Q7 Demora Tareas", "Q8 Reducir Tareas",
        "Q9 Miedo Mala Calificación", "Q10 Falta Confianza", "Q11 Desbordado Materia",
        "Q12 Otras Obligaciones", "Q13 No Gusta Estudiar", "Q14 Dificultad Priorizar",
        "Q15 Compañeros No Empezaron", "Q16 Presión Amigos", "Q17 Rechazo Plazos",
        "Q18 Dudas Docente", "Q19 Exceso Confianza",
        "Q20 Días Antes Estudio", "Q23 Horas Sueño Previa", "Q25 Método Repaso",
        "Q25 Detalle Otro", "Q28 % Compañeros", "Promedio Motivos"
      ]);
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Calcular promedio de motivos (Q9 a Q19)
    var motivos = [
      data.q9_miedo_calificacion, data.q10_falta_confianza, data.q11_desbordado_materia,
      data.q12_otras_cosas, data.q13_no_gusta_estudiar, data.q14_dificultad_priorizar,
      data.q15_companeros_no_estudian, data.q16_presion_amigos, data.q17_rechazo_plazos,
      data.q18_dudas_no_pregunta, data.q19_exceso_confianza
    ];
    var suma = 0, cuenta = 0;
    for (var i = 0; i < motivos.length; i++) {
      if (motivos[i]) { suma += Number(motivos[i]); cuenta++; }
    }
    var avgMotivos = cuenta > 0 ? (suma / cuenta).toFixed(2) : 0;
    
    sheet.appendRow([
      data.id || ("RESP-" + new Date().getTime()),
      data.timestamp || new Date().toLocaleString(),
      data.q1_carrera_ciclo || data.q1_carrera || "",
      data.q2_materias_perdidas || 0,
      data.q3_ciclo_mas_alto || 1,
      data.q4_demora_examenes || "",
      data.q5_problema_examenes || "",
      data.q6_reducir_examenes || "",
      data.q7_demora_tareas || "",
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
      data.q23_horas_sueno_noche_previa || 0,
      data.q25_metodo_repaso || "",
      data.q25_metodo_repaso_otro || "",
      data.q28_porcentaje_companeros || 0,
      avgMotivos
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook de Encuesta Procrastinación activo y funcionando correctamente.");
}
`;

