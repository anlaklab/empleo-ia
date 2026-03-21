import { getScoreColor } from "@/lib/occupationData";

interface BadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "sm" }: BadgeProps) {
  const c = getScoreColor(score);
  const sz = size === "lg" ? 44 : 24;
  return (
    <div style={{
      width: sz, height: sz, borderRadius: "50%", background: c,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size === "lg" ? 16 : 10, fontWeight: 700,
      color: score > 5 ? "#fff" : "#1a1a1a", flexShrink: 0,
      boxShadow: `0 1px 4px ${c}55`,
    }}>{score.toFixed(1)}</div>
  );
}
