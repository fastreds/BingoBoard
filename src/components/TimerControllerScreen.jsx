import React, { useEffect, useState } from "react";
import { subscribeToRoom, updateTimerState } from "../firebase";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, Clock, Share2, AlertCircle } from "lucide-react";

export default function TimerControllerScreen({ roomId, onLeave }) {
  const [roomData, setRoomData] = useState(() => {
    const cached = localStorage.getItem(`timer-room-${roomId}`);
    return cached ? JSON.parse(cached) : undefined;
  });
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const cached = localStorage.getItem(`timer-room-${roomId}`);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const timerRemaining = data.timerRemaining !== undefined ? data.timerRemaining : 300;
        if (data.timerStatus === "running" && data.timerEndTime) {
          return Math.max(0, Math.round((data.timerEndTime - Date.now()) / 1000));
        }
        return timerRemaining;
      } catch (e) {
        return 300;
      }
    }
    return 300;
  });

  // Suscribirse a la sala en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      setRoomData(data);
      if (data) {
        localStorage.setItem(`timer-room-${roomId}`, JSON.stringify(data));
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const timerDuration = roomData?.timerDuration || 300;
  const timerRemaining = roomData?.timerRemaining !== undefined ? roomData.timerRemaining : 300;
  const timerEndTime = roomData?.timerEndTime || null;
  const timerStatus = roomData?.timerStatus || "idle";

  // Efecto local para la cuenta regresiva en el control
  useEffect(() => {
    if (timerStatus === "running" && timerEndTime) {
      const updateSeconds = () => {
        const remaining = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
        setSecondsLeft(remaining);
      };

      updateSeconds();
      const interval = setInterval(updateSeconds, 200);
      return () => clearInterval(interval);
    } else {
      setSecondsLeft(timerRemaining);
    }
  }, [timerStatus, timerEndTime, timerRemaining]);

  const handleTogglePlay = async () => {
    if (timerStatus === "running") {
      // Pausar
      const remaining = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
      await updateTimerState(roomId, {
        timerStatus: "paused",
        timerEndTime: null,
        timerRemaining: remaining
      });
    } else {
      // Iniciar o reanudar
      const durationToUse = secondsLeft > 0 ? secondsLeft : timerDuration;
      const newEndTime = Date.now() + durationToUse * 1000;
      await updateTimerState(roomId, {
        timerStatus: "running",
        timerEndTime: newEndTime,
        timerRemaining: durationToUse
      });
    }
  };

  const handleReset = async () => {
    await updateTimerState(roomId, {
      timerStatus: "idle",
      timerEndTime: null,
      timerRemaining: timerDuration
    });
  };

  const handleSetPreset = async (minutes) => {
    const duration = minutes * 60;
    await updateTimerState(roomId, {
      timerDuration: duration,
      timerRemaining: duration,
      timerEndTime: null,
      timerStatus: "idle"
    });
  };

  const handleAdjustTime = async (secondsChange) => {
    let newRemaining = secondsLeft + secondsChange;
    if (newRemaining < 0) newRemaining = 0;

    if (timerStatus === "running") {
      const newEndTime = Date.now() + newRemaining * 1000;
      await updateTimerState(roomId, {
        timerRemaining: newRemaining,
        timerEndTime: newEndTime
      });
    } else {
      await updateTimerState(roomId, {
        timerRemaining: newRemaining
      });
    }
  };

  // Formatear segundos en MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    const text = `¡Únete como Expositor o controla el Temporizador en tiempo real! ⏱️\n\nSala: *${roomId}*\n\nEntra aquí:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

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

  return (
    <div className="app-container" style={{ paddingBottom: "60px" }}>
      {/* Cabecera del Control */}
      <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div className="flex-row" style={{ flexWrap: "wrap", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={onLeave}>
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
          <h2>Control de Tiempo: <span style={{ color: "var(--accent-red)" }}>{roomId}</span></h2>
          <button 
            className="btn btn-success"
            onClick={handleShare}
            style={{ 
              padding: "8px 12px", 
              fontSize: "0.85rem",
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              color: "white",
              border: "none",
              boxShadow: "0 4px 10px rgba(37, 211, 102, 0.3)"
            }}
          >
            <Share2 size={14} />
            <span>Compartir</span>
          </button>
        </div>

        <button 
          className="btn btn-danger" 
          onClick={handleReset} 
          title="Reiniciar Temporizador"
          style={{ padding: "10px 16px" }}
        >
          <RotateCcw size={16} />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Contenido Principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        {/* Panel de Estado y Cuenta Regresiva Activa */}
        <div className="glass-panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "20px", width: "100%", justifyContent: "space-around" }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "600" }}>ESTADO</p>
              <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", color: timerStatus === "running" ? "var(--success)" : "var(--warning)" }}>
                {timerStatus === "running" ? "Corriendo" : timerStatus === "paused" ? "Pausado" : "Inactivo"}
              </h3>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "600" }}>TIEMPO DE PRESET</p>
              <h3 style={{ fontSize: "1.5rem" }}>
                {Math.round(timerDuration / 60)} <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>min</span>
              </h3>
            </div>
          </div>

          {/* Gran Reloj en el Control */}
          <div style={{ 
            fontSize: "4rem", 
            fontWeight: "800", 
            margin: "10px 0",
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-red))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontVariantNumeric: "stacked-fractions"
          }}>
            {formatTime(secondsLeft)}
          </div>

          {/* Botón Principal Play / Pause */}
          <button 
            className={`btn ${timerStatus === "running" ? "btn-danger" : "btn-primary"}`}
            onClick={handleTogglePlay}
            style={{ width: "100%", padding: "18px", fontSize: "1.2rem", borderRadius: "16px" }}
          >
            {timerStatus === "running" ? (
              <>
                <Pause size={20} />
                <span>Pausar Temporizador</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Iniciar Temporizador</span>
              </>
            )}
          </button>
        </div>

        {/* Sección de Presets Programados */}
        <div className="glass-panel">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} style={{ color: "var(--accent-blue)" }} />
            Tiempos Programados (Presets)
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
            gap: "12px" 
          }}>
            {[5, 10, 15, 20].map((mins) => {
              const isActive = Math.round(timerDuration / 60) === mins && timerStatus === "idle";
              return (
                <button
                  key={mins}
                  className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => handleSetPreset(mins)}
                  style={{ padding: "16px 8px", fontSize: "1rem", flexDirection: "column", gap: "4px" }}
                >
                  <span style={{ fontSize: "1.3rem", fontWeight: "800" }}>{mins}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", opacity: 0.8 }}>Minutos</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ajustes Finos (Añadir / Restar Tiempo) */}
        <div className="glass-panel">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Ajuste Manual en Tiempo Real</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "16px" }}>
            Agrega o resta tiempo instantáneamente mientras el temporizador está corriendo o en pausa.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Ajustes de Minutos */}
            <div className="flex-col">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>MINUTOS</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAdjustTime(-60)}
                  style={{ flex: 1, padding: "12px 0" }}
                >
                  <Minus size={16} />
                  <span>-1 Min</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAdjustTime(60)}
                  style={{ flex: 1, padding: "12px 0" }}
                >
                  <Plus size={16} />
                  <span>+1 Min</span>
                </button>
              </div>
            </div>

            {/* Ajustes de Segundos */}
            <div className="flex-col">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>SEGUNDOS</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAdjustTime(-10)}
                  style={{ flex: 1, padding: "12px 0" }}
                >
                  <Minus size={16} />
                  <span>-10s</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAdjustTime(10)}
                  style={{ flex: 1, padding: "12px 0" }}
                >
                  <Plus size={16} />
                  <span>+10s</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
