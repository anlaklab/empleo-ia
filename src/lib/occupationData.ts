import i18n from "../i18n";

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface RawOccupation {
  cno: string;
  nombre: string;
  sector: string;
  empleo: number;
  salario_medio_eur: number;
  vulnerabilidad_ia_score: number;
  eu_ai_act: string;
  tipo_impacto: string;
  justificacion: string;
  score_v9?: number;
  rescore_method?: string;
  rescore_cluster?: string;
  rescore_D?: number;
  rescore_C?: number;
  rescore_F?: number;
  rescore_R?: number;
  rescore_formula?: string;
  // v14 fields
  empleo_v10?: number;
  empleo_delta_v11?: number;
  employment_confidence?: string;
  flag_divergencia_gt2?: boolean;
  rescore_range?: string;
  rescore_n_models?: number;
  rescore_raw_avg?: number;
  epa_2digit_empleo?: number;
  sepe_contracts_2024?: number;
  sepe_contracts_hombres?: number;
  sepe_contracts_mujeres?: number;
  sepe_parados_dic2024?: number;
  sepe_parados_hombres_dic2024?: number;
  sepe_parados_mujeres_dic2024?: number;
  sepe_parados_jun2024?: number;
  // admin override fields (5 patched occupations)
  empleo_v13?: number;
  admin_source?: string;
  admin_source_ref?: string;
  admin_source_url?: string;
  admin_reference_date?: string;
  admin_confidence?: string;
  admin_notes?: string;
}

export interface Occupation {
  cno: string;
  name: string;
  sector: string;
  empleo: number;
  salario: number;
  score: number;
  euRisk: "high-risk" | "limited" | "minimal";
  tipo: "replace" | "hybrid" | "augment";
  vector: string;
  isSectorGroup?: boolean;
  ocupaciones?: number;
  salarioTotal?: number;
  scoreTotal?: number;
  items?: Occupation[];
  // rescore sub-components
  scoreV9?: number;
  rescoreCluster?: string;
  rescoreD?: number;
  rescoreC?: number;
  rescoreF?: number;
  rescoreR?: number;
  rescoreFormula?: string;
  rescoreRange?: string;
  rescoreNModels?: number;
  rescoreRawAvg?: number;
  // v14 employment fields
  employmentConfidence?: string;
  flagDivergencia?: boolean;
  // treemap layout
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  children?: Occupation[];
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
export const SCORE_COLORS = [
  "#2b6a8e", "#3a7d9e", "#5494ab", "#74aab8", "#97bfca",
  "#bdb58e", "#d4a85a", "#d9883e", "#c8633a", "#b04232", "#8c1c1c"
];

export const EU_COLORS: Record<string, string> = {
  "high-risk": "#c8633a",
  "limited": "#d4a85a",
  "minimal": "#3a7d9e"
};

// ─── LANGUAGE-AWARE GETTERS ─────────────────────────────────────────────────
export const getEuLabel = (key: string): string =>
  i18n.t(`euLabels.${key}`);

export const getTipoLabel = (key: string): string =>
  i18n.t(`tipoLabels.${key}`);

export const getScoreLabel = (s: number): string => {
  if (s <= 2) return i18n.t("scoreLabels.veryLow");
  if (s <= 4) return i18n.t("scoreLabels.low");
  if (s <= 6) return i18n.t("scoreLabels.moderate");
  if (s <= 8) return i18n.t("scoreLabels.high");
  return i18n.t("scoreLabels.veryHigh");
};

// Keep static references for backward compat in components that read them directly
export const EU_LABELS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_target, prop: string) => getEuLabel(prop),
});

export const TIPO_LABELS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_target, prop: string) => getTipoLabel(prop),
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
export const mapEuRisk = (riesgo: string): Occupation["euRisk"] => {
  const r = (riesgo || "").toLowerCase();
  if (r.includes("mínimo") || r.includes("minimal")) return "minimal";
  if (r.includes("alto") || r.includes("high")) return "high-risk";
  if (r.includes("limitado") || r.includes("limited")) return "limited";
  return "minimal";
};

export const mapTipo = (tipo: string): Occupation["tipo"] => {
  const t = (tipo || "").toLowerCase();
  if (t.includes("sustituci") || t.includes("substitut")) return "replace";
  if (t.includes("híbrido") || t.includes("hybrid")) return "hybrid";
  return "augment";
};

export const getScoreColor = (s: number) =>
  SCORE_COLORS[Math.round(Math.min(10, Math.max(0, s)))];

const getLocale = () => i18n.language === "en" ? "en-US" : "es-ES";

export const fmt = (n: number) => Math.round(n).toLocaleString(getLocale());
export const fmtE = (n: number) => Math.round(n).toLocaleString(getLocale()) + " \u20AC";

export const parseOccupation = (d: RawOccupation): Occupation => ({
  cno: d.cno,
  name: d.nombre,
  sector: d.sector,
  empleo: d.empleo,
  salario: d.salario_medio_eur,
  score: d.vulnerabilidad_ia_score,
  euRisk: mapEuRisk(d.eu_ai_act),
  tipo: mapTipo(d.tipo_impacto),
  vector: d.justificacion,
  ...(d.rescore_D != null && {
    scoreV9: d.score_v9,
    rescoreCluster: d.rescore_cluster,
    rescoreD: d.rescore_D,
    rescoreC: d.rescore_C,
    rescoreF: d.rescore_F,
    rescoreR: d.rescore_R,
    rescoreFormula: d.rescore_formula,
    rescoreRange: d.rescore_range,
    rescoreNModels: d.rescore_n_models,
    rescoreRawAvg: d.rescore_raw_avg,
  }),
  ...(d.employment_confidence != null && { employmentConfidence: d.employment_confidence }),
  ...(d.flag_divergencia_gt2 != null && { flagDivergencia: d.flag_divergencia_gt2 }),
});
