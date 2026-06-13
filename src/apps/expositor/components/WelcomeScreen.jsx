import React, { useState, useEffect } from "react";
import { createRoom } from "../../../shared/firebase";
import { Tv, Radio, Plus, Share2 } from "lucide-react";
import { logEvent } from "../../../shared/utils/logger";

export default function WelcomeScreen({ onSelectRole }) {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") || params.get("sala");
    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
    }
  }, []);

  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/expositor?room=${roomId}`;
    const text = `¡Únete al Temporizador en tiempo real! ⏱️\n\nCódigo de sala: *${roomId}*\n\nEntra haciendo clic aquí:\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError("");
    const digits = Math.floor(1000 + Math.random() * 9000);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letter = letters.charAt(Math.floor(Math.random() * letters.length));
    const newRoomId = `${digits}${letter}`;
    try {
      await createRoom(newRoomId);
      logEvent("room", "create_timer", newRoomId);
      setRoomId(newRoomId);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (role) => {
    if (!roomId.trim()) {
      setError("Por favor ingresa un código de sala.");
      return;
    }
    const cleanRoomId = roomId.trim().toUpperCase();
    logEvent("room", "join_timer", `${cleanRoomId} - ${role}`);

    onSelectRole({
      roomId: cleanRoomId,
      role
    });
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "8px", fontWeight: "800" }}>Temporizador Expositor</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
          Control de tiempo sincronizado en vivo.
        </p>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.15)", 
            color: "#fca5a5", 
            padding: "12px", 
            borderRadius: "10px", 
            marginBottom: "20px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <div className="flex-col" style={{ gap: "20px" }}>
          {/* Create Room Option */}
          {!roomId && (
            <button 
              className="btn btn-primary" 
              onClick={handleCreateRoom}
              disabled={loading}
              style={{ width: "100%" }}
            >
              <Plus size={20} />
              {loading ? "Creando..." : "Crear Nueva Sala"}
            </button>
          )}

          {roomId && (
            <div className="flex-col" style={{ gap: "10px", marginBottom: "10px", width: "100%" }}>
              <div style={{ 
                background: "rgba(16, 185, 129, 0.1)", 
                border: "1px dashed var(--success)",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#6ee7b7"
              }}>
                Sala Creada: {roomId}
              </div>
              <button 
                className="btn" 
                onClick={handleShareWhatsApp}
                style={{ 
                  background: "linear-gradient(135deg, #25d366, #128c7e)",
                  color: "white",
                  width: "100%",
                  boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)"
                }}
              >
                <Share2 size={18} />
                <span>Compartir Sala por WhatsApp</span>
              </button>
            </div>
          )}

          {/* Join Form */}
          <div className="flex-col" style={{ textAlign: "left" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              CÓDIGO DE SALA
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: 1482C" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ textTransform: "uppercase" }}
            />
          </div>

          {/* Select Roles */}
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "10px", textAlign: "left" }}>
              SELECCIONA TU ROL
            </p>

            <div className="grid-cols-2">
              <button 
                className="btn btn-secondary" 
                onClick={() => handleJoin("timer_presenter")}
                style={{ flexDirection: "column", padding: "16px 10px", fontSize: "0.9rem" }}
              >
                <Tv size={24} style={{ color: "var(--success)" }} />
                <span>Pantalla Expositor</span>
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => handleJoin("timer_controller")}
                style={{ flexDirection: "column", padding: "16px 10px", fontSize: "0.9rem" }}
              >
                <Radio size={24} style={{ color: "var(--accent-blue)" }} />
                <span>Control Remoto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
