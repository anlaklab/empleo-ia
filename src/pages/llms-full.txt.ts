import type { APIRoute } from "astro";
import { loadAllOccupations, getAggregateStats, occupationSlug } from "@/data/loadOccupations";

export const prerender = true;

const BASE_URL = "https://empleo-ai.anlakstudio.com";

export const GET: APIRoute = async () => {
  const { es, enByCno } = loadAllOccupations();
  const stats = getAggregateStats(es);

  const header = `# Vulnerabilidad de Empleos a la IA en España — Full Dataset

> Complete inline dataset of all ${es.length} CNO-11 occupations in the Spanish labor market with AI vulnerability analysis. ${stats.totalEmployment.toLocaleString("es-ES")} workers · EPA Q4 2025 · Methodology v30 · CC BY 4.0.

This file contains the full dataset for direct LLM consumption. Each occupation includes bilingual names (Spanish/English), employment data, salary, AI vulnerability score (0-10), EU AI Act classification, impact type, and a detailed justification of the AI exposure vector.

## Key Statistics

- Total occupations: ${es.length}
- Total workers: ${stats.totalEmployment.toLocaleString("es-ES")}
- Average vulnerability score: ${stats.avgScore}/10
- High vulnerability (>7): ${stats.highRiskCount} occupations, ${stats.highRiskEmployment.toLocaleString("es-ES")} workers (${stats.highRiskPct}%)
- EU AI Act breakdown: ${stats.euHighRisk.length} high risk, ${stats.euLimited.length} limited, ${stats.euMinimal.length} minimal
- Scoring formula: (D×C/10)×(1-F/20)×(1-R/20)

## Source

- Authors: Álvaro de Nicolás, Miguel Sureda
- License: CC BY 4.0
- Data: EPA Q4 2025, INE Census 2021, SEPE 2024
- More info: ${BASE_URL}/llms.txt

## Occupations

`;

  const blocks = es.map((d) => {
    const en = enByCno.get(d.cno);
    const enName = en ? en.nombre : d.nombre;
    const enSector = en ? en.sector : d.sector;
    const enJustification = en ? en.justificacion : "";
    const enEuAiAct = en ? en.eu_ai_act : d.eu_ai_act;
    const enTipoImpacto = en ? en.tipo_impacto : d.tipo_impacto;
    const slug = occupationSlug(d);

    return `### ${d.cno} — ${enName} (${d.nombre})
- Page: ${BASE_URL}/ocupacion/${slug}
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

  const content = header + blocks.join("\n\n") + "\n";

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
