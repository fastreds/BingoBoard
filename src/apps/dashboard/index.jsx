import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tv, Radio, BarChart3, Users, Clock, Play } from "lucide-react";
import { getTotalUsageCount, logUsageAnalytics } from "../../shared/utils/analytics";

export default function DashboardScreen() {
  const navigate = useNavigate();
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    // Registrar la visita al dashboard
    logUsageAnalytics("dashboard");

    // Cargar contador de uso
    const fetchUsage = async () => {
      const count = await getTotalUsageCount();
      setUsageCount(count);
    };
    fetchUsage();
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "800px", textAlign: "center" }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "900", background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "10px" }}>
            Catálogo de Herramientas
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            Selecciona la herramienta interactiva que deseas utilizar para tu evento o presentación.
          </p>
        </div>

        {/* Global Stats */}
        <div className="glass-panel" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 20px", borderRadius: "50px", marginBottom: "40px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <BarChart3 size={20} color="#60a5fa" />
          <span style={{ color: "#e2e8f0", fontWeight: "600" }}>Uso Total Global:</span>
          <span style={{ color: "#a78bfa", fontWeight: "800", fontSize: "1.2rem" }}>{usageCount > 0 ? usageCount : "..."}</span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>sesiones</span>
        </div>

        {/* App Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" }}>
          
          {/* Bingo Card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "30px", 
              textAlign: "left", 
              cursor: "pointer", 
              transition: "transform 0.2s, box-shadow 0.2s",
              borderTop: "4px solid var(--accent-red)" 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            onClick={() => navigate("/bingo")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "15px", borderRadius: "15px" }}>
                <Tv size={32} color="var(--accent-red)" />
              </div>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Activo</span>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "10px" }}>Bingo Live</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", minHeight: "60px" }}>
              Pizarra electrónica interactiva con cartones digitales para los jugadores y control en tiempo real.
            </p>
            <button className="btn btn-primary" style={{ width: "100%", background: "rgba(239, 68, 68, 0.8)", borderColor: "rgba(239, 68, 68, 1)" }}>
              <Play size={18} /> Iniciar Bingo
            </button>
          </div>

          {/* Expositor Card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "30px", 
              textAlign: "left", 
              cursor: "pointer", 
              transition: "transform 0.2s, box-shadow 0.2s",
              borderTop: "4px solid var(--success)" 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            onClick={() => navigate("/expositor")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "15px", borderRadius: "15px" }}>
                <Clock size={32} color="var(--success)" />
              </div>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Activo</span>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "10px" }}>Temporizador Expositor</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", minHeight: "60px" }}>
              Control de tiempo sincronizado para eventos y charlas con alertas visuales de tiempo restante.
            </p>
            <button className="btn btn-success" style={{ width: "100%" }}>
              <Play size={18} /> Iniciar Temporizador
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
