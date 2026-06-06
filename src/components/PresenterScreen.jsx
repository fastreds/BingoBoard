import React, { useEffect, useState, useRef } from "react";
import { subscribeToRoom } from "../firebase";
import { Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Award } from "lucide-react";
import { getRandomPhrase } from "../utils/bingoPhrases";

// Obtener una voz en español latino disponible en el navegador
const getLatinVoice = () => {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const latinLocales = ["es-mx", "es-us", "es-419", "es-co", "es-ar", "es-cl", "es-pe", "es-ve"];
  
  // 1. Intentar encontrar coincidencia exacta con locales latinos
  for (const locale of latinLocales) {
    const voice = voices.find(v => v.lang.toLowerCase() === locale || v.lang.toLowerCase().startsWith(locale));
    if (voice) return voice;
  }
  
  // 2. Buscar cualquier voz en español que no sea de España
  const latinFallback = voices.find(v => v.lang.toLowerCase().startsWith("es") && !v.lang.toLowerCase().includes("es-es"));
  if (latinFallback) return latinFallback;
  
  // 3. Fallar a la primera voz en español que haya
  return voices.find(v => v.lang.toLowerCase().startsWith("es")) || null;
};

export default function PresenterScreen({ roomId, onLeave }) {
  const [roomData, setRoomData] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callingStyle, setCallingStyle] = useState("jocoso");
  const prevLastDrawn = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      setRoomData(data);
    });
    return () => unsubscribe();
  }, [roomId]);

  const lastDrawn = roomData?.lastDrawn || null;
  const drawnNumbers = roomData?.drawnNumbers || [];
  const winningPattern = roomData?.winningPattern || "Full Card";

  // Función para obtener la letra del bingo
  const getBingoLetter = (num) => {
    if (num >= 1 && num <= 15) return "B";
    if (num >= 16 && num <= 30) return "I";
    if (num >= 31 && num <= 45) return "N";
    if (num >= 46 && num <= 60) return "G";
    if (num >= 61 && num <= 75) return "O";
    return "";
  };

  // Cantar número usando SpeechSynthesis con la frase local sin latencia
  useEffect(() => {
    const speakDrawnNumber = () => {
      if (lastDrawn && lastDrawn !== prevLastDrawn.current) {
        if (!isMuted) {
          // Cancelar discursos anteriores para evitar amontonamiento
          window.speechSynthesis.cancel();
          
          const phrase = getRandomPhrase(lastDrawn, callingStyle);
          
          const utterance = new SpeechSynthesisUtterance(phrase);
          const voice = getLatinVoice();
          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
          } else {
            utterance.lang = "es-MX"; // Fallback general latino
          }
          utterance.rate = 0.95; // Velocidad de habla natural
          window.speechSynthesis.speak(utterance);
        }
        prevLastDrawn.current = lastDrawn;
      }
    };

    speakDrawnNumber();
  }, [lastDrawn, isMuted, callingStyle]);

  // Manejar pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Escuchar cambios de fullscreen del navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Rangos de números
  const rows = [
    { letter: "B", min: 1, max: 15 },
    { letter: "I", min: 16, max: 30 },
    { letter: "N", min: 31, max: 45 },
    { letter: "G", min: 46, max: 60 },
    { letter: "O", min: 61, max: 75 },
  ];

  // Últimos 5 números cantados (excluyendo el más reciente si se quiere, o incluyéndolo)
  const getRecentNumbers = () => {
    if (drawnNumbers.length <= 1) return [];
    // Retorna los anteriores en orden inverso (más recientes primero)
    const list = [...drawnNumbers];
    list.pop(); // quitar el actual
    return list.reverse().slice(0, 5);
  };

  const recentList = getRecentNumbers();

  return (
    <div className="presenter-layout">
      {/* Cabecera */}
      <div className="presenter-header">
        <div className="flex-row">
          <button className="btn btn-secondary" onClick={onLeave}>
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
          <h2 style={{ fontSize: "1.5rem" }}>Sala: <span style={{ color: "var(--accent-blue)" }}>{roomId}</span></h2>
        </div>

        <div className="flex-row">
          <div className="badge badge-red flex-row" style={{ gap: "4px", fontSize: "0.85rem", padding: "8px 12px" }}>
            <Award size={16} />
            <span>Patrón: {winningPattern}</span>
          </div>

          <div className="flex-row" style={{ gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Estilo:</span>
            <select
              value={callingStyle}
              onChange={(e) => setCallingStyle(e.target.value)}
              className="input-field"
              style={{ 
                padding: "6px 12px", 
                fontSize: "0.8rem", 
                height: "38px", 
                cursor: "pointer", 
                background: "rgba(22, 28, 46, 0.8)", 
                border: "1px solid var(--glass-border)", 
                color: "white", 
                borderRadius: "10px" 
              }}
            >
              <option value="jocoso" style={{ background: "var(--bg-secondary)" }}>Tico Jocoso</option>
              <option value="melodico" style={{ background: "var(--bg-secondary)" }}>Melódico</option>
              <option value="tradicional" style={{ background: "var(--bg-secondary)" }}>Tradicional</option>
            </select>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Activar Voz" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={18} style={{ color: "var(--danger)" }} /> : <Volume2 size={18} style={{ color: "var(--success)" }} />}
            <span>{isMuted ? "Voz Desactivada" : "Voz Activada"}</span>
          </button>

          <button className="btn btn-secondary" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span>{isFullscreen ? "Salir Completa" : "Pantalla Completa"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="presenter-main">
        {/* Panel lateral */}
        <div className="presenter-sidebar">
          {/* Número Gigante */}
          <div className="giant-number-card">
            {lastDrawn ? (
              <>
                <span className="giant-letter">{getBingoLetter(lastDrawn)}</span>
                <span className="giant-number">{lastDrawn}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", zIndex: 1 }}>
                  Número Cantado
                </span>
              </>
            ) : (
              <>
                <span className="giant-letter" style={{ color: "var(--text-secondary)" }}>BINGO</span>
                <span className="giant-number" style={{ fontSize: "5rem" }}>--</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Esperando número...
                </span>
              </>
            )}
          </div>

          {/* Últimos números cantados */}
          {recentList.length > 0 && (
            <div className="recent-numbers-card">
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Anteriores:</h4>
              <div className="recent-list">
                {recentList.map((num) => (
                  <div key={num} className="recent-item">
                    <span style={{ fontSize: "0.6rem", display: "block", color: "var(--accent-red)", lineHeight: 1 }}>
                      {getBingoLetter(num)}
                    </span>
                    <span style={{ lineHeight: 1 }}>{num}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tablero de 75 Números */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "16px" }}>
          <div className="bingo-grid">
            {rows.map((row) => {
              // Generar los números del rango
              const rowNumbers = [];
              for (let i = row.min; i <= row.max; i++) {
                rowNumbers.push(i);
              }

              return (
                <React.Fragment key={row.letter}>
                  {/* Celda de la letra */}
                  <div className="letter-cell">{row.letter}</div>
                  
                  {/* Celdas de números */}
                  {rowNumbers.map((num) => {
                    const isDrawn = drawnNumbers.includes(num);
                    return (
                      <div 
                        key={num} 
                        className={`number-cell ${isDrawn ? "drawn" : ""}`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
