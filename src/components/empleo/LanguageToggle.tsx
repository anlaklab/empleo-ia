import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  return (
    <button
      onClick={() => i18n.changeLanguage(isEn ? "es" : "en")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 0,
        background: "#f0ece4", border: "1px solid #d8d4cc", borderRadius: 16,
        padding: 2, cursor: "pointer", fontSize: 11, fontWeight: 600,
        lineHeight: 1,
      }}
      title={isEn ? "Cambiar a español" : "Switch to English"}
    >
      <span style={{
        padding: "4px 10px", borderRadius: 14,
        background: !isEn ? "#1a1a1a" : "transparent",
        color: !isEn ? "#faf8f4" : "#999",
        transition: "all 0.15s",
      }}>ES</span>
      <span style={{
        padding: "4px 10px", borderRadius: 14,
        background: isEn ? "#1a1a1a" : "transparent",
        color: isEn ? "#faf8f4" : "#999",
        transition: "all 0.15s",
      }}>EN</span>
    </button>
  );
}
