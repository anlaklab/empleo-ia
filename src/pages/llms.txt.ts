import type { APIRoute } from "astro";
import { loadAllOccupations, getSectorStats, getAggregateStats, occupationSlug } from "@/data/loadOccupations";

export const prerender = true;

const BASE_URL = "https://empleo-ai.anlakstudio.com";

export const GET: APIRoute = async () => {
  const { es } = loadAllOccupations();
  const sectors = getSectorStats(es);
  const stats = getAggregateStats(es);

  const sectorList = sectors
    .map((s) => `- [${s.sector}](${BASE_URL}/sector/${s.slug}): ${s.count} occupations, ${s.employment.toLocaleString("es-ES")} workers, avg score ${s.avgScore}/10`)
    .join("\n");

  const content = `# Vulnerabilidad de Empleos a la IA en España

> Interactive analysis of AI vulnerability for all ${es.length} occupations in the Spanish labor market, covering ${stats.totalEmployment.toLocaleString("es-ES")} workers. Based on EPA Q4 2025, INE Census 2021, and a 4-dimensional AI exposure methodology (v30). Available in Spanish and English. Licensed under CC BY 4.0.

This dataset classifies all ${es.length} CNO-11 occupations in Spain by their vulnerability to artificial intelligence. Each occupation includes employment figures, average salaries, EU AI Act risk classification (High risk / Limited / Minimal), and impact type (Augmentation / Hybrid / Substitution). The vulnerability score (0-10) is computed using a 4-dimensional formula: (D×C/10)×(1-F/20)×(1-R/20), where D=Displacement potential, C=Capability of current AI, F=Friction to adoption, R=Regulatory barriers.

## Key Statistics

- ${es.length} occupations analyzed (CNO-11 classification)
- ${stats.totalEmployment.toLocaleString("es-ES")} workers covered
- Average AI vulnerability score (employment-weighted, canonical): ${stats.avgScoreWeighted}/10
- Average AI vulnerability score (unweighted): ${stats.avgScore}/10
- ${stats.highRiskCount} occupations with score ≥ 7/10 (${stats.highRiskEmployment.toLocaleString("es-ES")} workers, ${stats.highRiskPct}% of total employment)
- ${sectors.length} economic sectors
- EU AI Act: ${stats.euHighRisk.length} high risk, ${stats.euLimited.length} limited, ${stats.euMinimal.length} minimal

## Sectors

${sectorList}

## Methodology

- [Full methodology v30 on Zenodo](https://doi.org/10.5281/zenodo.19076797): Complete documentation of the 4-dimensional scoring formula, data sources, validation process, and the cross-validation addendum against Funcas DT-2026/04 (Pearson r = 0.936 over 9 CNO-11 grand groups). Concept DOI redirects to the latest version.
- [Funcas cross-validation addendum (local PDF)](${BASE_URL}/data/funcas_validation_addendum.pdf): Direct download of the addendum. Markdown source and CSV data also available.

## Data

- [Full dataset v15 (Spanish, JSON)](${BASE_URL}/data/spain_502_v15_subcomp_complete.json): All ${es.length} occupations with complete metadata in Spanish (v15 schema with cumulative workforce thresholds).
- [Full dataset (English, JSON)](${BASE_URL}/data/spain_502_v15_subcomp_complete_en.json): All ${es.length} occupations with complete metadata in English.
- [Threshold lookup CSV](${BASE_URL}/data/spain_v15_threshold_lookup.csv): Number of occupations and workers at or above each vulnerability score threshold.
- [Funcas validation data CSV](${BASE_URL}/data/funcas_validation_data.csv): Group-by-group comparison of Funcas AIOE-CNO and v15 weighted vulnerability for the 9 CNO-11 grand groups.
- [Complete context for LLMs](${BASE_URL}/llms-full.txt): Full inline dataset optimized for LLM consumption.

## Individual Occupation Pages

- [All ${es.length} occupation pages](${BASE_URL}/sitemap-0.xml): Each occupation has a dedicated page with full details, scores, and justification.

## Optional

- [Interactive visualization](${BASE_URL}): Treemap, scatter plot, and list views of the ${es.length} occupations.
- [Funcas cross-validation page](${BASE_URL}/comparativa-funcas.html): Side-by-side comparison with the Funcas DT-2026/04 study, including the r=0.936 convergence finding, scatter plot of the 9 CNO grand groups, and 4-digit decomposition of the most-flagged groups.
- [Zenodo · IA y Empleo en España (concept DOI)](https://doi.org/10.5281/zenodo.19076797): Permanent academic record. Includes methodology v30, dataset v15, and the cross-validation addendum against Funcas.

## Source & License

- Authors: Álvaro de Nicolás, Miguel Sureda
- License: CC BY 4.0
- Data sources: EPA Q4 2025 (INE), Census 2021 (INE), SEPE 2024
- Methodology: 4D sub-component rescaling with multi-model consensus
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
