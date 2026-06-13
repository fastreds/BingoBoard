import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logError } from "./shared/utils/logger";

if (typeof window !== "undefined") {
  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || message, { source, lineno, colno, phase: "global_onerror" });
  };
  window.onunhandledrejection = (event) => {
    logError(event.reason || "Rechazo Promesa No Controlado", { phase: "global_onunhandledrejection" });
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
