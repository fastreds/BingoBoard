import React, { useEffect, useState, useRef } from "react";
import { subscribeToRoom } from "../../../shared/firebase";
import { ArrowLeft, Maximize2, Minimize2, Clock, AlertTriangle, AlertCircle } from "lucide-react";

export default function TimerPresenterScreen({ roomId, onLeave }) {
  const [roomData, setRoomData] = useState(() => {
    const cached = localStorage.getItem(`timer-room-${roomId}`);
    return cached ? JSON.parse(cached) : undefined;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const audioContextRef = useRef(null);

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

  // Efecto local para actualizar la cuenta regresiva en tiempo real si el temporizador está corriendo
  useEffect(() => {
    if (timerStatus === "running" && timerEndTime) {
      const updateSeconds = () => {
        const remaining = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
        setSecondsLeft(remaining);
      };

      updateSeconds(); // Inicial
      const interval = setInterval(updateSeconds, 200); // Tildar frecuentemente para precisión
      return () => clearInterval(interval);
    } else {
      setSecondsLeft(timerRemaining);
    }
  }, [timerStatus, timerEndTime, timerRemaining]);

  // Manejo de sonido cuando llega a cero
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      // Emitir 3 beeps sucesivos
      const playBeep = (delay, frequency, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + duration);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      playBeep(0, 880, 0.4);
      playBeep(0.5, 880, 0.4);
      playBeep(1.0, 1046.5, 0.6);
    } catch (e) {
      console.warn("No se pudo reproducir el sonido de alerta:", e);
    }
  };

  // Escuchar cuando llega a cero para activar sonido
  const prevSecondsLeft = useRef(300);
  useEffect(() => {
    if (secondsLeft === 0 && prevSecondsLeft.current > 0 && timerStatus === "running") {
      playAlertSound();
    }
    prevSecondsLeft.current = secondsLeft;
  }, [secondsLeft, timerStatus]);

  // Manejar pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error al activar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Formatear segundos en MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Cálculo del porcentaje del círculo
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const percentage = timerDuration > 0 ? (secondsLeft / timerDuration) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determinar color y estado de alerta
  const ratioRemaining = secondsLeft / timerDuration;
  let statusColorClass = "timer-safe"; // verde/azul
  let statusLabel = "Tiempo Seguro";

  if (secondsLeft === 0) {
    statusColorClass = "timer-expired";
    statusLabel = "Tiempo Terminado";
  } else if (ratioRemaining <= 0.1 || secondsLeft <= 60) {
    statusColorClass = "timer-danger"; // rojo parpadeante
    statusLabel = "Último Minuto";
  } else if (ratioRemaining <= 0.2) {
    statusColorClass = "timer-warning"; // naranja
    statusLabel = "Tiempo Límite Cercano";
  }

  if (timerStatus === "paused") {
    statusLabel = "Pausado";
  } else if (timerStatus === "idle") {
    statusLabel = "Preparado";
  }

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
    <div className={`timer-presenter-layout ${statusColorClass}`}>
      {/* Barra superior de controles */}
      <div className="timer-presenter-header">
        <button className="btn btn-secondary timer-btn-back" onClick={onLeave}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>

        <div className="timer-header-info">
          <h2 style={{ fontSize: "1.4rem", margin: 0 }}>
            Sala: <span style={{ color: "var(--accent-blue)" }}>{roomId}</span>
          </h2>
          <span className="timer-badge">Expositor</span>
        </div>

        <button className="btn btn-secondary" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span>{isFullscreen ? "Pantalla Normal" : "Pantalla Completa"}</span>
        </button>
      </div>

      {/* Área principal del temporizador */}
      <div className="timer-presenter-main">
        <div className="timer-container-card glass-panel">
          {/* Círculo indicador de progreso */}
          <div className="timer-progress-wrapper">
            <svg className="timer-svg" width="320" height="320" viewBox="0 0 320 320">
              <defs>
                <linearGradient id="gradientSafe" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00c6ff" />
                  <stop offset="100%" stopColor="#0072ff" />
                </linearGradient>
                <linearGradient id="gradientWarning" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="gradientDanger" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>
              
              {/* Círculo de fondo gris */}
              <circle
                className="timer-circle-bg"
                cx="160"
                cy="160"
                r={radius}
                strokeWidth="14"
                fill="transparent"
              />
              
              {/* Círculo de progreso dinámico */}
              <circle
                className="timer-circle-progress"
                cx="160"
                cy="160"
                r={radius}
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 160 160)"
              />
            </svg>

            {/* Números Gigantes */}
            <div className="timer-digital-display">
              <span className="timer-time-numbers">
                {formatTime(secondsLeft)}
              </span>
              <span className="timer-status-text">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Advertencia visual en pantalla si expira */}
          {secondsLeft === 0 && (
            <div className="timer-expired-banner">
              <AlertTriangle className="blink-icon" size={32} />
              <span>¡TIEMPO CONCLUIDO!</span>
            </div>
          )}

          {/* Información del Preset Base */}
          <div className="timer-preset-info">
            <Clock size={16} />
            <span>Preset de la sala: {Math.round(timerDuration / 60)} min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
