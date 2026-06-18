# Escuela Segura

Sistema de alerta escolar temprana de **costo cero** (HTML + Google Sheets + Apps Script).  
Diseñado para móviles (PWA / WebView), con polling cada 4 segundos y activación anti-falsas-alarmas mediante **Slide to Trigger**.

## Estructura del proyecto

```
escuela-segura/
├── Code.gs                  # Backend Google Apps Script
├── config.js                # URL de la API (editar tras desplegar)
├── index.html               # App docentes
├── apoderados.html          # App familias (solo lectura)
├── manifest-docentes.json   # PWA docentes
├── manifest-apoderados.json # PWA apoderados
├── sw.js                    # Service Worker (caché offline básica)
├── icons/icon.svg           # Icono PWA
└── README.md
```

---

## Paso 1: Crear Google Sheets

Crea un libro llamado **Escuela_Segura** con **5 pestañas** y estos encabezados en la **Fila 1**:

### `Estado_Global`
| A1 | B1 |
|----|-----|
| Clave | Valor |

Fila 2: `Modo` | `PREVENCION`

### `Alertas_Historicas`
`ID_Registro` | `Profesor` | `Zona` | `Tipo_Alerta` | `Detalle` | `Tiempo_Seg` | `Fecha_Hora`

### `Tabla_Usuarios`
`ID_Usuario` | `Nombre` | `Zona` | `Telefono`

### `Contactos_Emergencia`
`Entidad` | `Telefono` | `Tipo_Contacto`

### `Base_Apoderados`
`Nombre_Apoderado` | `Alumno` | `Curso` | `Telefono`

Copia el **ID del libro** desde la URL:  
`https://docs.google.com/spreadsheets/d/ESTE_ID/edit`

---

## Paso 2: Desplegar Apps Script

1. En el libro: **Extensiones → Apps Script**
2. Borra el contenido por defecto y pega el archivo `Code.gs`
3. Reemplaza `TU_SPREADSHEET_ID_AQUI` por tu ID real
4. **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquiera**
5. Copia la URL que termina en `/exec`

---

## Paso 3: Configurar el frontend

Edita `config.js` y reemplaza la URL:

```javascript
const ESCUELA_SEGURA_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec',
  POLL_INTERVAL_MS: 4000
};
```

---

## Paso 4: Publicar el frontend (gratis)

### Opción A — GitHub Pages
1. Sube esta carpeta a un repositorio GitHub
2. **Settings → Pages → Source: main / root**
3. Accede a `https://tu-usuario.github.io/escuela-segura/index.html`

### Opción B — Servidor local (pruebas)
```powershell
cd C:\Users\tesoreria\Projects\escuela-segura
python -m http.server 8080
```
Abre `http://localhost:8080/index.html`

> **Importante:** El frontend debe servirse por **HTTPS** (GitHub Pages, Netlify, etc.) para PWA y Service Worker.

---

## Paso 5: Instalar como PWA

| Dispositivo | Acción |
|-------------|--------|
| **iPhone** | Safari → Compartir → *Agregar a pantalla de inicio* |
| **Android** | Chrome → Menú → *Instalar aplicación* / *Agregar a inicio* |
| **WebView (Android Studio)** | Cargar URL HTTPS; habilitar `JavaScriptEnabled` y `DomStorageEnabled` |

Instala **dos accesos directos**: uno con `index.html` (docentes) y otro con `apoderados.html` (familias).

---

## Flujo operativo

1. **Prevención** — Docentes ven deslizadores; apoderados ven pantalla verde.
2. **Activar alerta** — Deslizar control al **95%** del carril (evacuación o lockdown).
3. **Propagación** — En ≤4 s todos los dispositivos cambian de pantalla vía polling.
4. **Reportes** — Durante emergencia: botones OK / Alerta + envío a `Alertas_Historicas`.
5. **Desactivación** — Botón discreto inferior (solo personal autorizado) → vuelve a `PREVENCION`.

---

## Checklist de prueba

- [ ] `Estado_Global!B2` = `PREVENCION` al inicio
- [ ] Login docente guarda nombre/zona en `localStorage`
- [ ] Deslizador evacuación → pantalla roja + cronómetro en todos
- [ ] Deslizador lockdown → pantalla azul/violeta en todos
- [ ] Reporte OK/Alerta aparece en `Alertas_Historicas`
- [ ] Fiscalización guarda fila con `Tipo_Alerta = FISCALIZACION`
- [ ] Desactivación maestra restaura prevención en todos
- [ ] Apoderados: sonido de alerta en evacuación/confinamiento

---

## Notas de seguridad

- La URL de Apps Script es **pública**; no la compartas fuera del personal autorizado.
- La app de apoderados es **solo lectura** (no puede activar alertas).
- El polling de 4 s implica latencia máxima ~4 s (trade-off costo cero).
- Si POST falla por CORS desde el navegador, el frontend usa **GET automáticamente** como respaldo.

---

## Licencia

Uso libre para establecimientos educacionales.
