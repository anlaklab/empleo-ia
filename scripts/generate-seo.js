/**
 * Post-build SEO & GEO artifact generator.
 *
 * Reads the 502-occupation JSON datasets (ES + EN) from dist/data/
 * and produces:
 *   1. dist/llms.txt         – concise overview with links (llmstxt.org spec)
 *   2. dist/llms-full.txt    – full inline dataset for LLM consumption
 *   3. HTML table injection  – static <table> with 502 rows into dist/index.html
 *   4. FAQ JSON-LD injection – FAQPage schema into dist/index.html <head>
 *
 * Usage: node scripts/generate-seo.js
 * Run AFTER `vite build` and BEFORE `prerender.js`.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const DIST = resolve("dist");
const BASE_URL = "https://empleo-ai.anlakstudio.com";

// ─── Load datasets ──────────────────────────────────────────────────────────

function loadJSON(filename) {
  const raw = readFileSync(join(DIST, "data", filename), "utf-8");
  return JSON.parse(raw);
}

const dataES = loadJSON("spain_502_v14_subcomp_complete.json");
const dataEN = loadJSON("spain_502_v14_subcomp_complete_en.json");

// Build a CNO→EN lookup for bilingual llms-full.txt
const enByCno = new Map(dataEN.map((d) => [d.cno, d]));

// ─── Aggregate stats ────────────────────────────────────────────────────────

const totalEmployment = dataES.reduce((s, d) => s + d.empleo, 0);
const avgScore = +(dataES.reduce((s, d) => s + d.vulnerabilidad_ia_score, 0) / dataES.length).toFixed(2);

const sectors = [...new Set(dataES.map((d) => d.sector))].sort();

const highRiskCount = dataES.filter((d) => d.vulnerabilidad_ia_score > 7).length;
const highRiskEmployment = dataES.filter((d) => d.vulnerabilidad_ia_score > 7).reduce((s, d) => s + d.empleo, 0);
const highRiskPct = +((highRiskEmployment / totalEmployment) * 100).toFixed(1);

const lowRiskOccupations = dataES.filter((d) => d.vulnerabilidad_ia_score < 3);
const lowRiskAvgSalary = Math.round(lowRiskOccupations.reduce((s, d) => s + d.salario_medio_eur, 0) / lowRiskOccupations.length);
const highRiskOccs = dataES.filter((d) => d.vulnerabilidad_ia_score > 7);
const highRiskAvgSalary = highRiskOccs.length > 0 ? Math.round(highRiskOccs.reduce((s, d) => s + d.salario_medio_eur, 0) / highRiskOccs.length) : 0;

// Top 5 most vulnerable
const top5 = [...dataES].sort((a, b) => b.vulnerabilidad_ia_score - a.vulnerabilidad_ia_score).slice(0, 5);

// Top 5 least vulnerable
const bottom5 = [...dataES].sort((a, b) => a.vulnerabilidad_ia_score - b.vulnerabilidad_ia_score).slice(0, 5);

// EU AI Act breakdown
const euHighRisk = dataES.filter((d) => d.eu_ai_act.toLowerCase().includes("alto") || d.eu_ai_act.toLowerCase().includes("high"));
const euLimited = dataES.filter((d) => d.eu_ai_act.toLowerCase().includes("limitado") || d.eu_ai_act.toLowerCase().includes("limited"));
const euMinimal = dataES.filter((d) => d.eu_ai_act.toLowerCase().includes("mínimo") || d.eu_ai_act.toLowerCase().includes("minimal"));

// Sector stats
const sectorStats = sectors.map((sector) => {
  const occs = dataES.filter((d) => d.sector === sector);
  const emp = occs.reduce((s, d) => s + d.empleo, 0);
  const avg = +(occs.reduce((s, d) => s + d.vulnerabilidad_ia_score, 0) / occs.length).toFixed(2);
  return { sector, count: occs.length, employment: emp, avgScore: avg };
});

// Most resilient sectors (lowest avg score)
const resilientSectors = [...sectorStats].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);

// ─── 1. Generate llms.txt ───────────────────────────────────────────────────

function generateLlmsTxt() {
  const sectorList = sectorStats
    .map((s) => `- ${s.sector}: ${s.count} occupations, ${s.employment.toLocaleString("es-ES")} workers, avg score ${s.avgScore}/10`)
    .join("\n");

  return `# Vulnerabilidad de Empleos a la IA en España

> Interactive analysis of AI vulnerability for all 502 occupations in the Spanish labor market, covering ${totalEmployment.toLocaleString("es-ES")} workers. Based on EPA Q4 2025, INE Census 2021, and a 4-dimensional AI exposure methodology (v30). Available in Spanish and English. Licensed under CC BY 4.0.

This dataset classifies all 502 CNO-11 occupations in Spain by their vulnerability to artificial intelligence. Each occupation includes employment figures, average salaries, EU AI Act risk classification (High risk / Limited / Minimal), and impact type (Augmentation / Hybrid / Substitution). The vulnerability score (0-10) is computed using a 4-dimensional formula: (D×C/10)×(1-F/20)×(1-R/20), where D=Displacement potential, C=Capability of current AI, F=Friction to adoption, R=Regulatory barriers.

## Key Statistics

- 502 occupations analyzed (CNO-11 classification)
- ${totalEmployment.toLocaleString("es-ES")} workers covered
- Average AI vulnerability score: ${avgScore}/10
- ${highRiskCount} occupations with score > 7/10 (${highRiskEmployment.toLocaleString("es-ES")} workers, ${highRiskPct}% of total employment)
- ${sectors.length} economic sectors
- EU AI Act: ${euHighRisk.length} high risk, ${euLimited.length} limited, ${euMinimal.length} minimal

## Sectors

${sectorList}

## Methodology

- [Methodology PDF (v23)](${BASE_URL}/data/ia-empleo-espana-metodologia-v23.pdf): Full documentation of the 4-dimensional scoring formula, data sources, and validation process.

## Data

- [Full dataset (Spanish, JSON)](${BASE_URL}/data/spain_502_v14_subcomp_complete.json): All 502 occupations with complete metadata in Spanish.
- [Full dataset (English, JSON)](${BASE_URL}/data/spain_502_v14_subcomp_complete_en.json): All 502 occupations with complete metadata in English.
- [Complete context for LLMs](${BASE_URL}/llms-full.txt): Full inline dataset optimized for LLM consumption.

## Optional

- [Interactive visualization](${BASE_URL}): Treemap, scatter plot, and list views of the 502 occupations.
- [Zenodo archive](https://doi.org/10.5281/zenodo.19186444): Permanent academic record of the dataset.
- [Standalone HTML](${BASE_URL}/empleo-ia.html): Self-contained single-file version with embedded data.

## Source & License

- Authors: Álvaro de Nicolás, Miguel Sureda
- License: CC BY 4.0
- Data sources: EPA Q4 2025 (INE), Census 2021 (INE), SEPE 2024
- Methodology: 4D sub-component rescaling with multi-model consensus
`;
}

// ─── 2. Generate llms-full.txt ──────────────────────────────────────────────

function generateLlmsFullTxt() {
  const header = `# Vulnerabilidad de Empleos a la IA en España — Full Dataset

> Complete inline dataset of all 502 CNO-11 occupations in the Spanish labor market with AI vulnerability analysis. ${totalEmployment.toLocaleString("es-ES")} workers · EPA Q4 2025 · Methodology v30 · CC BY 4.0.

This file contains the full dataset for direct LLM consumption. Each occupation includes bilingual names (Spanish/English), employment data, salary, AI vulnerability score (0-10), EU AI Act classification, impact type, and a detailed justification of the AI exposure vector.

## Key Statistics

- Total occupations: 502
- Total workers: ${totalEmployment.toLocaleString("es-ES")}
- Average vulnerability score: ${avgScore}/10
- High vulnerability (>7): ${highRiskCount} occupations, ${highRiskEmployment.toLocaleString("es-ES")} workers (${highRiskPct}%)
- EU AI Act breakdown: ${euHighRisk.length} high risk, ${euLimited.length} limited, ${euMinimal.length} minimal
- Scoring formula: (D×C/10)×(1-F/20)×(1-R/20)

## Source

- Authors: Álvaro de Nicolás, Miguel Sureda
- License: CC BY 4.0
- Data: EPA Q4 2025, INE Census 2021, SEPE 2024
- More info: ${BASE_URL}/llms.txt

`;

  const occupationBlocks = dataES.map((d) => {
    const en = enByCno.get(d.cno);
    const enName = en ? en.nombre : d.nombre;
    const enSector = en ? en.sector : d.sector;
    const enJustification = en ? en.justificacion : "";
    const enEuAiAct = en ? en.eu_ai_act : d.eu_ai_act;
    const enTipoImpacto = en ? en.tipo_impacto : d.tipo_impacto;

    return `### ${d.cno} — ${enName} (${d.nombre})
- Sector: ${enSector} (${d.sector})
- Employment: ${d.empleo.toLocaleString("es-ES")} workers
- Average salary: ${d.salario_medio_eur.toLocaleString("es-ES")} EUR/year
- AI vulnerability score: ${d.vulnerabilidad_ia_score}/10
- EU AI Act risk level: ${enEuAiAct} (${d.eu_ai_act})
- Impact type: ${enTipoImpacto} (${d.tipo_impacto})
- Sub-components: D=${d.rescore_D ?? "N/A"}, C=${d.rescore_C ?? "N/A"}, F=${d.rescore_F ?? "N/A"}, R=${d.rescore_R ?? "N/A"}
- Employment confidence: ${d.employment_confidence ?? "N/A"}
- EN justification: ${enJustification}
- ES justification: ${d.justificacion}`;
  });

  return header + "## Occupations\n\n" + occupationBlocks.join("\n\n") + "\n";
}

// ─── 3. Generate static HTML table ──────────────────────────────────────────

function generateHtmlTable() {
  const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const rows = dataES.map((d) => {
    const en = enByCno.get(d.cno);
    return `<tr>
<td>${escHtml(d.cno)}</td>
<td>${escHtml(d.nombre)}${en ? ` <small>(${escHtml(en.nombre)})</small>` : ""}</td>
<td>${escHtml(d.sector)}</td>
<td>${d.empleo.toLocaleString("es-ES")}</td>
<td>${d.salario_medio_eur.toLocaleString("es-ES")} &euro;</td>
<td>${d.vulnerabilidad_ia_score}</td>
<td>${escHtml(d.eu_ai_act)}</td>
<td>${escHtml(d.tipo_impacto)}</td>
</tr>`;
  }).join("\n");

  return `
<section id="seo-occupation-table" style="max-width:1280px;margin:3rem auto;padding:0 1rem;font-family:system-ui,sans-serif;color:#e0e0e0;">
  <h2 style="font-size:1.5rem;margin-bottom:0.5rem;color:#f0f0f0;">502 ocupaciones del mercado laboral español: vulnerabilidad a la IA</h2>
  <p style="margin-bottom:1rem;font-size:0.9rem;color:#aaa;">Datos: EPA Q4 2025, INE Census 2021, SEPE 2024 · Metodología v30 · ${totalEmployment.toLocaleString("es-ES")} trabajadores analizados · Score medio: ${avgScore}/10</p>
  <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:0.8rem;line-height:1.4;">
      <caption style="text-align:left;padding:0.5rem 0;font-size:0.85rem;color:#ccc;">Análisis de vulnerabilidad a la inteligencia artificial de las 502 ocupaciones CNO-11 del mercado laboral español. Puntuación 0 (mínima exposición) a 10 (máxima exposición).</caption>
      <thead>
        <tr style="border-bottom:2px solid #555;text-align:left;">
          <th scope="col" style="padding:6px 8px;">CNO</th>
          <th scope="col" style="padding:6px 8px;">Ocupación</th>
          <th scope="col" style="padding:6px 8px;">Sector</th>
          <th scope="col" style="padding:6px 8px;">Empleo</th>
          <th scope="col" style="padding:6px 8px;">Salario medio</th>
          <th scope="col" style="padding:6px 8px;">Score IA</th>
          <th scope="col" style="padding:6px 8px;">Riesgo EU AI Act</th>
          <th scope="col" style="padding:6px 8px;">Tipo impacto</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
}

// ─── 4. Generate FAQ JSON-LD ────────────────────────────────────────────────

function generateFaqJsonLd() {
  const top5Names = top5.map((d) => `${d.nombre} (${d.vulnerabilidad_ia_score}/10)`).join(", ");
  const bottom5Names = bottom5.map((d) => `${d.nombre} (${d.vulnerabilidad_ia_score}/10)`).join(", ");
  const resilientSectorNames = resilientSectors.map((s) => `${s.sector} (${s.avgScore}/10)`).join(", ");
  const euHighRiskExamples = euHighRisk.slice(0, 5).map((d) => d.nombre).join(", ");

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué empleos son más vulnerables a la inteligencia artificial en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Las 5 ocupaciones con mayor puntuación de vulnerabilidad a la IA son: ${top5Names}. Estas ocupaciones presentan alta capacidad de automatización y baja fricción regulatoria según la metodología de 4 dimensiones (D, C, F, R).`
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuántos trabajadores están en riesgo por la inteligencia artificial en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `De los ${totalEmployment.toLocaleString("es-ES")} trabajadores analizados (EPA Q4 2025), ${highRiskEmployment.toLocaleString("es-ES")} trabajan en ocupaciones con una puntuación de vulnerabilidad superior a 7/10, lo que representa el ${highRiskPct}% del empleo total. Esto abarca ${highRiskCount} de las 502 ocupaciones CNO-11.`
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué sectores son más resistentes a la automatización por IA en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Los sectores con menor puntuación media de vulnerabilidad a la IA son: ${resilientSectorNames}. Estos sectores combinan alto componente de trabajo físico especializado, interacción humana directa y barreras regulatorias significativas.`
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo se calcula el índice de vulnerabilidad a la IA de cada empleo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `El índice utiliza una fórmula de 4 dimensiones: (D×C/10)×(1-F/20)×(1-R/20), donde D=potencial de desplazamiento, C=capacidad actual de la IA, F=fricción a la adopción y R=barreras regulatorias. Cada dimensión se puntúa de 0 a 10 mediante consenso de múltiples modelos de IA y validación manual. Los datos de empleo provienen de la EPA Q4 2025 y el Censo 2021 del INE.`
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué ocupaciones tienen riesgo alto según la EU AI Act en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${euHighRisk.length} ocupaciones están clasificadas como "Alto riesgo" según la EU AI Act, incluyendo: ${euHighRiskExamples}. Estas ocupaciones implican decisiones que afectan significativamente a los derechos de las personas, como selección de personal, evaluación crediticia o decisiones judiciales.`
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es el salario medio de los empleos más y menos vulnerables a la IA?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Las ocupaciones con alta vulnerabilidad (score >7) tienen un salario medio de ${highRiskAvgSalary.toLocaleString("es-ES")} €/año, mientras que las más resistentes (score <3) promedian ${lowRiskAvgSalary.toLocaleString("es-ES")} €/año. El score medio de vulnerabilidad del mercado laboral español es ${avgScore}/10.`
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué empleos en España son más seguros frente a la inteligencia artificial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Las 5 ocupaciones con menor vulnerabilidad a la IA son: ${bottom5Names}. Estas profesiones requieren habilidades físicas especializadas, empatía humana directa o marcos regulatorios estrictos que limitan la automatización.`
        }
      }
    ]
  };

  return JSON.stringify(faq, null, 2);
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("⏳ Generating SEO & GEO artifacts…");

  // 1. llms.txt
  const llmsTxt = generateLlmsTxt();
  writeFileSync(join(DIST, "llms.txt"), llmsTxt, "utf-8");
  console.log(`  ✓ llms.txt (${(Buffer.byteLength(llmsTxt) / 1024).toFixed(1)} KB)`);

  // 2. llms-full.txt
  const llmsFullTxt = generateLlmsFullTxt();
  writeFileSync(join(DIST, "llms-full.txt"), llmsFullTxt, "utf-8");
  console.log(`  ✓ llms-full.txt (${(Buffer.byteLength(llmsFullTxt) / 1024).toFixed(1)} KB)`);

  // 3. Inject HTML table into dist/index.html
  const indexPath = join(DIST, "index.html");
  let html = readFileSync(indexPath, "utf-8");

  const htmlTable = generateHtmlTable();
  html = html.replace("</body>", `${htmlTable}\n</body>`);
  console.log(`  ✓ HTML table injected (${(Buffer.byteLength(htmlTable) / 1024).toFixed(1)} KB, ${dataES.length} rows)`);

  // 4. Inject FAQ JSON-LD into <head>
  const faqJsonLd = generateFaqJsonLd();
  const faqScript = `\n    <!-- FAQ Structured Data (generated) -->\n    <script type="application/ld+json">\n${faqJsonLd}\n    </script>`;
  html = html.replace("</head>", `${faqScript}\n  </head>`);
  console.log(`  ✓ FAQ JSON-LD injected (${(Buffer.byteLength(faqJsonLd) / 1024).toFixed(1)} KB, 7 questions)`);

  // Write modified index.html
  writeFileSync(indexPath, html, "utf-8");

  console.log("✅ SEO & GEO generation complete.");
}

main();
