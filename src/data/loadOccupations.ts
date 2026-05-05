/**
 * Build-time data loading utilities for Astro pages.
 * Reads the JSON datasets and provides typed helpers for getStaticPaths.
 */

import type { RawOccupation } from "@/lib/occupationData";
import esDataRaw from "../../public/data/spain_502_v15_subcomp_complete.json";
import enDataRaw from "../../public/data/spain_502_v15_subcomp_complete_en.json";

const esData = esDataRaw as RawOccupation[];
const enData = enDataRaw as RawOccupation[];

// ─── Slug generation ────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function occupationSlug(occ: RawOccupation): string {
  return `${occ.cno}-${slugify(occ.nombre)}`;
}

export function sectorSlug(sector: string): string {
  return slugify(sector);
}

// ─── Data loading ───────────────────────────────────────────────────────────

export function loadAllOccupations() {
  const enByCno = new Map(enData.map((d) => [d.cno, d]));
  return { es: esData, en: enData, enByCno };
}

// ─── Sector statistics ──────────────────────────────────────────────────────

export interface SectorStat {
  sector: string;
  slug: string;
  count: number;
  employment: number;
  avgScore: number;
  avgSalary: number;
  highRiskCount: number;
  occupations: RawOccupation[];
}

export function getSectorStats(data: RawOccupation[]): SectorStat[] {
  const sectors = [...new Set(data.map((d) => d.sector))].sort();
  return sectors.map((sector) => {
    const occs = data.filter((d) => d.sector === sector);
    const emp = occs.reduce((s, d) => s + d.empleo, 0);
    const avgScore = +(occs.reduce((s, d) => s + d.vulnerabilidad_ia_score, 0) / occs.length).toFixed(2);
    const avgSalary = Math.round(occs.reduce((s, d) => s + d.salario_medio_eur, 0) / occs.length);
    const highRiskCount = occs.filter((d) => d.vulnerabilidad_ia_score >= 7).length;
    return { sector, slug: sectorSlug(sector), count: occs.length, employment: emp, avgScore, avgSalary, highRiskCount, occupations: occs };
  });
}

// ─── Aggregate statistics ───────────────────────────────────────────────────

export function getAggregateStats(data: RawOccupation[]) {
  const totalEmployment = data.reduce((s, d) => s + d.empleo, 0);
  // Unweighted: simple mean across the 502 occupations.
  const avgScore = +(data.reduce((s, d) => s + d.vulnerabilidad_ia_score, 0) / data.length).toFixed(2);
  // Weighted by employment (canonical headline figure per Zenodo).
  const avgScoreWeighted = +(data.reduce((s, d) => s + d.vulnerabilidad_ia_score * d.empleo, 0) / totalEmployment).toFixed(2);
  // High vulnerability = score ≥ 7 (canonical threshold matching the dashboard KPI and Zenodo).
  const highRiskOccs = data.filter((d) => d.vulnerabilidad_ia_score >= 7);
  const highRiskCount = highRiskOccs.length;
  const highRiskEmployment = highRiskOccs.reduce((s, d) => s + d.empleo, 0);
  const highRiskPct = +((highRiskEmployment / totalEmployment) * 100).toFixed(1);

  const lowRiskOccs = data.filter((d) => d.vulnerabilidad_ia_score < 3);
  const lowRiskAvgSalary = Math.round(lowRiskOccs.reduce((s, d) => s + d.salario_medio_eur, 0) / lowRiskOccs.length);
  const highRiskAvgSalary = highRiskOccs.length > 0 ? Math.round(highRiskOccs.reduce((s, d) => s + d.salario_medio_eur, 0) / highRiskOccs.length) : 0;

  const top5 = [...data].sort((a, b) => b.vulnerabilidad_ia_score - a.vulnerabilidad_ia_score).slice(0, 5);
  const bottom5 = [...data].sort((a, b) => a.vulnerabilidad_ia_score - b.vulnerabilidad_ia_score).slice(0, 5);

  const euHighRisk = data.filter((d) => d.eu_ai_act.toLowerCase().includes("alto") || d.eu_ai_act.toLowerCase().includes("high"));
  const euLimited = data.filter((d) => d.eu_ai_act.toLowerCase().includes("limitado") || d.eu_ai_act.toLowerCase().includes("limited"));
  const euMinimal = data.filter((d) => d.eu_ai_act.toLowerCase().includes("mínimo") || d.eu_ai_act.toLowerCase().includes("minimal"));

  return {
    totalEmployment, avgScore, avgScoreWeighted, highRiskCount, highRiskEmployment, highRiskPct,
    lowRiskAvgSalary, highRiskAvgSalary, top5, bottom5,
    euHighRisk, euLimited, euMinimal,
  };
}

