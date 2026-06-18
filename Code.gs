/**
 * ESCUELA SEGURA - Backend Google Apps Script
 * API Web pública para alertas escolares de costo cero
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN — Reemplazar con el ID real del Google Sheet
// (visible en la URL: /d/ESTE_ID/edit)
// ═══════════════════════════════════════════════════════════════
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';

const HOJAS = {
  ESTADO: 'Estado_Global',
  ALERTAS: 'Alertas_Historicas',
  USUARIOS: 'Tabla_Usuarios',
  CONTACTOS: 'Contactos_Emergencia',
  APODERADOS: 'Base_Apoderados'
};

const MODOS_VALIDOS = ['PREVENCION', 'EVACUACION', 'CONFINAMIENTO'];

/**
 * Abre el libro de cálculo configurado
 */
function obtenerLibro() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Genera respuesta JSON uniforme para la API
 */
function respuestaJSON(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Lee el modo actual desde Estado_Global!B2
 */
function obtenerEstadoGlobal() {
  const hoja = obtenerLibro().getSheetByName(HOJAS.ESTADO);
  const modo = String(hoja.getRange('B2').getValue()).trim().toUpperCase();
  return {
    ok: true,
    modo: MODOS_VALIDOS.indexOf(modo) >= 0 ? modo : 'PREVENCION',
    timestamp: new Date().toISOString()
  };
}

/**
 * Actualiza el modo en Estado_Global!B2
 */
function cambiarModo(nuevoModo) {
  const modo = String(nuevoModo || '').trim().toUpperCase();
  if (MODOS_VALIDOS.indexOf(modo) < 0) {
    return { ok: false, error: 'Modo inválido. Use: PREVENCION, EVACUACION o CONFINAMIENTO' };
  }
  const hoja = obtenerLibro().getSheetByName(HOJAS.ESTADO);
  hoja.getRange('B2').setValue(modo);
  return { ok: true, modo: modo, mensaje: 'Modo actualizado correctamente' };
}

/**
 * Inserta registro de auditoría en Alertas_Historicas
 */
function registrarAlerta(datos) {
  const hoja = obtenerLibro().getSheetByName(HOJAS.ALERTAS);
  const id = 'REG-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000);
  const fila = [
    id,
    datos.profesor || 'Sin identificar',
    datos.zona || 'Sin zona',
    datos.tipo_alerta || 'GENERAL',
    datos.detalle || '',
    datos.tiempo_seg !== undefined && datos.tiempo_seg !== '' ? datos.tiempo_seg : '',
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')
  ];
  hoja.appendRow(fila);
  return { ok: true, id_registro: id, mensaje: 'Alerta registrada' };
}

/**
 * Enrutador central de acciones de la API
 */
function procesarAccion(accion, params) {
  params = params || {};
  switch (accion) {
    case 'cambiar_modo':
      return cambiarModo(params.modo);
    case 'registrar_alerta':
      return registrarAlerta({
        profesor: params.profesor,
        zona: params.zona,
        tipo_alerta: params.tipo_alerta,
        detalle: params.detalle,
        tiempo_seg: params.tiempo_seg
      });
    case 'get_estado':
    default:
      return obtenerEstadoGlobal();
  }
}

/**
 * Extrae parámetros desde POST JSON o form-urlencoded
 */
function parsearPost(e) {
  if (!e || !e.postData) return {};
  const tipo = e.postData.type || '';
  const contenido = e.postData.contents || '';
  if (tipo.indexOf('application/json') >= 0) {
    try {
      return JSON.parse(contenido);
    } catch (err) {
      return {};
    }
  }
  const resultado = {};
  contenido.split('&').forEach(function(par) {
    const partes = par.split('=');
    if (partes.length >= 2) {
      resultado[decodeURIComponent(partes[0])] = decodeURIComponent(partes.slice(1).join('='));
    }
  });
  return resultado;
}

/**
 * GET: Estado actual + acciones vía query (compatible CORS externo)
 * ?action=get_estado
 * ?action=cambiar_modo&modo=EVACUACION
 * ?action=registrar_alerta&profesor=...&zona=...&tipo_alerta=...&detalle=...
 */
function doGet(e) {
  e = e || {};
  const p = e.parameter || {};
  const accion = p.action || 'get_estado';
  const params = {
    modo: p.modo,
    profesor: p.profesor,
    zona: p.zona,
    tipo_alerta: p.tipo_alerta,
    detalle: p.detalle,
    tiempo_seg: p.tiempo_seg !== undefined && p.tiempo_seg !== '' ? Number(p.tiempo_seg) : undefined
  };
  try {
    return respuestaJSON(procesarAccion(accion, params));
  } catch (error) {
    return respuestaJSON({ ok: false, error: String(error.message || error) });
  }
}

/**
 * POST: Procesa cambiar_modo y registrar_alerta (JSON body)
 * Body: { "action": "cambiar_modo", "modo": "EVACUACION" }
 * Body: { "action": "registrar_alerta", "profesor": "...", ... }
 */
function doPost(e) {
  try {
    const datos = parsearPost(e);
    const accion = datos.action;
    if (!accion) {
      return respuestaJSON({ ok: false, error: 'Falta campo action' });
    }
    return respuestaJSON(procesarAccion(accion, datos));
  } catch (error) {
    return respuestaJSON({ ok: false, error: String(error.message || error) });
  }
}
