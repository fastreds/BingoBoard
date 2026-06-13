# Bingo Live

Este subproyecto contiene la lógica y las pantallas para el juego de Bingo en tiempo real.

## Pantallas (Roles)
- **WelcomeScreen**: Pantalla inicial para crear sala o unirse.
- **PresenterScreen**: Pantalla grande (TV) que muestra los números cantados de forma automática y visual.
- **ControllerScreen**: Pantalla de control remoto para el moderador (canta los números, valida bingos, cambia el patrón).
- **PlayerScreen**: Pantalla de cartón digital interactivo para los jugadores.

## Dependencias Locales
Utiliza `src/apps/bingo/utils/bingoGenerator.js` para crear los cartones lógicamente y `bingoPhrases.js` para las locuciones jocosas.

## Reglas
No modificar estas pantallas para inyectar lógica de otras herramientas. Todo lo relacionado con temporizadores u otros juegos pertenece a sus respectivos subdirectorios.
