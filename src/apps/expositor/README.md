# Temporizador Expositor

Este subproyecto contiene la lógica para el control de tiempo sincronizado en vivo, ideal para charlas, eventos y presentaciones.

## Pantallas (Roles)
- **WelcomeScreen**: Pantalla para crear la sesión de tiempo o unirse.
- **TimerPresenterScreen**: Reloj digital grande para la pantalla del expositor (muestra tiempo restante, alertas visuales al acercarse a cero).
- **TimerControllerScreen**: Control remoto para el moderador (iniciar, pausar, sumar/restar minutos/segundos en tiempo real, cambiar presets).

## Reglas
Esta herramienta se maneja independientemente del Bingo. Comparte la conexión de Firebase (en `src/shared/firebase.js`), pero gestiona sus propios atributos en Firestore (`timerStatus`, `timerDuration`, `timerRemaining`, `timerEndTime`).
