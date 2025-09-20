import React from "react";

export default function LanguageToggle({ language, onChange }) {
  return (
    <div>
      <label>
        <input type="radio" checked={language === "en"} onChange={() => onChange("en")} /> English
      </label>
      <label style={{ marginLeft: "10px" }}>
        <input type="radio" checked={language === "kn"} onChange={() => onChange("kn")} /> ಕನ್ನಡ
      </label>
    </div>
  );
}
