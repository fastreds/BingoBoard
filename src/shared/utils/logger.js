import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

// Registrar eventos de uso del sistema
export async function logEvent(category, action, label = "", metadata = {}) {
  try {
    const logsRef = collection(db, "system_logs");
    await addDoc(logsRef, {
      type: "event",
      category,
      action,
      label,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    // Falla de log silenciosa para evitar alterar la experiencia del usuario
    console.warn("Failed to log event:", error);
  }
}

// Registrar errores de ejecución en la base de datos
export async function logError(error, context = {}) {
  try {
    const logsRef = collection(db, "system_logs");
    await addDoc(logsRef, {
      type: "error",
      errorMessage: error.message || String(error),
      errorStack: error.stack || "",
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  } catch (e) {
    console.warn("Failed to log error to firestore:", e);
  }
}
