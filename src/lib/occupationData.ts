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
});
