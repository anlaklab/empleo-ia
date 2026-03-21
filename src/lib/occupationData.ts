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

export const EU_LABELS: Record<string, string> = {
  "high-risk": "Alto riesgo (Anexo III)",
  "limited": "Riesgo limitado",
  "minimal": "Riesgo mínimo"
};

export const EU_COLORS: Record<string, string> = {
  "high-risk": "#c8633a",
  "limited": "#d4a85a",
  "minimal": "#3a7d9e"
};

export const TIPO_LABELS: Record<string, string> = {
  "replace": "Sustitución",
  "hybrid": "Híbrido",
  "augment": "Aumentación"
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
export const mapEuRisk = (riesgo: string): Occupation["euRisk"] => {
  const r = (riesgo || "").toLowerCase();
  if (r.includes("mínimo")) return "minimal";
  if (r.includes("alto")) return "high-risk";
  if (r.includes("limitado")) return "limited";
  
  return "minimal";
};

export const mapTipo = (tipo: string): Occupation["tipo"] => {
  const t = (tipo || "").toLowerCase();
  if (t.includes("sustituci")) return "replace";
  if (t.includes("híbrido")) return "hybrid";
  return "augment";
};

export const getScoreColor = (s: number) =>
  SCORE_COLORS[Math.round(Math.min(10, Math.max(0, s)))];

export const getScoreLabel = (s: number) =>
  s <= 2 ? "Muy bajo" : s <= 4 ? "Bajo" : s <= 6 ? "Moderado" : s <= 8 ? "Alto" : "Muy alto";

export const fmt = (n: number) => Math.round(n).toLocaleString("es-ES");
export const fmtE = (n: number) => Math.round(n).toLocaleString("es-ES") + " €";

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
