import React, { useEffect, useState } from "react";
import { 
  subscribeToRoom, 
  drawNumber, 
  toggleNumberInRoom, 
  resetRoom, 
  setWinningPattern,
  updateClaimStatus
} from "../firebase";
import { generarCarton, checkPatternMatch } from "../utils/bingoGenerator";
import { 
  Shuffle, 
  RotateCcw, 
  Check, 
  X, 
  ArrowLeft, 
  Settings, 
  Plus, 
  Smartphone, 
  Award,
  AlertCircle,
  Share2
} from "lucide-react";
import { logEvent } from "../utils/logger";

export default function ControllerScreen({ roomId, onLeave }) {
  const [roomData, setRoomData] = useState(undefined);
  const [manualNumber, setManualNumber] = useState("");
  const [verifyingClaim, setVerifyingClaim] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      setRoomData(data);
    });
    return () => unsubscribe();
  }, [roomId]);

  if (roomData === undefined) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="glass-panel">Cargando sala {roomId}...</div>
      </div>
    );
  }

  if (roomData === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="glass-panel" style={{ textAlign: "center", maxWidth: "400px" }}>
          <AlertCircle size={48} style={{ color: "var(--danger)", marginBottom: "16px", display: "inline-block" }} />
          <h3 style={{ marginBottom: "8px" }}>La sala no existe</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            La sala <strong>{roomId}</strong> no existe o ha sido eliminada.
          </p>
          <button className="btn btn-primary" onClick={onLeave} style={{ width: "100%" }}>
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const drawnNumbers = roomData.drawnNumbers || [];
  const lastDrawn = roomData.lastDrawn || null;
  const winningPattern = roomData.winningPattern || "Full Card";
  const claims = roomData.claims || [];

  // Cantar número aleatorio de los pendientes
  const handleDrawRandom = async () => {
    const pending = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !drawnNumbers.includes(n));
    if (pending.length === 0) {
      alert("¡Todos los números han sido cantados!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * pending.length);
    const num = pending[randomIndex];
    await drawNumber(roomId, num);
    logEvent("game", "draw_number", `${roomId} - ${num}`, { type: "random" });
  };

  // Agregar número manual
  const handleAddManual = async (e) => {
    e.preventDefault();
    const num = parseInt(manualNumber);
    if (isNaN(num) || num < 1 || num > 75) {
      alert("Ingresa un número válido entre 1 y 75.");
      return;
    }
    if (drawnNumbers.includes(num)) {
      alert("Este número ya fue cantado.");
      return;
    }
    await drawNumber(roomId, num);
    logEvent("game", "draw_number", `${roomId} - ${num}`, { type: "manual" });
    setManualNumber("");
  };

  // Cambiar el número al hacer clic en el tablero manual
  const handleCellClick = async (num) => {
    await toggleNumberInRoom(roomId, num);
  };

  // Reiniciar juego
  const handleReset = async () => {
    if (window.confirm("¿Estás seguro de reiniciar todo el tablero de esta sala?")) {
      await resetRoom(roomId);
      setVerifyingClaim(null);
    }
  };

  // Cambiar patrón
  const handlePatternChange = async (e) => {
    await setWinningPattern(roomId, e.target.value);
  };

  // Acciones sobre reclamos de Bingo
  const handleResolveClaim = async (index, approve) => {
    const updatedClaims = [...claims];
    updatedClaims[index] = {
      ...updatedClaims[index],
      verified: true,
      approved: approve
    };
    await updateClaimStatus(roomId, claims, updatedClaims);
    logEvent("game", "resolve_claim", `${roomId} - ${claims[index].name}`, { approved: approve, seed: claims[index].seed });
    setVerifyingClaim(null);
  };

  // Validar si el cartón de la reclamación cumple el patrón
  const checkClaimValidity = (claim) => {
    const playerCarton = generarCarton(claim.seed);
    return checkPatternMatch(playerCarton, drawnNumbers, winningPattern);
  };

  const patterns = [
    "Full Card",
    "Row",
    "Column",
    "Diagonal",
    "Corners",
    "L Shape",
    "X Shape"
  ];

  return (
    <div className="app-container" style={{ paddingBottom: "60px" }}>
      {/* Cabecera */}
      <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div className="flex-row" style={{ flexWrap: "wrap", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={onLeave}>
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
          <h2>Control: <span style={{ color: "var(--accent-red)" }}>{roomId}</span></h2>
          <button 
            className="btn"
            onClick={() => {
              const shareUrl = `${window.location.origin}/?room=${roomId}`;
              const text = `¡Únete a mi partida de Bingo en tiempo real! 🎲\n\nCódigo de sala: *${roomId}*\n\nEntra aquí:\n${shareUrl}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            }}
            style={{ 
              padding: "8px 12px", 
              fontSize: "0.85rem",
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              color: "white",
              border: "none",
              boxShadow: "0 4px 10px rgba(37, 211, 102, 0.3)"
            }}
            title="Compartir por WhatsApp"
          >
            <Share2 size={14} />
            <span>Compartir</span>
          </button>
        </div>

        <button className="btn btn-danger" onClick={handleReset} title="Reiniciar Juego">
          <RotateCcw size={16} />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Contenido Principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        
        {/* Fila superior: Acciones Rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {/* Panel de Botón Cantar */}
          <div className="glass-panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "20px", width: "100%", justifyContent: "space-around" }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>CANTADOS</p>
                <h3 style={{ fontSize: "2rem" }}>{drawnNumbers.length} <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>/ 75</span></h3>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>ÚLTIMO NÚMERO</p>
                <h3 style={{ fontSize: "2rem", color: "var(--accent-red)" }}>{lastDrawn ? lastDrawn : "--"}</h3>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleDrawRandom}
              style={{ width: "100%", padding: "20px", fontSize: "1.25rem", borderRadius: "16px" }}
            >
              <Shuffle size={24} />
              Cantar Número Aleatorio
            </button>
          </div>

          {/* Configuración del Patrón y Manual Input */}
          <div className="glass-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            
            {/* Configurar Patrón */}
            <div className="flex-col" style={{ justifyContent: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                PATRÓN DE VICTORIA ACTIVO
              </label>
              <div style={{ position: "relative" }}>
                <select 
                  className="input-field" 
                  value={winningPattern}
                  onChange={handlePatternChange}
                  style={{ width: "100%", cursor: "pointer", paddingRight: "30px", appearance: "none" }}
                >
                  {patterns.map(p => (
                    <option key={p} value={p} style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>{p}</option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <Award size={16} style={{ color: "var(--accent-blue)" }} />
                </div>
              </div>
            </div>

            {/* Agregar Manual */}
            <form onSubmit={handleAddManual} className="flex-col" style={{ justifyContent: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                CANTAR NÚMERO MANUALMENTE
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="1-75"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  min="1"
                  max="75"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "12px" }}>
                  <Plus size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sección de Reclamos de Bingo */}
        {claims.length > 0 && (
          <div className="glass-panel" style={{ border: "1px solid rgba(236, 72, 153, 0.3)" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-red)", display: "inline-block", animation: "popIn 1s infinite alternate" }}></span>
              Reclamos de Bingo Recibidos ({claims.filter(c => !c.verified).length} pendientes)
            </h3>
            
            <div className="flex-col" style={{ gap: "10px" }}>
              {claims.map((claim, idx) => {
                const isValid = checkClaimValidity(claim);
                return (
                  <div 
                    key={idx} 
                    className="glass-panel" 
                    style={{ 
                      padding: "12px 16px", 
                      background: "rgba(255,255,255,0.02)", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      borderLeft: `4px solid ${claim.verified ? (claim.approved ? "var(--success)" : "var(--danger)") : "var(--accent-red)"}`
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: "1.1rem" }}>{claim.name}</h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        Semilla: <strong>{claim.seed}</strong> | {new Date(claim.timestamp).toLocaleTimeString()}
                      </p>
                      {claim.verified ? (
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: claim.approved ? "var(--success)" : "var(--danger)" }}>
                          {claim.approved ? "✓ BINGO Aprobado" : "✗ BINGO Rechazado"}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: isValid ? "#34d399" : "#f87171", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <AlertCircle size={12} />
                          {isValid ? "Validador: Patrón correcto" : "Validador: Patrón incompleto"}
                        </span>
                      )}
                    </div>

                    <div className="flex-row">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setVerifyingClaim({ claim, index: idx })}
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      >
                        Ver Cartón
                      </button>
                      {!claim.verified && (
                        <>
                          <button 
                            className="btn btn-success" 
                            onClick={() => handleResolveClaim(idx, true)}
                            style={{ padding: "8px", borderRadius: "8px" }}
                            title="Aprobar"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleResolveClaim(idx, false)}
                            style={{ padding: "8px", borderRadius: "8px" }}
                            title="Rechazar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal de Validación de Cartón */}
        {verifyingClaim && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(11, 15, 25, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
            padding: "20px"
          }}>
            <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
              <button 
                onClick={() => setVerifyingClaim(null)} 
                style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Cartón de {verifyingClaim.claim.name}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                Semilla: <strong>{verifyingClaim.claim.seed}</strong> | Patrón: <strong>{winningPattern}</strong>
              </p>

              {/* Grid del cartón generado */}
              <div className="bingo-card-grid" style={{ marginBottom: "20px" }}>
                {generarCarton(verifyingClaim.claim.seed).map((row, rIdx) => 
                  row.map((val, cIdx) => {
                    const isFree = val === "FREE";
                    const isDrawn = isFree || drawnNumbers.includes(val);
                    return (
                      <div 
                        key={`${rIdx}-${cIdx}`} 
                        className={`card-cell ${isFree ? "free-cell" : ""} ${isDrawn ? "marked" : ""}`}
                        style={{ fontSize: "1rem" }}
                      >
                        {val}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ textAlign: "center", fontSize: "0.95rem", marginBottom: "20px", fontWeight: "bold" }}>
                Resultado:{" "}
                <span style={{ color: checkClaimValidity(verifyingClaim.claim) ? "var(--success)" : "var(--danger)" }}>
                  {checkClaimValidity(verifyingClaim.claim) ? "¡VÁLIDO! Patrón completado" : "¡INVÁLIDO! Faltan números"}
                </span>
              </div>

              {!verifyingClaim.claim.verified && (
                <div className="grid-cols-2">
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleResolveClaim(verifyingClaim.index, true)}
                  >
                    Aprobar Bingo
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleResolveClaim(verifyingClaim.index, false)}
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tablero interactivo rápido (Toggles manuales de 75 números) */}
        <div className="glass-panel">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Tablero de Control Manual</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "16px" }}>
            Haz clic en cualquier número para cantarlo o cancelarlo directamente en tiempo real.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {["B", "I", "N", "G", "O"].map((letter, letterIdx) => {
              const start = letterIdx * 15 + 1;
              const end = start + 14;
              const numbers = Array.from({ length: 15 }, (_, idx) => start + idx);
              
              return (
                <div key={letter} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <div style={{ 
                    width: "36px", 
                    height: "36px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-red))", 
                    borderRadius: "6px",
                    fontWeight: "bold",
                    color: "white",
                    fontSize: "0.9rem"
                  }}>
                    {letter}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: "4px", flex: 1 }}>
                    {numbers.map(num => {
                      const isDrawn = drawnNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          onClick={() => handleCellClick(num)}
                          style={{
                            aspectRatio: "1",
                            padding: 0,
                            border: "1px solid var(--glass-border)",
                            background: isDrawn ? "var(--cell-drawn)" : "rgba(255,255,255,0.03)",
                            color: isDrawn ? "white" : "var(--text-secondary)",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                          title={`Número ${num}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
