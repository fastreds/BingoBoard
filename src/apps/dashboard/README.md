# Dashboard (Catálogo Principal)

Este subproyecto sirve como la página de inicio (`/`) de toda la aplicación web. Presenta el catálogo de herramientas disponibles (Bingo, Temporizador).

## Características
- Muestra tarjetas de navegación que enrutan hacia los otros subproyectos (`react-router-dom`).
- Incluye un contador de **Uso Total Global** extrayendo datos de `analytics_logs` de Firebase.
- Llama a `logUsageAnalytics("dashboard")` cuando el usuario entra, para registrar su visita (IP, geolocalización, timestamp).

## Reglas
- Cualquier herramienta o juego nuevo creado en la plataforma debe registrarse añadiendo una tarjeta en este Dashboard.
