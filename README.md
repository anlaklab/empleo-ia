# Vulnerabilidad de Empleos a la Inteligencia Artificial en Espana

Analisis interactivo de las **502 ocupaciones** del mercado laboral espanol segun su grado de exposicion a la IA. Datos INE/EPA Q4 2025, ponderaciones Censo 2021, puntuaciones calibradas con 5 factores estructurales Espana.

**[Ver demo en vivo](https://empleo-ia.lovable.app)** · **[Metodologia V20 (PDF)](https://doi.org/10.5281/zenodo.19076797)**

---

## Vista previa

| Vista Detalle (treemap por sector) | Vista Grafico (scatter plot) |
|---|---|
| Mapa de calor con ocupaciones agrupadas por sector, coloreadas por nivel de exposicion a la IA | Grafico de dispersion: salario medio vs. exposicion IA, tamano proporcional al empleo |

4 vistas interactivas: **Mapa** (treemap sectorial), **Detalle** (treemap con ocupaciones individuales), **Grafico** (scatter salario vs. exposicion) y **Lista** (tabla ordenable).

---

## Datos

| Archivo | Descripcion |
|---------|-------------|
| `public/data/spain_502_FINAL_v7.json` | Dataset principal: 502 ocupaciones CNO-11 con empleo, salario, score IA, EU AI Act y justificacion |
| `public/data/ocupaciones_vulnerabilidad_ia_espana_100.json` | Subconjunto de 100 ocupaciones para validacion inter-modelo |

### Campos del dataset

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `cno` | int | Codigo CNO-11 a 4 digitos |
| `nombre` | str | Nombre de la ocupacion |
| `sector` | str | Sector economico (12 categorias) |
| `empleo` | int | Numero de empleados (estimacion EPA Q4 2025 + Censo 2021) |
| `salario_medio_eur` | float | Salario medio anual en euros (EES 2023 + ajustes) |
| `vulnerabilidad_ia_score` | float | Puntuacion de exposicion a la IA (0-10) |
| `eu_ai_act` | str | Clasificacion EU AI Act: Alto riesgo / Limitado / Minimo |
| `tipo_impacto` | str | Tipo de impacto: Sustitucion / Hibrido / Aumentacion |
| `justificacion` | str | Vector de automatizacion (texto explicativo) |

---

## Metodologia

- **Empleo**: EPA Q4 2025 microdatos (22,46M ocupados). Cifras a 4 digitos distribuidas proporcionalmente con ponderaciones Censo 2021 (145 subgrupos a 3 digitos CNO). *Estimacion proporcional, no dato observado a 4 digitos.*
- **Salarios**: Encuesta de Estructura Salarial 2023 (INE), ajustados con primas educativas INE y proxies internacionales. 121 valores unicos.
- **Puntuaciones IA (0-10)**: Generadas con Gemini 2.5 Pro (T=0.2), calibradas con 5 factores estructurales Espana:
  1. Indice de digitalizacion DESI 2023 por sector
  2. Peso del sector servicios
  3. Proteccion laboral (Estatuto de los Trabajadores)
  4. EU AI Act (Reglamento 2024/1689, Anexo III)
  5. Supervision AESIA (Real Decreto 729/2023)
- **Validacion inter-modelo**: Re-puntuacion ciega de 100 ocupaciones estratificadas por GPT-4o. Resultados: r = 0.715, ICC(2,1) = 0.701, kappa_w = 0.667 (acuerdo sustancial). MAD = 1.0 punto.
- **Documento completo**: [Metodologia V20 con 44 notas tecnicas (Zenodo)](https://doi.org/10.5281/zenodo.19076797)

---

## Dos formas de uso

### 1. Archivo HTML autonomo (sin build)

El archivo **`empleo-ia.html`** es una version completamente autonoma que funciona abriendo directamente en cualquier navegador. No requiere Node.js, npm, ni proceso de build.

```bash
# Simplemente abrir en el navegador
open empleo-ia.html          # macOS
xdg-open empleo-ia.html      # Linux
start empleo-ia.html          # Windows
```

Dependencias externas (cargadas via CDN):
- React 18 + ReactDOM 18
- Babel standalone (transpilacion JSX en el navegador)
- Google Fonts (DM Sans + Cormorant Garamond)

Los **502 registros de datos estan embebidos** directamente en el HTML (~358KB de datos JSON inline). El archivo total pesa ~421KB.

### 2. Aplicacion React con Vite (desarrollo)

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo con hot-reload
npm run dev

# Build de produccion
npm run build

# Preview del build
npm run preview
```

---

## Generar el HTML autonomo

El archivo `empleo-ia.html` se genera a partir de los fuentes React. Para regenerarlo tras modificar el codigo:

### Proceso de generacion

1. **Reducir el JSON** a los campos necesarios (elimina campos auxiliares como `empleo_pre_bayes`, `census_2021_employed`, etc.):

```bash
python3 -c "
import json
with open('public/data/spain_502_FINAL_v7.json') as f:
    data = json.load(f)
minimal = [{
    'cno': str(d['cno']),
    'nombre': d['nombre'],
    'sector': d['sector'],
    'empleo': d['empleo'],
    'salario_medio_eur': d['salario_medio_eur'],
    'vulnerabilidad_ia_score': d['vulnerabilidad_ia_score'],
    'eu_ai_act': d['eu_ai_act'],
    'tipo_impacto': d['tipo_impacto'],
    'justificacion': d['justificacion']
} for d in data]
print(json.dumps(minimal, ensure_ascii=False, separators=(',', ':')))
" > /tmp/empleo_data.json
```

2. **Estructura del HTML**: El archivo sigue este patron:

```
<!DOCTYPE html>
<html>
<head>
  - Meta tags + titulo
  - Google Fonts (CDN)
  - CSS inline (keyframes de animacion)
  - React 18 + ReactDOM 18 (CDN unpkg)
  - Babel standalone (CDN unpkg)
</head>
<body>
  <div id="root"></div>
  <script id="occupation-data" type="application/json">
    [...datos JSON embebidos...]
  </script>
  <script type="text/babel">
    - Constantes y helpers (SCORE_COLORS, EU_LABELS, etc.)
    - squarify() — algoritmo de treemap
    - ScoreBadge, OccupationTooltip — componentes
    - Dashboard — componente principal con todas las vistas
    - App — carga datos del <script> embebido
    - ReactDOM.createRoot(...).render(<App />)
  </script>
</body>
</html>
```

3. **Cambios clave respecto a la app React/Vite**:
   - Se eliminan todas las anotaciones TypeScript (tipos, interfaces, genericos)
   - Se reemplazan `import` por funciones definidas en el mismo scope
   - Se cambia `<>...</>` por `<React.Fragment>...</React.Fragment>` (Babel standalone)
   - Los datos se cargan de `document.getElementById("occupation-data").textContent` en lugar de `fetch()`
   - No se usa Tailwind CSS — todo el estilado es inline (ya lo era en la app original)

---

## Stack tecnologico

| Componente | Tecnologia |
|------------|------------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Lenguaje | TypeScript |
| Estilos | CSS-in-JS inline + Tailwind CSS (base) |
| UI Components | shadcn/ui + Radix UI |
| Visualizacion | SVG nativo (treemaps, scatter plots, histogramas) |
| Algoritmo treemap | Squarified Treemap (implementacion propia) |
| Fuentes | DM Sans (UI) + Cormorant Garamond (datos/titulos) |

---

## Estructura del proyecto

```
empleo-ia/
├── empleo-ia.html                      # HTML autonomo (todo-en-uno)
├── public/
│   └── data/
│       ├── spain_502_FINAL_v7.json     # Dataset principal (502 ocupaciones)
│       └── ocupaciones_*.json          # Subset de validacion (100 ocup.)
├── src/
│   ├── pages/
│   │   └── Index.tsx                   # Dashboard principal
│   ├── components/empleo/
│   │   ├── Badge.tsx                   # ScoreBadge component
│   │   ├── DetailPanel.tsx             # Panel lateral de detalle
│   │   └── OccupationTooltip.tsx       # Tooltip hover
│   └── lib/
│       ├── occupationData.ts           # Tipos, constantes, helpers
│       └── treemap.ts                  # Algoritmo squarified treemap
├── index.html                          # Entry point Vite
├── package.json
└── vite.config.ts
```

---

## Licencia

Los datos y la metodologia estan publicados en Zenodo bajo DOI [10.5281/zenodo.19076797](https://doi.org/10.5281/zenodo.19076797).

(c) 2026 A. de Nicolas, M. Sureda
