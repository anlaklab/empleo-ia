import { ScoreBadge } from "./Badge";
import {
  type Occupation, fmt, fmtE,
  EU_LABELS, EU_COLORS
} from "@/lib/occupationData";

interface TooltipProps {
  item: Occupation | null;
  mousePos: { x: number; y: number };
}

export function OccupationTooltip({ item, mousePos }: TooltipProps) {
  if (!item) return null;
  const S = "'Cormorant Garamond', serif";
  return (
    <div style={{
      position: "fixed",
      left: Math.max(16, mousePos.x + 300 > window.innerWidth ? mousePos.x - 300 : mousePos.x + 20),
      top: Math.max(16, mousePos.y + 420 > window.innerHeight ? mousePos.y - 400 : mousePos.y + 20),
      background: "rgba(22, 22, 24, 0.96)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
      padding: "16px 20px", width: 280, pointerEvents: "none",
      boxShadow: "0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.5)", zIndex: 9999,
      color: "#f5f1eb", animation: "fadeIn 0.15s ease-out"
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", color: "#a09b93", letterSpacing: "1px", marginBottom: 4 }}>
            {item.isSectorGroup ? "Sector" : `CNO ${item.cno} · ${item.sector}`}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: S, lineHeight: 1.15, paddingRight: 8 }}>
            {item.isSectorGroup ? item.name.replace("Sector ", "") : item.name}
          </div>
        </div>
        <ScoreBadge score={item.score} size="lg" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: "#a09b93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{item.isSectorGroup ? "Empleos totales" : "Empleados"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: S }}>{fmt(item.empleo)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: "#a09b93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{item.isSectorGroup ? "Salario medio" : "Salario"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: S }}>{fmtE(item.salario)}</div>
        </div>
      </div>
      {!item.isSectorGroup && (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", flexDirection: "column" }}>
            <span style={{ display: "inline-block", width: "fit-content", fontSize: 9, padding: "4px 8px", borderRadius: 4, background: `${EU_COLORS[item.euRisk]}30`, color: EU_COLORS[item.euRisk], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}><span style={{ opacity: 0.6, marginRight: 6 }}>Riesgo EU AI Act:</span>{EU_LABELS[item.euRisk]}</span>
            <span style={{ display: "inline-block", width: "fit-content", fontSize: 9, padding: "4px 8px", borderRadius: 4, background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}><span style={{ opacity: 0.6, marginRight: 6 }}>Tipo Impacto:</span>{item.tipo === "replace" ? "Sustitución" : item.tipo === "augment" ? "Aumentación" : "Híbrido"}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)", padding: "12px", borderRadius: 8, marginBottom: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 9, color: "#a09b93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>Índice masa salarial × exposición</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: S, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>{fmtE(item.empleo * item.salario * (item.score / 10))}</div>
          </div>
          <div style={{ fontSize: 9, color: "#a09b93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Vector Autom.</div>
          <div style={{ fontSize: 12, color: "#d8d4cc", lineHeight: 1.3 }}>{item.vector}</div>
        </div>
      )}
      {item.isSectorGroup && (
        <div style={{ fontSize: 10, textAlign: "center", color: "#888", marginTop: 12, fontStyle: "italic" }}>
          Click para inspeccionar {item.ocupaciones} ocupaciones en este sector
        </div>
      )}
    </div>
  );
}
