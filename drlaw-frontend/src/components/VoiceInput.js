import React, { useState } from "react";

export default function VoiceInput({ language, addMessage }) {
  const [listening, setListening] = useState(false);

  const toggleVoice = () => {
    if (!listening) {
      addMessage({ who: "bot", text: language === "en" ? "🎤 Listening..." : "🎤 ಕೇಳುತ್ತಿದೆ..." });
    } else {
      addMessage({ who: "user", text: language === "en" ? "Sample voice query" : "ಧ್ವನಿ ಪ್ರಶ್ನೆ ಉದಾಹರಣೆ" });
      setTimeout(() => {
        addMessage({
          who: "bot",
          text: language === "en" ? "Voice answer (mock)." : "ಧ್ವನಿ ಉತ್ತರ (ಕೃತಕ)."
        });
      }, 1000);
    }
    setListening(!listening);
  };

  return (
    <div className="voice-input">
      <button onClick={toggleVoice}>
        {listening ? (language === "en" ? "Stop" : "ನಿಲ್ಲಿಸಿ") : (language === "en" ? "Record" : "ರೆಕಾರ್ಡ್")}
      </button>
    </div>
  );
}
