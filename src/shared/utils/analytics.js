import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

// Evita múltiples registros en la misma sesión/navegador
let hasLoggedSession = false;

export async function logUsageAnalytics(appId) {
  // Solo registra una vez por carga de página
  if (hasLoggedSession) return;
  hasLoggedSession = true;

  try {
    let ipData = { ip: "unknown", country: "unknown", city: "unknown" };
    try {
      // Usamos ipapi.co (o similar) para obtener datos geográficos
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();
        ipData = {
          ip: data.ip || "unknown",
          country: data.country_name || "unknown",
          city: data.city || "unknown"
        };
      }
    } catch (apiErr) {
      console.warn("No se pudo obtener la IP:", apiErr);
    }

    const logEntry = {
      app: appId, // "dashboard", "bingo", "expositor"
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ...ipData
    };

    // Agregar el log a Firestore
    await addDoc(collection(db, "analytics_logs"), logEntry);
    console.log("Analytics sent:", appId);
  } catch (err) {
    console.error("Error logging analytics:", err);
  }
}

export async function getTotalUsageCount() {
  try {
    // Para simplificar sin aggregation queries, podemos usar count() si la versión de Firebase lo soporta.
    // Firebase Web SDK soporta getCountFromServer desde v9.11.0, pero asumiendo una versión estándar:
    const q = query(collection(db, "analytics_logs"));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (err) {
    console.error("Error getting total usage:", err);
    return 0;
  }
}