// ─── JSON-LD generators ────────────────────────────────────────────────────

const BASE_URL = "https://empleo-ai.anlakstudio.com";

export function generateDatasetJsonLd(data: RawOccupation[]) {
  const stats = getAggregateStats(data);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vulnerabilidad de Empleos a la IA en España",
    "description": `Análisis interactivo de vulnerabilidad a la IA de las ${data.length} ocupaciones del mercado laboral español. Dataset v15, metodología v30.`,
    "url": BASE_URL,
    "applicationCategory": "DataVisualization",
    "operatingSystem": "Web",
    "author": [
      { "@type": "Person", "name": "Álvaro de Nicolás" },
      { "@type": "Person", "name": "Miguel Sureda" },
    ],
    "about": {
      "@type": "Dataset",
      "name": "Vulnerabilidad Laboral a la IA · España 2026",
      "description": `${data.length} ocupaciones CNO-11, ${stats.totalEmployment.toLocaleString("es-ES")} trabajadores, EPA Q4 2025, Censo 2021`,
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "temporalCoverage": "2025",
      "identifier": [
        "https://doi.org/10.5281/zenodo.19076797",
      ],
      "distribution": [
        { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": `${BASE_URL}/data/spain_502_v15_subcomp_complete.json` },
        { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": `${BASE_URL}/data/spain_502_v15_subcomp_complete_en.json` },
        { "@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": `${BASE_URL}/data/spain_v15_threshold_lookup.csv` },
        { "@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": `${BASE_URL}/data/funcas_validation_data.csv` },
        { "@type": "DataDownload", "encodingFormat": "application/pdf", "contentUrl": `${BASE_URL}/data/funcas_validation_addendum.pdf` },
        { "@type": "DataDownload", "encodingFormat": "text/plain", "contentUrl": `${BASE_URL}/llms-full.txt` },
      ],
      "variableMeasured": [
        { "@type": "PropertyValue", "name": "AI Vulnerability Score", "minValue": 0, "maxValue": 10 },
        { "@type": "PropertyValue", "name": "Employment", "unitText": "workers" },
        { "@type": "PropertyValue", "name": "Average Salary", "unitCode": "EUR" },
      ],
      "measurementTechnique": "4D sub-component formula: (D×C/10)×(1-F/20)×(1-R/20)",
    },
    "inLanguage": ["es", "en"],
  };
}

export function generateFaqJsonLd(data: RawOccupation[]) {
  const stats = getAggregateStats(data);
  const sectors = getSectorStats(data);
  const resilientSectors = [...sectors].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);

  const top5Names = stats.top5.map((d) => `${d.nombre} (${d.vulnerabilidad_ia_score}/10)`).join(", ");
  const bottom5Names = stats.bottom5.map((d) => `${d.nombre} (${d.vulnerabilidad_ia_score}/10)`).join(", ");
  const resilientNames = resilientSectors.map((s) => `${s.sector} (${s.avgScore}/10)`).join(", ");
  const euHighExamples = stats.euHighRisk.slice(0, 5).map((d) => d.nombre).join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué empleos son más vulnerables a la inteligencia artificial en España?",
        "acceptedAnswer": { "@type": "Answer", "text": `Las 5 ocupaciones con mayor puntuación de vulnerabilidad a la IA son: ${top5Names}. Estas ocupaciones presentan alta capacidad de automatización y baja fricción regulatoria según la metodología de 4 dimensiones (D, C, F, R).` },
      },
      {
        "@type": "Question",
        "name": "¿Cuántos trabajadores están en riesgo por la inteligencia artificial en España?",
        "acceptedAnswer": { "@type": "Answer", "text": `De los ${stats.totalEmployment.toLocaleString("es-ES")} trabajadores analizados (EPA Q4 2025), ${stats.highRiskEmployment.toLocaleString("es-ES")} trabajan en ocupaciones con una puntuación de vulnerabilidad ≥7/10, lo que representa el ${stats.highRiskPct}% del empleo total. Esto abarca ${stats.highRiskCount} de las ${data.length} ocupaciones CNO-11.` },
      },
      {
        "@type": "Question",
        "name": "¿Qué sectores son más resistentes a la automatización por IA en España?",
        "acceptedAnswer": { "@type": "Answer", "text": `Los sectores con menor puntuación media de vulnerabilidad a la IA son: ${resilientNames}. Estos sectores combinan alto componente de trabajo físico especializado, interacción humana directa y barreras regulatorias significativas.` },
      },
      {
        "@type": "Question",
        "name": "¿Cómo se calcula el índice de vulnerabilidad a la IA de cada empleo?",
        "acceptedAnswer": { "@type": "Answer", "text": "El índice utiliza una fórmula de 4 dimensiones: (D×C/10)×(1-F/20)×(1-R/20), donde D=potencial de desplazamiento, C=capacidad actual de la IA, F=fricción a la adopción y R=barreras regulatorias. Cada dimensión se puntúa de 0 a 10 mediante consenso de múltiples modelos de IA y validación manual. Los datos de empleo provienen de la EPA Q4 2025 y el Censo 2021 del INE." },
      },
      {
        "@type": "Question",
        "name": "¿Qué ocupaciones tienen riesgo alto según la EU AI Act en España?",
        "acceptedAnswer": { "@type": "Answer", "text": `${stats.euHighRisk.length} ocupaciones están clasificadas como "Alto riesgo" según la EU AI Act, incluyendo: ${euHighExamples}. Estas ocupaciones implican decisiones que afectan significativamente a los derechos de las personas.` },
      },
      {
        "@type": "Question",
        "name": "¿Cuál es el salario medio de los empleos más y menos vulnerables a la IA?",
        "acceptedAnswer": { "@type": "Answer", "text": `Las ocupaciones con alta vulnerabilidad (score ≥7) tienen un salario medio de ${stats.highRiskAvgSalary.toLocaleString("es-ES")} €/año, mientras que las más resistentes (score <3) promedian ${stats.lowRiskAvgSalary.toLocaleString("es-ES")} €/año. El score medio ponderado por empleo del mercado laboral español es ${stats.avgScoreWeighted}/10 (${stats.avgScore}/10 sin ponderar).` },
      },
      {
        "@type": "Question",
        "name": "¿Qué empleos en España son más seguros frente a la inteligencia artificial?",
        "acceptedAnswer": { "@type": "Answer", "text": `Las 5 ocupaciones con menor vulnerabilidad a la IA son: ${bottom5Names}. Estas profesiones requieren habilidades físicas especializadas, empatía humana directa o marcos regulatorios estrictos que limitan la automatización.` },
      },
      {
        "@type": "Question",
        "name": "¿Cómo se relaciona este dataset con el estudio Funcas sobre IA y empleo en España?",
        "acceptedAnswer": { "@type": "Answer", "text": `El estudio Funcas (Rodríguez-Fernández, abril 2026) estima 1,7-2,3 millones de empleos destruidos por IA en España en diez años, agregados a los 9 grandes grupos CNO-11. Este dataset opera al cuarto dígito (502 ocupaciones) con una metodología independiente. Cuando se agregan los scores de v15 al primer dígito y se comparan con el AIOE-CNO de Funcas, la correlación de Pearson es r = 0,936 (Spearman ρ = 0,830). Dos metodologías independientes con inputs disjuntos convergen al nivel macro; v15 añade granularidad ocupacional al cuarto dígito. Detalle completo en /comparativa-funcas.html.` },
      },
    ],
  };
}
