import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type Occupation, type RawOccupation, parseOccupation, SCORE_COLORS, getScoreColor, getScoreLabel, fmt, fmtE, EU_LABELS, EU_COLORS, TIPO_LABELS } from "@/lib/occupationData";
import { squarify } from "@/lib/treemap";
import { ScoreBadge } from "@/components/empleo/Badge";
import { OccupationTooltip } from "@/components/empleo/OccupationTooltip";
import { LanguageToggle } from "@/components/empleo/LanguageToggle";

const F = "'DM Sans', sans-serif";
const S = "'Cormorant Garamond', serif";

function Dashboard({ data }: { data: Occupation[] }) {
  const { t } = useTranslation();
  const OCCUPATIONS_DATA = data;
  const SECTORS = useMemo(() => [...new Set(OCCUPATIONS_DATA.map(d => d.sector))].sort(), [OCCUPATIONS_DATA]);

  const [sector, setSector] = useState("Todos");
  const [range, setRange] = useState([0, 10]);
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<Occupation | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<Occupation | null>(null);
  const [sortBy, setSortBy] = useState("empleo");
  const [view, setView] = useState("detailedMap");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 520 });

  useEffect(() => {
    const m = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        setDims({ w: r.width, h: Math.max(380, Math.min(600, r.width * 0.56)) });
      }
    };
    m(); window.addEventListener("resize", m); return () => window.removeEventListener("resize", m);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return OCCUPATIONS_DATA.filter(d =>
      (sector === "Todos" || d.sector === sector) &&
      d.score >= range[0] && d.score <= range[1] &&
      (q === "" || d.name.toLowerCase().includes(q) || d.cno.includes(q))
    );
  }, [sector, range, search, OCCUPATIONS_DATA]);

  const groupedBySector = useMemo(() => {
    if (sector !== "Todos" || view !== "treemap") return null;
    const groups: Record<string, any> = {};
    for (const d of filtered) {
      if (!groups[d.sector]) {
        groups[d.sector] = {
          cno: "S-" + d.sector, name: d.sector, sector: d.sector,
          empleo: 0, salarioTotal: 0, scoreTotal: 0, ocupaciones: 0,
          vector: "",
          euRisk: "minimal", tipo: "hybrid", isSectorGroup: true, salario: 0, score: 0
        };
      }
      groups[d.sector].empleo += d.empleo;
      groups[d.sector].salarioTotal += d.salario * d.empleo;
      groups[d.sector].scoreTotal += d.score * d.empleo;
      groups[d.sector].ocupaciones += 1;
    }
    return Object.values(groups).map((g: any) => {
      g.score = g.empleo > 0 ? g.scoreTotal / g.empleo : 0;
      g.salario = g.empleo > 0 ? g.salarioTotal / g.empleo : 0;
      return g as Occupation;
    });
  }, [filtered, sector, view]);

  const stats = useMemo(() => {
    const te = filtered.reduce((s, d) => s + d.empleo, 0);
    const ws = filtered.reduce((s, d) => s + d.score * d.empleo, 0) / (te || 1);
    const hi = filtered.filter(d => d.score >= 7);
    const he = hi.reduce((s, d) => s + d.empleo, 0);
    const tw = filtered.reduce((s, d) => s + d.empleo * d.salario * (d.score / 10), 0);
    return { te, ws, he, hp: te ? he / te * 100 : 0, tw };
  }, [filtered]);

  const scoreCounts = useMemo(() => {
    const counts = Array(11).fill(0);
    filtered.forEach(d => { counts[Math.round(d.score)]++; });
    return counts;
  }, [filtered]);

  const rects = useMemo(() => {
    if (view !== "treemap") return [];
    if (sector === "Todos" && groupedBySector) {
      return squarify(groupedBySector, 2, 2, dims.w - 4, dims.h - 4, sortBy);
    }
    return squarify(filtered, 2, 2, dims.w - 4, dims.h - 4, sortBy);
  }, [filtered, groupedBySector, dims, view, sector, sortBy]);

  const detailedRects = useMemo(() => {
    if (view !== "detailedMap") return [];
    if (!filtered.length) return [];
    const groupsMap: Record<string, any> = {};
    for (const d of filtered) {
      if (!groupsMap[d.sector]) {
        groupsMap[d.sector] = {
          cno: "G-" + d.sector, sector: d.sector, name: d.sector,
          empleo: 0, scoreTotal: 0, items: [], score: 0, salario: 0,
          euRisk: "minimal", tipo: "hybrid", vector: ""
        };
      }
      groupsMap[d.sector].empleo += d.empleo;
      groupsMap[d.sector].scoreTotal += d.score * d.empleo;
      groupsMap[d.sector].items.push(d);
    }
    const groups = Object.values(groupsMap).map((g: any) => {
      g.score = g.empleo > 0 ? g.scoreTotal / g.empleo : 0;
      return g as Occupation;
    });
    let topRects: Occupation[];
    if (sector === "Todos") {
      topRects = squarify(groups, 2, 2, dims.w - 4, dims.h - 4, sortBy);
    } else {
      topRects = [{ ...groups[0], x: 2, y: 2, w: dims.w - 4, h: dims.h - 4 }];
    }
    return topRects.map(g => {
      const cx = (g.x || 0) + 2;
      const cy = (g.y || 0) + 2;
      const cw = Math.max(0, (g.w || 0) - 4);
      const ch = Math.max(0, (g.h || 0) - 4);
      const children = squarify(g.items || [], cx, cy, cw, ch, sortBy);
      return { ...g, children };
    });
  }, [filtered, dims, view, sector, sortBy]);

  const sorted = useMemo(() => {
    if (view !== "list") return [];
    return [...filtered].sort((a, b) =>
      sortBy === "score" ? b.score - a.score :
        sortBy === "salario" ? b.salario - a.salario : b.empleo - a.empleo);
  }, [filtered, sortBy, view]);

  function renderHistogram() {
    const maxCount = Math.max(1, Math.max(...scoreCounts));
    return (
      <div style={{ marginTop: 24, padding: "20px 24px 16px", background: "#f0ece4", borderRadius: 8, border: "1px solid #e0dcd4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontFamily: S, letterSpacing: "-0.2px" }}>
              {t("histogram.title", "Distribución de ocupaciones por nivel de exposición")}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
              {filtered.length} {t("histogram.filtered", "ocupaciones filtradas")} · {t("histogram.scale", "Escala 0 (mínima) → 10 (máxima)")}
            </div>
          </div>
          <a href="https://doi.org/10.5281/zenodo.19076797" target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", fontSize: 11, fontWeight: 600, fontFamily: F,
              background: "#1a1a1a", color: "#faf8f4", borderRadius: 5,
              textDecoration: "none", letterSpacing: "0.3px",
              transition: "background 0.15s ease", cursor: "pointer",
              border: "none", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {t("histogram.methodologyPdf", "Metodología V20 (PDF)")}
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, justifyContent: "center", height: 100 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => {
            const count = scoreCounts[s];
            const h = Math.max(6, (count / maxCount) * 80);
            return (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "1 1 0", maxWidth: 48 }}>
                <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>{count}</span>
                <div style={{
                  width: "100%", height: h, background: SCORE_COLORS[s], borderRadius: "4px 4px 1px 1px",
                  boxShadow: `0 2px 6px ${SCORE_COLORS[s]}44`,
                  transition: "height 0.3s ease"
                }} />
                <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 700 }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>← {t("histogram.low", "Baja exposición")}</span>
          <span>{t("histogram.high", "Alta exposición")} →</span>
        </div>
      </div>
    );
  }

  function renderOccupationCard() {
    if (!selected) return null;
    const wage = selected.empleo * selected.salario * (selected.score / 10);
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const empText = selected.empleo >= 1e6 ? (selected.empleo / 1e6).toFixed(1) + "M" : selected.empleo >= 1e3 ? (selected.empleo / 1e3).toFixed(0) + "K" : fmt(selected.empleo);
    const shareText = t("detail.shareText", {
      name: selected.name, cno: selected.cno, score: selected.score.toFixed(1),
      employees: empText, salary: fmtE(selected.salario),
      index: wage >= 1e9 ? (wage / 1e9).toFixed(1) + "B \u20AC" : (wage / 1e6).toFixed(0) + "M \u20AC",
      impact: TIPO_LABELS[selected.tipo], risk: EU_LABELS[selected.euRisk],
    }) + ` ${shareUrl}`;
    const shareSubject = `${selected.name} \u2014 ${t("detail.exposure")} ${selected.score.toFixed(1)}/10`;

    return (
      <div style={{
        width: "100%", minHeight: dims.h, background: "#faf8f4", borderRadius: 8,
        border: "1px solid #e0dcd4", padding: "28px 32px", position: "relative",
        animation: "fadeInCard 0.25s ease-out",
      }}>
        <style>{`@keyframes fadeInCard{from{opacity:0;transform:scale(0.98)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Close button */}
        <button onClick={() => setSelected(null)} style={{
          position: "absolute", top: 14, right: 14, background: "#f0ece4",
          border: "1px solid #d8d4cc", color: "#888", fontSize: 15, cursor: "pointer",
          borderRadius: "50%", width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#e8e4dc")}
          onMouseLeave={e => (e.currentTarget.style.background = "#f0ece4")}
        >✕</button>

        {/* Header */}
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", marginBottom: 6 }}>
          CNO {selected.cno} · {selected.sector.toUpperCase()}
        </div>
        <h2 style={{
          fontSize: "clamp(24px, 3vw, 36px)", fontFamily: S, color: "#1a1a1a",
          margin: "0 0 16px", lineHeight: 1.15, paddingRight: 44, fontWeight: 600
        }}>{selected.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <ScoreBadge score={selected.score} size="lg" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: getScoreColor(selected.score) }}>
              {t("detail.exposure")} {getScoreLabel(selected.score)}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>{selected.score.toFixed(1)} / 10</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
          <div style={{ padding: 14, background: "#f0ece4", borderRadius: 6 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 3 }}>{t("detail.employees")}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", fontFamily: S }}>
              {selected.empleo >= 1e6 ? (selected.empleo / 1e6).toFixed(1) + "M" : selected.empleo >= 1e3 ? Math.round(selected.empleo / 1e3) + "K" : fmt(selected.empleo)}
            </div>
          </div>
          <div style={{ padding: 14, background: "#f0ece4", borderRadius: 6 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 3 }}>{t("detail.avgSalary")}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", fontFamily: S }}>{fmtE(selected.salario)}</div>
          </div>
          <div style={{ padding: 14, background: "#f0ece4", borderRadius: 6 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 3 }}>{t("detail.wageIndex")}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#c8633a", fontFamily: S }}>
              {wage >= 1e9 ? (wage / 1e9).toFixed(1) + "B €" : (wage / 1e6).toFixed(0) + "M €"}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{t("stats.wageFormula")}</div>
          </div>
        </div>

        {/* Automation vector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 6 }}>{t("detail.automationVector")}</div>
          <div style={{
            fontSize: 13, color: "#444", lineHeight: 1.5, padding: 10,
            background: "#f0ece4", borderRadius: 5, borderLeft: `3px solid ${getScoreColor(selected.score)}`
          }}>{selected.vector}</div>
        </div>

        {/* Tags row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <span style={{
            padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
            background: `${EU_COLORS[selected.euRisk]}18`, color: EU_COLORS[selected.euRisk],
            border: `1px solid ${EU_COLORS[selected.euRisk]}33`
          }}>EU AI Act: {EU_LABELS[selected.euRisk]}</span>
          <span style={{
            padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
            background: "#f0ece4", color: "#666", border: "1px solid #e0dcd4"
          }}>{TIPO_LABELS[selected.tipo]}</span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "#888", lineHeight: 1.5, textAlign: "right",
          }}>
            {t("detail.reliability")} κ<sub>w</sub> = 0,667 · MAD = 1,0
          </span>
        </div>

        {/* Social sharing */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", color: "#999", fontWeight: 600 }}>{t("detail.share")}</span>
          {/* X/Twitter */}
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
            background: "#1a1a1a", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", border: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X
          </a>
          {/* LinkedIn */}
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
            background: "#0A66C2", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", border: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          {/* WhatsApp */}
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
            background: "#25D366", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", border: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          {/* Email */}
          <a href={`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
            background: "#666", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", border: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Email
          </a>
          {/* Copy */}
          <button onClick={() => {
            navigator.clipboard.writeText(shareText).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }} style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20,
            background: "#f0ece4", color: "#666", fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: "1px solid #d8d4cc",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? t("detail.copied") : t("detail.copy")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })} style={{ background: "#faf8f4", color: "#1a1a1a", minHeight: "100vh", fontFamily: F }}>

      <div style={{ padding: "28px 24px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "2.5px", color: "#bbb", marginBottom: 6 }}>
            {t("header.subtitle")}
          </div>
          <LanguageToggle />
        </div>
        <h1 style={{
          fontSize: "clamp(26px, 3.5vw, 44px)", fontFamily: S, fontWeight: 600,
          margin: "0 0 4px", lineHeight: 1.08, color: "#1a1a1a"
        }}>
          {t("header.title")}
        </h1>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.55, margin: "0 0 20px" }}>
          {t("header.description")}
        </p>

        {/* Stats ribbon */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {[
            [t("stats.occupations"), filtered.length, t("stats.of", { total: OCCUPATIONS_DATA.length })],
            [t("stats.employment"), fmt(stats.te), t("stats.workers", { count: (stats.te / 1e6).toFixed(1) })],
            [t("stats.weightedExposure"), stats.ws.toFixed(1) + " / 10", getScoreLabel(stats.ws)],
            [t("stats.highExposure"), `${stats.hp.toFixed(1)}%`, t("stats.jobs", { count: fmt(stats.he) })],
            [t("stats.wageIndex"), `${(stats.tw / 1e9).toFixed(1)}B \u20AC`, t("stats.wageFormula")],

          ].map(([l, v, s]) => (
            <div key={l as string} style={{
              padding: "12px 16px", background: "#f0ece4", borderRadius: 6,
              flex: "1 1 150px", minWidth: 140
            }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1.3px", color: "#aaa", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: S, lineHeight: 1.1, color: "#1a1a1a" }}>{v}</div>
              {s && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s}</div>}
            </div>
          ))}
        </div>

        {/* Employment disclaimer */}
        <div style={{ fontSize: 10, color: "#b08050", background: "#fdf6ee", border: "1px solid #f0dcc0", borderRadius: 5, padding: "8px 12px", marginBottom: 20, lineHeight: 1.5 }}>
          <strong>{t("disclaimer.title")}</strong> {t("disclaimer.text")} <em>{t("disclaimer.italic")}</em>
        </div>

        {/* Compact Filters Bar */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
          padding: "10px 0", borderTop: "1px solid #e8e4dc", borderBottom: "1px solid #e8e4dc", marginBottom: 16
        }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, flex: "0 1 200px", minWidth: 120, position: "relative" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, pointerEvents: "none", color: "#aaa" }}>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              style={{
                width: "100%", background: "#f0ece4", border: "1px solid #e0dcd4", color: "#444",
                borderRadius: 5, padding: "6px 28px 6px 28px", fontSize: 12, fontFamily: F, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#c8633a")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e0dcd4")}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer", padding: 0, lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Sector */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <select value={sector} onChange={e => setSector(e.target.value)} style={{
              background: "#f0ece4", border: "1px solid #e0dcd4", color: "#444", borderRadius: 5,
              padding: "6px 8px", fontSize: 11, fontFamily: F, cursor: "pointer", outline: "none", maxWidth: 140,
            }}>
              <option value="Todos">{t("filters.allSectors")}</option>
              {SECTORS.map(s => <option key={s} value={s}>{t(`sectors.${s}`, s)}</option>)}
            </select>
            {sector !== "Todos" && (
              <button onClick={() => setSector("Todos")} style={{
                background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer", padding: "0 2px", lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: "#e0dcd4" }} />

          {/* Range */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "#aaa", fontWeight: 600 }}>{t("filters.exposure")}</span>
            <input type="range" min={0} max={10} step={1} value={range[0]}
              onChange={e => setRange([+e.target.value, range[1]])}
              style={{ width: 50, accentColor: "#c8633a" }} />
            <span style={{ fontSize: 11, color: "#888", minWidth: 30, textAlign: "center" }}>{range[0]}–{range[1]}</span>
            <input type="range" min={0} max={10} step={1} value={range[1]}
              onChange={e => setRange([range[0], +e.target.value])}
              style={{ width: 50, accentColor: "#c8633a" }} />
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            background: "#f0ece4", border: "1px solid #e0dcd4", color: "#444", borderRadius: 5,
            padding: "6px 8px", fontSize: 11, fontFamily: F, cursor: "pointer", outline: "none",
          }}>
            <option value="empleo">{t("filters.sortEmployment")}</option>
            <option value="salario">{t("filters.sortSalary")}</option>
            <option value="score">{t("filters.sortRisk")}</option>
          </select>

          {/* View buttons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {(["treemap", "detailedMap", "scatter", "list"] as const).map(m => (
              <button key={m} onClick={() => {
                setView(m);
                setSelected(null);
                if (m === "detailedMap") setSector("Todos");
              }} style={{
                padding: "5px 10px", fontSize: 10, fontFamily: F, fontWeight: 600,
                background: view === m ? "#1a1a1a" : "transparent",
                color: view === m ? "#faf8f4" : "#aaa",
                border: `1px solid ${view === m ? "#1a1a1a" : "#ddd"}`,
                borderRadius: 5, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px",
                transition: "all 0.15s ease"
              }}>
                {m === "treemap" ? t("views.map") : m === "detailedMap" ? t("views.detail") : m === "scatter" ? t("views.chart") : t("views.list")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OCCUPATION CARD (replaces all views when selected) */}
      {selected && (
        <div style={{ padding: "0 24px 16px", maxWidth: 1200, margin: "0 auto" }}>
          <div ref={ref}>
            {renderOccupationCard()}
          </div>
          {renderHistogram()}
        </div>
      )}

      {/* TREEMAP */}
      {!selected && view === "treemap" && (
        <div style={{ padding: "0 24px 16px", maxWidth: 1200, margin: "0 auto" }}>
          <div ref={ref} onMouseLeave={() => { setHovered(null); setHoveredGroup(null); }} style={{
            width: "100%", position: "relative", borderRadius: 8,
            overflow: "hidden", border: "1px solid #e0dcd4", background: "#f5f1eb"
          }}>
            <svg width={dims.w} height={dims.h} style={{ display: "block" }} onMouseLeave={() => { setHovered(null); setHoveredGroup(null); }}>
              {rects.map(r => {
                const isH = hovered?.cno === r.cno;
                const show = (r.w || 0) > 52 && (r.h || 0) > 26;
                const showS = (r.w || 0) > 32 && (r.h || 0) > 20;
                const minD = Math.min(r.w || 0, r.h || 0);
                return (
                  <g key={r.cno}
                    onMouseEnter={() => setHovered(r)} onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                      if (r.isSectorGroup) {
                        setSector(r.sector);
                        setHovered(null);
                        setHoveredGroup(null);
                      } else {
                        setSelected(r);
                        setHovered(null);
                      }
                    }} style={{ cursor: "pointer" }}>
                    <rect x={(r.x || 0) + 1} y={(r.y || 0) + 1}
                      width={Math.max(0, (r.w || 0) - 2)} height={Math.max(0, (r.h || 0) - 2)}
                      fill={getScoreColor(r.score)} opacity={isH ? 1 : 0.85} rx={4}
                      stroke={isH ? "#1a1a1a" : "#faf8f4"} strokeWidth={isH ? 4 : 2}
                      style={{ transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)" }} />
                    {show && (
                      <foreignObject x={(r.x || 0) + 6} y={(r.y || 0) + 6} width={(r.w || 0) - 12} height={(r.h || 0) - 12} style={{ pointerEvents: "none" }}>
                        <div style={{
                          display: "flex", flexDirection: "column", height: "100%",
                          color: r.score > 5 ? "#fff" : "#1a1a1a",
                          textShadow: r.score > 5 ? "0 1px 3px rgba(0,0,0,0.5)" : "none",
                        }}>
                          <div style={{
                            fontSize: r.isSectorGroup ? Math.min(26, Math.max(14, (r.w || 0) / 12)) + "px" : Math.min(12, Math.max(8, minD / 6)) + "px",
                            fontWeight: r.isSectorGroup ? 700 : 600,
                            lineHeight: 1.1, marginBottom: 4, letterSpacing: r.isSectorGroup ? "-0.5px" : "0",
                          }}>
                            {r.name}
                          </div>
                          {(r.h || 0) > 65 && r.isSectorGroup ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div style={{
                                  background: r.score > 5 ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.5)",
                                  padding: "3px 8px", borderRadius: 4, fontSize: 13, fontWeight: 700,
                                  border: `1px solid ${r.score > 5 ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}`,
                                  backdropFilter: "blur(4px)"
                                }}>
                                  Score: {r.score.toFixed(1)} / 10
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>{r.ocupaciones} {t("treemap.occupations")}</span>
                              </div>
                              <div style={{ fontSize: 14, opacity: 0.95 }}>
                                <strong style={{ fontSize: 16 }}>{fmt(r.empleo)}</strong> {t("treemap.jobs")}
                              </div>
                            </div>
                          ) : (r.h || 0) > 38 && !r.isSectorGroup ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: "auto" }}>
                              <div style={{
                                background: r.score > 5 ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)",
                                padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 700,
                                width: "fit-content", backdropFilter: "blur(4px)"
                              }}>
                                Score: {r.score.toFixed(1)}
                              </div>
                              <div style={{ fontSize: 9, opacity: 0.8, fontWeight: 400 }}>{fmt(r.empleo)} {t("treemap.empl")}</div>
                            </div>
                          ) : null}
                        </div>
                      </foreignObject>
                    )}
                    {!show && showS && (
                      <text x={(r.x || 0) + (r.w || 0) / 2} y={(r.y || 0) + (r.h || 0) / 2 + 3}
                        textAnchor="middle" fontSize="9" fontWeight="700"
                        fill={r.score > 5 ? "#fff" : "#1a1a1a"}>{r.score.toFixed(0)}</text>
                    )}
                  </g>
                );
              })}
            </svg>
            {hovered && !selected && <OccupationTooltip item={hovered} mousePos={mousePos} />}
          </div>
          {renderHistogram()}
        </div>
      )}

      {/* DETAILED MAP */}
      {!selected && view === "detailedMap" && (
        <div style={{ padding: "0 24px 16px", maxWidth: 1200, margin: "0 auto" }}>
          <div ref={ref} onMouseLeave={() => { setHovered(null); setHoveredGroup(null); }} style={{
            width: "100%", position: "relative", borderRadius: 8,
            overflow: "hidden", border: "1px solid #e0dcd4", background: "#f5f1eb",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.02)"
          }}>
            <svg width={dims.w} height={dims.h} style={{ display: "block" }} onMouseLeave={() => { setHovered(null); setHoveredGroup(null); }}>
              {detailedRects.map(group => {
                const isGroupHovered = hoveredGroup === group.sector;
                return (
                  <g key={group.sector}
                    onMouseEnter={() => setHoveredGroup(group.sector)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <rect x={group.x} y={group.y} width={group.w} height={group.h}
                      fill="transparent"
                      stroke={isGroupHovered ? "#1a1a1a" : "#faf8f4"}
                      strokeWidth={isGroupHovered ? 4 : 2} rx={4}
                      style={{ transition: "stroke 0.15s ease", pointerEvents: "none" }}
                    />
                    <g style={{ opacity: isGroupHovered ? 1 : 0.85, transition: "opacity 0.2s" }}>
                      {(group.children || []).map(child => (
                        <rect key={child.cno} x={child.x} y={child.y} width={child.w} height={child.h}
                          fill={getScoreColor(child.score)}
                          stroke={isGroupHovered ? "#faf8f4" : "rgba(255,255,255,0.3)"}
                          strokeWidth={isGroupHovered ? 1 : 0.5} rx={2}
                          style={{ transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)", cursor: "pointer" }}
                          onMouseEnter={() => { setHovered(child); setHoveredGroup(group.sector); }}
                          onMouseLeave={() => { setHovered(null); }}
                          onClick={() => { setSelected(child); setHovered(null); }}
                        />
                      ))}
                    </g>
                    <g style={{ pointerEvents: "none" }}>
                      {(group.w || 0) > 40 && (group.h || 0) > 20 && (
                        <>
                          <rect x={group.x} y={group.y} width={group.w} height={group.h}
                            fill="#000" opacity={isGroupHovered ? 0.05 : 0.3} rx={4}
                            style={{ transition: "opacity 0.2s ease" }}
                          />
                          <text x={(group.x || 0) + (group.w || 0) / 2} y={(group.y || 0) + (group.h || 0) / 2 + 5}
                            textAnchor="middle" fontSize={Math.min(18, Math.max(10, (group.w || 0) / 10))}
                            fontWeight="700" fill="#fff"
                            style={{
                              textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)",
                              opacity: isGroupHovered ? 0.3 : 1, transition: "opacity 0.2s ease"
                            }}>
                            {group.name}
                          </text>
                        </>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
            {hovered && !hovered.isSectorGroup && view === "detailedMap" && <OccupationTooltip item={hovered} mousePos={mousePos} />}
          </div>
          {renderHistogram()}
        </div>
      )}

      {/* SCATTER PLOT */}
      {!selected && view === "scatter" && (() => {
        const plotHeight = 450;
        const maxWage = 65000;
        const minWage = 14000;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, n = 0;
        for (const pt of filtered) {
          sumX += pt.score; sumY += pt.salario;
          sumXY += pt.score * pt.salario; sumXX += pt.score * pt.score; n++;
        }
        const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
        const b = (sumY - m * sumX) / n || 0;
        const getYForScore = (score: number) => {
          let val = m * score + b;
          return plotHeight - ((val - minWage) / (maxWage - minWage)) * plotHeight;
        };
        return (
          <div style={{ padding: "0 24px 32px", maxWidth: 1200, margin: "0 auto" }}>
            <div onMouseLeave={() => setHovered(null)} style={{
              background: "#f5f1eb", border: "1px solid #e0dcd4", borderRadius: 8,
              padding: "20px 20px 40px 60px", position: "relative"
            }}>
              <div style={{ position: "absolute", top: 15, left: 15, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                {t("scatter.avgSalary")}
              </div>
              <div style={{ position: "absolute", bottom: 10, right: 20, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                {t("scatter.iaExposure")}
              </div>
              <svg width="100%" height={plotHeight} style={{ overflow: "visible" }}>
                {[0, 20000, 30000, 40000, 50000, 60000].map(w => {
                  const y = plotHeight - ((w - minWage) / (maxWage - minWage)) * plotHeight;
                  if (y < 0 || y > plotHeight) return null;
                  return (
                    <g key={w}>
                      <line x1={0} y1={y} x2="100%" y2={y} stroke="#e0dcd4" strokeDasharray="4 4" />
                      <text x={-10} y={y + 4} fontSize="10" fill="#aaa" textAnchor="end">{fmt(w)} €</text>
                    </g>
                  );
                })}
                {[0, 2, 4, 6, 8, 10].map(s => {
                  const x = (s / 10) * 100 + "%";
                  return (
                    <g key={s}>
                      <line x1={x} y1={0} x2={x} y2={plotHeight} stroke="#e0dcd4" strokeDasharray="4 4" />
                      <text x={x} y={plotHeight + 20} fontSize="10" fill="#aaa" textAnchor="middle">{s}</text>
                    </g>
                  );
                })}
                {n > 1 && (
                  <g style={{ pointerEvents: "none" }}>
                    <line x1="0%" y1={getYForScore(0)} x2="100%" y2={getYForScore(10)}
                      stroke="#1a1a1a" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
                    <text x="98%" y={getYForScore(10) - 10} fontSize="11" fill="#1a1a1a" opacity="0.6" textAnchor="end" fontWeight="500">
                      {t("scatter.trend")}
                    </text>
                  </g>
                )}
                {[...filtered].sort((a, b) => {
                  if (sortBy === "salario") return a.salario - b.salario;
                  if (sortBy === "score") return a.score - b.score;
                  return a.empleo - b.empleo;
                }).map(d => {
                  const isH = hovered?.cno === d.cno;
                  const x = `${(d.score / 10) * 100}%`;
                  const y = Math.max(0, Math.min(plotHeight, plotHeight - ((d.salario - minWage) / (maxWage - minWage)) * plotHeight));
                  const baseR = sortBy === "empleo" ? Math.sqrt(d.empleo) / 12
                    : sortBy === "salario" ? Math.sqrt(d.salario) / 8
                    : (d.score / 10) * 12 + 3;
                  const r = Math.max(3, Math.min(25, baseR));
                  return (
                    <circle key={d.cno} cx={x} cy={y} r={isH ? r * 1.5 : r}
                      fill={getScoreColor(d.score)} opacity={isH ? 1 : 0.6}
                      stroke={isH ? "#1a1a1a" : "#fff"} strokeWidth={isH ? 2 : 0.5}
                      style={{ transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)", cursor: "pointer" }}
                      onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)}
                      onClick={() => { setSelected(d); setHovered(null); }}
                    />
                  );
                })}
              </svg>
              {hovered && <OccupationTooltip item={hovered} mousePos={mousePos} />}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <span style={{ fontSize: 10, color: "#888" }}>{t("scatter.bubbleNote")}</span>
            </div>
          </div>
        );
      })()}

      {/* LIST */}
      {!selected && view === "list" && (
        <div style={{ padding: "0 24px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[{ k: "score", l: t("list.exposure") }, { k: "empleo", l: t("list.employment") }, { k: "salario", l: t("list.salary") }].map(s => (
              <button key={s.k} onClick={() => setSortBy(s.k)} style={{
                padding: "4px 12px", fontSize: 10, fontFamily: F, fontWeight: 600,
                background: sortBy === s.k ? "#1a1a1a" : "transparent",
                color: sortBy === s.k ? "#faf8f4" : "#aaa",
                border: `1px solid ${sortBy === s.k ? "#1a1a1a" : "#ddd"}`,
                borderRadius: 4, cursor: "pointer", textTransform: "uppercase"
              }}>
                {s.l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "40px 1fr 110px 90px 90px 90px",
              gap: 6, padding: "6px 10px", fontSize: 9, textTransform: "uppercase",
              letterSpacing: "1px", color: "#bbb", fontWeight: 600, borderBottom: "1px solid #e8e4dc"
            }}>
              <div>{t("list.score")}</div><div>{t("list.occupation")}</div><div>{t("list.sector")}</div>
              <div style={{ textAlign: "right" }}>{t("list.employees")}</div>
              <div style={{ textAlign: "right" }}>{t("list.salaryCol")}</div>
              <div style={{ textAlign: "right" }}>{t("list.euAiAct")}</div>
            </div>
            {sorted.map((item, i) => (
              <div key={item.cno} style={{
                display: "grid", gridTemplateColumns: "40px 1fr 110px 90px 90px 90px",
                gap: 6, padding: "8px 10px", fontSize: 12,
                background: i % 2 === 0 ? "#f5f1eb" : "transparent",
                borderRadius: 4, cursor: "pointer", alignItems: "center",
                transition: "background 0.12s"
              }}
                onClick={() => { setSelected(item); }}
                onMouseEnter={e => (e.currentTarget.style.background = "#ede8e0")}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#f5f1eb" : "transparent")}>
                <ScoreBadge score={item.score} />
                <div>
                  <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>CNO {item.cno}</div>
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>{item.sector}</div>
                <div style={{ textAlign: "right", color: "#555", fontVariantNumeric: "tabular-nums" }}>{fmt(item.empleo)}</div>
                <div style={{ textAlign: "right", color: "#555", fontVariantNumeric: "tabular-nums" }}>{fmtE(item.salario)}</div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    fontSize: 9, padding: "2px 7px", borderRadius: 8,
                    background: `${EU_COLORS[item.euRisk]}15`, color: EU_COLORS[item.euRisk], fontWeight: 600
                  }}>
                    {EU_LABELS[item.euRisk]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SENSITIVITY ANALYSIS */}
      <div style={{ padding: "16px 24px 0", maxWidth: 1200, margin: "0 auto", borderTop: "1px solid #e8e4dc" }}>
        <details style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: 12, fontWeight: 600, color: "#666", cursor: "pointer", marginBottom: 8 }}>
            {t("sensitivity.title")}
          </summary>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 8, lineHeight: 1.5 }}>
            {t("sensitivity.description")}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ fontSize: 10, borderCollapse: "collapse", width: "100%", maxWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0dcd4" }}>
                  <th style={{ padding: "6px 10px", textAlign: "left", color: "#999", fontWeight: 600 }}>{t("sensitivity.scenario")}</th>
                  <th style={{ padding: "6px 10px", textAlign: "right", color: "#999", fontWeight: 600 }}>{t("sensitivity.avgExposure")}</th>
                  <th style={{ padding: "6px 10px", textAlign: "right", color: "#999", fontWeight: 600 }}>{t("sensitivity.highExp")}</th>
                  <th style={{ padding: "6px 10px", textAlign: "right", color: "#999", fontWeight: 600 }}>{t("sensitivity.wageIndex")}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [t("sensitivity.baseCal"), stats.ws, stats.hp, stats.tw],
                  [t("sensitivity.allMinus"), stats.ws * 1.20, null, stats.tw * 1.20],
                  [t("sensitivity.allPlus"), stats.ws * 0.80, null, stats.tw * 0.80],
                ].map(([label, avg, pct, tw], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0ece4", background: i === 0 ? "#f9f6f0" : "transparent" }}>
                    <td style={{ padding: "6px 10px", color: i === 0 ? "#1a1a1a" : "#666", fontWeight: i === 0 ? 600 : 400 }}>{label as string}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{(avg as number).toFixed(1)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct !== null ? (pct as number).toFixed(1) + "%" : "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{((tw as number) / 1e9).toFixed(1)}B €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 9, color: "#bbb", marginTop: 6, fontStyle: "italic" }}>
            {t("sensitivity.note")}
          </div>
        </details>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "0 24px 28px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "#bbb", lineHeight: 1.65 }}>
          <strong style={{ color: "#999" }}>{t("methodology.title")}</strong> {t("methodology.text1")} {t("methodology.text2")} {t("methodology.text3")}
          <br />
          <strong style={{ color: "#999" }}>{t("methodology.wageIndexTitle")}</strong> <span dangerouslySetInnerHTML={{ __html: t("methodology.wageIndexText") }} />
          <br />
          <strong style={{ color: "#999" }}>{t("methodology.employmentTitle")}</strong> {t("methodology.employmentText")}
          <br />
          <strong style={{ color: "#999" }}>{t("methodology.internationalTitle")}</strong> {t("methodology.internationalText")}
          <br />
          <strong style={{ color: "#999" }}>{t("methodology.llmTitle")}</strong> <span dangerouslySetInnerHTML={{ __html: t("methodology.llmText") }} /> <a href="https://doi.org/10.5281/zenodo.19076797" target="_blank" rel="noopener noreferrer" style={{ color: "#c8633a", textDecoration: "underline" }}>{t("methodology.fullMethodology")}</a>
          <br />
          <strong style={{ color: "#999" }}>{t("methodology.noteTitle")}</strong> {t("methodology.noteText")}
        </div>
      </div>

      {/* Footer credit */}
      <div style={{ textAlign: "center", padding: "12px 16px 18px", fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 11, color: "#94a3b8", letterSpacing: "0.02em" }}>
        {t("footer.credit")}
      </div>
    </div>
  );
}

// ─── LOADER ─────────────────────────────────────────────────────────────────
export default function Index() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Occupation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lang = i18n.language;

  useEffect(() => {
    setData(null);
    const file = lang === "en" ? "/data/spain_502_v10_final_en.json" : "/data/spain_502_v10_final.json";
    fetch(file)
      .then(r => { if (!r.ok) throw new Error("Failed to load data"); return r.json(); })
      .then((raw: RawOccupation[]) => setData(raw.map(parseOccupation)))
      .catch(e => setError(e.message));
  }, [lang]);

  if (error) return <div style={{ padding: 40, textAlign: "center", color: "#c8633a" }}>{t("error")}: {error}</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>{t("loading")}</div>;
  return <Dashboard data={data} />;
}
