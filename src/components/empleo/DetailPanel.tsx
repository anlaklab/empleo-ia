import { ScoreBadge } from "./Badge";
import {
  type Occupation, getScoreColor, getScoreLabel,
  fmt, fmtE, EU_LABELS, EU_COLORS, TIPO_LABELS
} from "@/lib/occupationData";

interface DetailProps {
  item: Occupation | null;
  onClose: () => void;
}

export function DetailPanel({ item, onClose }: DetailProps) {
  if (!item) return null;
  const wage = item.empleo * item.salario * (item.score / 10);
  const S = "'Cormorant Garamond', serif";
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 88vw)",
      background: "#faf8f4", borderLeft: "2px solid #e0dcd4", zIndex: 1000,
      padding: "28px 24px", overflowY: "auto",
      animation: "slideR 0.2s ease-out",
      boxShadow: "-12px 0 40px rgba(0,0,0,0.12)",
    }}>
      <style>{`@keyframes slideR{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <button onClick={onClose} style={{
        position: "absolute", top: 12, right: 12, background: "#f0ece4",
        border: "1px solid #d8d4cc", color: "#888", fontSize: 15, cursor: "pointer",
        borderRadius: "50%", width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", marginBottom: 6 }}>
        CNO {item.cno} · {item.sector}
      </div>
      <h2 style={{
        fontSize: 24, fontFamily: S, color: "#1a1a1a",
        margin: "0 0 16px", lineHeight: 1.2, paddingRight: 36, fontWeight: 600
      }}>{item.name}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <ScoreBadge score={item.score} size="lg" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: getScoreColor(item.score) }}>
            Exposición {getScoreLabel(item.score)}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>{item.score.toFixed(1)} / 10</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {([["Empleados", fmt(item.empleo)], ["Salario medio", fmtE(item.salario)]] as const).map(([l, v]) => (
          <div key={l} style={{ padding: 12, background: "#f0ece4", borderRadius: 6 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", fontFamily: S }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 6 }}>Vector de automatización</div>
        <div style={{
          fontSize: 13, color: "#444", lineHeight: 1.5, padding: 10,
          background: "#f0ece4", borderRadius: 5, borderLeft: `3px solid ${getScoreColor(item.score)}`
        }}>{item.vector}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{
          padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
          background: `${EU_COLORS[item.euRisk]}18`, color: EU_COLORS[item.euRisk],
          border: `1px solid ${EU_COLORS[item.euRisk]}33`
        }}>EU AI Act: {EU_LABELS[item.euRisk]}</span>
        <span style={{
          padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
          background: "#f0ece4", color: "#666", border: "1px solid #e0dcd4"
        }}>{TIPO_LABELS[item.tipo]}</span>
      </div>
      <div style={{ padding: 14, background: "#f0ece4", borderRadius: 6 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: 6 }}>Índice masa salarial × exposición</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#c8633a", fontFamily: S }}>
          {wage >= 1e9 ? (wage / 1e9).toFixed(1) + "B €" : (wage / 1e6).toFixed(0) + "M €"}
        </div>
        <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
          Fórmula: {fmt(item.empleo)} × {fmtE(item.salario)} × ({item.score.toFixed(1)}/10)
        </div>
        <div style={{ fontSize: 9, color: "#b08050", marginTop: 4, fontStyle: "italic" }}>
          Índice ponderado, no masa salarial en riesgo
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0ece4", borderRadius: 5, fontSize: 10, color: "#888", lineHeight: 1.5 }}>
        <strong style={{ color: "#999" }}>Fiabilidad:</strong> Puntuación validada inter-modelo (Gemini vs GPT-4o, n=100 estratificadas). κ<sub>w</sub> = 0,667 (acuerdo sustancial). MAD = 1,0 punto.
      </div>
    </div>
  );
}
