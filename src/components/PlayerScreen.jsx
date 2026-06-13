import React, { useEffect, useState } from "react";
import { subscribeToRoom, claimBingo } from "../firebase";
import { generarCarton, checkPatternMatch } from "../utils/bingoGenerator";
import { logEvent } from "../utils/logger";
import { Award, RefreshCw, Trophy, AlertCircle, ArrowLeft, Plus, X } from "lucide-react";

export default function PlayerScreen({ roomId, playerName, onLeave }) {
  const [roomData, setRoomData] = useState(undefined);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  
  // Arreglo de cartones [{ id, seed, marked: [25 bools] }]
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem(`bingo-cards-${roomId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to load cards from localStorage", e);
      }
    }
    // Si no hay guardado, inicializar con un único cartón
    const initialSeed = Math.floor(Math.random() * 1000) + 1;
    const initialMarked = Array(25).fill(false);
    initialMarked[12] = true; // FREE marcado
    return [{ id: Date.now(), seed: initialSeed, marked: initialMarked }];
  });

  // Guardar cartones en localStorage
  useEffect(() => {
    localStorage.setItem(`bingo-cards-${roomId}`, JSON.stringify(cards));
  }, [cards, roomId]);

  // Suscribirse a la sala
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
  const winningPattern = roomData.winningPattern || "Full Card";
  const lastDrawn = roomData.lastDrawn || null;
  const claims = roomData.claims || [];

  // Agregar nuevo cartón (máximo 3)
  const handleAddCard = () => {
    if (cards.length >= 3) {
      alert("Solo puedes tener un máximo de 3 cartones activos a la vez.");
      return;
    }
    const newSeed = Math.floor(Math.random() * 1000) + 1;
    const initialMarked = Array(25).fill(false);
    initialMarked[12] = true; // FREE marcado
    
    const newCard = {
      id: Date.now(),
      seed: newSeed,
      marked: initialMarked
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    setActiveTabIdx(updatedCards.length - 1);
    
    logEvent("player", "add_card", `${roomId} - ${playerName} - seed: ${newSeed}`);
  };

  // Remover cartón
  const handleRemoveCard = (idx) => {
    if (cards.length <= 1) {
      alert("Debes tener al menos 1 cartón activo.");
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el Cartón ${idx + 1}? Perderás sus marcas.`)) {
      const updatedCards = cards.filter((_, i) => i !== idx);
      setCards(updatedCards);
      
      // Ajustar la pestaña activa
      if (activeTabIdx >= updatedCards.length) {
        setActiveTabIdx(updatedCards.length - 1);
      } else if (activeTabIdx === idx) {
        setActiveTabIdx(0);
      }
      
      logEvent("player", "remove_card", `${roomId} - ${playerName} - index: ${idx}`);
    }
  };

  // Cambiar marcas de celdas en el cartón activo
  const handleCellClick = (cellIdx) => {
    if (cellIdx === 12) return; // Celda FREE no se puede desmarcar
    const updatedCards = [...cards];
    updatedCards[activeTabIdx].marked[cellIdx] = !updatedCards[activeTabIdx].marked[cellIdx];
    setCards(updatedCards);
  };

  // Regenerar semilla del cartón activo (Nuevo cartón)
  const handleRegenCard = () => {
    if (window.confirm("¿Quieres cambiar el número semilla de este cartón? Se borrarán sus marcas.")) {
      const newSeed = Math.floor(Math.random() * 1000) + 1;
      const initialMarked = Array(25).fill(false);
      initialMarked[12] = true; // FREE marcado
      
      const updatedCards = [...cards];
      updatedCards[activeTabIdx] = {
        ...updatedCards[activeTabIdx],
        seed: newSeed,
        marked: initialMarked
      };
      setCards(updatedCards);
      logEvent("player", "regenerate_card", `${roomId} - ${playerName} - seed: ${newSeed}`);
    }
  };

  // Cartón y datos activos
  const activeCard = cards[activeTabIdx] || cards[0];
  const carton = generarCarton(activeCard.seed);
  const flatCarton = carton.flat();
  const marked = activeCard.marked;

  // Comprobar patrón de victoria
  const hasWonOfficially = checkPatternMatch(carton, drawnNumbers, winningPattern);

  // Enviar reclamo
  const handleClaimBingo = async () => {
    const seed = activeCard.seed;
    const alreadyClaimed = claims.some(c => c.name === playerName && c.seed === seed && !c.verified);
    if (alreadyClaimed) {
      alert("Ya has enviado un reclamo para este cartón. Espera la verificación.");
      return;
    }
    
    try {
      await claimBingo(roomId, playerName, seed);
      logEvent("player", "claim_bingo", `${roomId} - ${playerName} - seed: ${seed}`, { hasWonOfficially });
      alert("¡Reclamo enviado! El moderador verificará tu cartón.");
    } catch (e) {
      console.error(e);
      alert("Error al reclamar. Intenta nuevamente.");
    }
  };

  // Buscar el estado de mi reclamo para el cartón activo
  const myClaims = claims.filter(c => c.name === playerName && c.seed === activeCard.seed);
  const latestClaim = myClaims.length > 0 ? myClaims[myClaims.length - 1] : null;

  return (
    <div className="app-container" style={{ paddingBottom: "40px" }}>
      {/* Cabecera */}
      <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="flex-row">
          <button className="btn btn-secondary" onClick={onLeave}>
            <ArrowLeft size={18} />
            <span>Salir</span>
          </button>
          <h3>Sala: <span style={{ color: "var(--accent-blue)" }}>{roomId}</span></h3>
        </div>
        <div className="badge badge-blue">
          Jugador: {playerName}
        </div>
      </div>

      <div className="player-card-container">
        {/* Último número cantado de guía */}
        <div className="glass-panel" style={{ width: "100%", textAlign: "center", padding: "12px 16px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>ÚLTIMO NÚMERO OFICIAL</p>
          <h2 style={{ fontSize: "2rem", color: "var(--success)" }}>
            {lastDrawn ? lastDrawn : "Ninguno aún"}
          </h2>
          <div className="badge badge-red" style={{ marginTop: "8px", display: "inline-flex", gap: "4px" }}>
            <Award size={12} />
            <span>Patrón: {winningPattern}</span>
          </div>
        </div>

        {/* Info Reclamos */}
        {latestClaim && (
          <div className="glass-panel" style={{ 
            width: "100%", 
            border: `1px solid ${latestClaim.verified ? (latestClaim.approved ? "var(--success)" : "var(--danger)") : "var(--accent-red)"}`,
            background: "rgba(255,255,255,0.02)",
            textAlign: "center",
            padding: "12px"
          }}>
            <p style={{ fontWeight: "bold" }}>Reclamo de Bingo:</p>
            {latestClaim.verified ? (
              <h4 style={{ color: latestClaim.approved ? "var(--success)" : "var(--danger)", marginTop: "4px" }}>
                {latestClaim.approved ? "🏆 ¡BINGO APROBADO!" : "✗ Bingo Rechazado (Sigue jugando)"}
              </h4>
            ) : (
              <p style={{ color: "var(--accent-red)", fontSize: "0.9rem", marginTop: "4px", animation: "popIn 1s infinite alternate" }}>
                ⌛ Pendiente de validación...
              </p>
            )}
          </div>
        )}

        {/* Pestañas de Navegación de Cartones (Móvil Adaptable) */}
        <div style={{ display: "flex", gap: "8px", width: "100%", overflowX: "auto", padding: "4px 0", alignItems: "center" }}>
          {cards.map((card, idx) => {
            const cardWon = checkPatternMatch(generarCarton(card.seed), drawnNumbers, winningPattern);
            return (
              <div 
                key={card.id}
                style={{ position: "relative", display: "flex", alignItems: "center" }}
              >
                <button
                  onClick={() => setActiveTabIdx(idx)}
                  className="btn"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    background: activeTabIdx === idx 
                      ? "linear-gradient(135deg, var(--accent-blue), var(--accent-red))" 
                      : "rgba(255, 255, 255, 0.05)",
                    border: activeTabIdx === idx ? "none" : "1px solid var(--glass-border)",
                    color: "white",
                    borderRadius: "10px",
                    boxShadow: activeTabIdx === idx ? "0 4px 10px rgba(59, 130, 246, 0.3)" : "none",
                    paddingRight: cards.length > 1 ? "34px" : "16px"
                  }}
                >
                  Cartón {idx + 1}
                  {cardWon && (
                    <span 
                      style={{ 
                        width: "6px", 
                        height: "6px", 
                        borderRadius: "50%", 
                        backgroundColor: "var(--accent-red)", 
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        boxShadow: "0 0 6px var(--accent-pink)"
                      }}
                    />
                  )}
                </button>
                
                {/* Eliminar Cartón */}
                {cards.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(idx);
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      background: "none",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.6)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      borderRadius: "50%"
                    }}
                    title="Eliminar cartón"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Botón Añadir */}
          {cards.length < 3 && (
            <button
              onClick={handleAddCard}
              className="btn btn-secondary"
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Plus size={14} />
              <span>Añadir</span>
            </button>
          )}
        </div>

        {/* Título de Cartón Seleccionado */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginTop: "10px" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Semilla: <strong>{activeCard.seed}</strong>
          </span>
          <button 
            className="btn btn-secondary" 
            onClick={handleRegenCard}
            style={{ padding: "6px 10px", fontSize: "0.75rem", gap: "4px" }}
          >
            <RefreshCw size={12} />
            Cambiar Números
          </button>
        </div>

        {/* Cuadrícula de Cartón Bingo */}
        <div className="bingo-card-grid">
          {/* Cabecera del Cartón: B I N G O */}
          {["B", "I", "N", "G", "O"].map(letter => (
            <div 
              key={letter} 
              style={{ 
                textAlign: "center", 
                fontWeight: "800", 
                fontSize: "1.2rem", 
                color: "var(--accent-red)",
                paddingBottom: "8px"
              }}
            >
              {letter}
            </div>
          ))}

          {/* Números del Cartón */}
          {flatCarton.map((val, idx) => {
            const isFree = val === "FREE";
            const isMarked = marked[cellIdx => cellIdx] || marked[idx];
            // Verificar si este número ya fue cantado oficialmente
            const isOfficial = !isFree && drawnNumbers.includes(val);

            return (
              <div 
                key={idx}
                className={`card-cell ${isFree ? "free-cell" : ""} ${isMarked ? "marked" : ""} ${isOfficial ? "official-drawn" : ""}`}
                onClick={() => handleCellClick(idx)}
              >
                {val}
              </div>
            );
          })}
        </div>

        {/* Guía Visual */}
        <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "var(--text-secondary)", width: "100%", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-blue)", display: "inline-block" }}></span>
            <span>Marcado</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block", boxShadow: "0 0 4px var(--success)" }}></span>
            <span>Cantado Oficial</span>
          </div>
        </div>

        {/* Botón de Reclamo */}
        <button 
          className={`btn ${hasWonOfficially ? "btn-primary" : "btn-secondary"}`}
          onClick={handleClaimBingo}
          style={{ 
            width: "100%", 
            padding: "16px", 
            fontSize: "1.1rem", 
            marginTop: "10px",
            border: hasWonOfficially ? "none" : "1px solid var(--glass-border)",
            background: hasWonOfficially ? "linear-gradient(135deg, var(--accent-blue), var(--accent-red))" : "rgba(255,255,255,0.03)",
            boxShadow: hasWonOfficially ? "0 0 20px rgba(236, 72, 153, 0.4)" : "none"
          }}
        >
          <Trophy size={20} />
          {hasWonOfficially ? `¡RECLAMAR BINGO (CARTÓN ${activeTabIdx + 1})!` : "Reclamar BINGO"}
        </button>

        {/* Alerta de autocompletado si ganaron en el backend */}
        {hasWonOfficially && (
          <div className="flex-row" style={{ color: "#34d399", fontSize: "0.85rem", gap: "6px", width: "100%", justifyContent: "center" }}>
            <AlertCircle size={14} />
            <span>¡Este cartón coincide con el patrón! Haz clic en Reclamar.</span>
          </div>
        )}

      </div>
    </div>
  );
}
