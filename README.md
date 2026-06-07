# 🎲 BingoBoard Live - Bingo Tico en Tiempo Real

¡Bienvenido a **BingoBoard Live**! Esta es una aplicación web interactiva y colaborativa para jugar Bingo en tiempo real, diseñada especialmente con la esencia cultural y las expresiones populares de **Costa Rica** (Bingo Tico). 

El sistema permite sincronizar a múltiples jugadores en tiempo real usando Firebase Firestore, y cuenta con un sistema local de locución (Text-to-Speech) que canta los números de manera jocosa y tradicional sin latencia.

---

## 🌟 Características Principales

*   **🇨🇷 Identidad Costarricense (Bingo Tico):** Diseño visual con una paleta de colores de alta visibilidad inspirada en la bandera de Costa Rica (Azul, Blanco y Rojo).
*   **🎙️ Locución TTS Local con Humor Tico:** Canto de números sin latencia usando la API nativa de síntesis de voz del navegador (`SpeechSynthesis`). El sistema incluye un catálogo en [bingoPhrases.js](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/utils/bingoPhrases.js) con **3 frases jocosas diferentes por cada uno de los 75 números** (ej. *"La media teja, el 50"*, *"Los dos patitos, el 22"*, *"La edad de Cristo, el 33"*).
*   **📱 Diseño Adaptable Multi-Cartón (Móvil):** Los jugadores pueden generar, visualizar y marcar hasta **3 cartones simultáneos** de forma intuitiva a través de pestañas deslizables diseñadas para smartphones.
*   **🛡️ Arquitectura Segura en Firebase:** Configuración robusta en [firestore.rules](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/firestore.rules) que limita el tamaño de los datos, previene la inyección de payloads masivos, restringe accesos de lectura en logs y evita el borrado accidental o malintencionado de las salas de juego.
*   **💻 Tres Modos de Visualización / Roles:**
    1.  **Pizarra de TV (Presenter):** Diseñada para proyectarse en pantallas grandes. Muestra el número gigante cantado, los últimos 5 números del historial y una rejilla completa de los 75 números. Controla el sonido y ofrece modo pantalla completa.
    2.  **Control Remoto (Controller):** El panel del moderador del juego. Permite cantar números aleatorios o de forma manual directa sobre el tablero interactivo, seleccionar el patrón de victoria (Línea, Cartón Lleno, Forma de L, Equis, etc.), y auditar los reclamos de Bingo recibidos.
    3.  **Pantalla del Jugador (Player):** Genera cartones con números aleatorios únicos a partir de semillas (*seeds*), permite el marcado manual, resalta con colores dinámicos qué números del cartón ya han sido cantados oficialmente y habilita el botón de reclamo de Bingo.
*   **🔬 Verificación Automatizada:** El sistema del moderador valida de forma matemática instantánea si el cartón del jugador cumple con el patrón de victoria activo cruzándolo con el historial de números cantados, evitando trampas o errores humanos.
*   **📊 Auditoría en la Nube:** Registro persistente de logs de eventos y errores en la base de datos de Firestore de modo seguro (creación únicamente), permitiendo analizar el uso y rendimiento sin comprometer la privacidad.

---

## 📁 Estructura del Proyecto

El código fuente está estructurado de la siguiente manera:

*   **[src/firebase.js](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/firebase.js):** Configura la inicialización de Firebase y expone las funciones de base de datos en tiempo real (`subscribeToRoom`, `createRoom`, `drawNumber`, `claimBingo`, etc.).
*   **[firestore.rules](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/firestore.rules):** Contiene las reglas de seguridad declarativas de Firestore para validar tipos de datos y proteger contra manipulación o abusos.
*   **[src/components/](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/components/):**
    *   [WelcomeScreen.jsx](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/components/WelcomeScreen.jsx): Pantalla de inicio para ingresar o crear salas, definir nombre de usuario y seleccionar el rol.
    *   [PresenterScreen.jsx](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/components/PresenterScreen.jsx): Vista de TV que dibuja el tablero general y reproduce la locución por síntesis de voz optimizada para voces latinas.
    *   [ControllerScreen.jsx](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/components/ControllerScreen.jsx): Consola del administrador para sortear números, cambiar patrones y autorizar/denegar reclamos.
    *   [PlayerScreen.jsx](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/components/PlayerScreen.jsx): Interfaz del jugador optimizada para móviles con soporte de múltiples cartones locales vía `localStorage`.
*   **[src/utils/](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/utils/):**
    *   [bingoPhrases.js](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/utils/bingoPhrases.js): Base de conocimiento con las 225 variantes de frases costarricenses y la lógica rítmica del canto.
    *   [bingoGenerator.js](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/utils/bingoGenerator.js): Generador algorítmico de matrices de cartón BINGO basado en una semilla numérica fija, incluyendo los validadores geométricos de patrones de victoria.
    *   [logger.js](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/src/utils/logger.js): Manager para registrar analíticas de eventos y trazas de errores directamente en Firestore de forma silenciosa.

---

## ⚙️ Configuración del Entorno

Para proteger las credenciales del proyecto de accesos no autorizados en repositorios públicos como GitHub, la aplicación utiliza variables de entorno inyectadas en tiempo de compilación mediante Vite.

1.  Copia el archivo de plantilla [.env.example](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/.env.example) y renombralo como `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Abre el archivo `.env` recién creado y completa los valores con las credenciales de tu proyecto de Firebase:
    ```env
    VITE_FIREBASE_API_KEY=tu_api_key
    VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
    VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
    VITE_FIREBASE_APP_ID=tu_app_id
    ```

> [!WARNING]
> Nunca incluyas el archivo `.env` en los commits del sistema de control de versiones Git. Este archivo ya se encuentra listado en [.gitignore](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/.gitignore) por seguridad.

---

## 🚀 Instalación y Desarrollo Local

Sigue estos pasos para levantar el entorno de desarrollo en tu computadora local:

1.  **Instalar las dependencias del proyecto:**
    ```bash
    npm install
    ```
2.  **Iniciar el servidor de desarrollo local:**
    ```bash
    npm run dev
    ```
    La consola te proveerá un enlace local (usualmente `http://localhost:5173`) para abrir en tu navegador.

3.  **Compilar la aplicación para producción:**
    ```bash
    npm run build
    ```
    Esto generará una carpeta optimizada `/dist` lista para ser desplegada en cualquier servidor estático.

---

## 🔐 Despliegue y Seguridad

### Reglas de Seguridad en Cloud Firestore
Para garantizar que nadie abuse de tu base de datos o altere los juegos, debes desplegar las reglas del archivo [firestore.rules](file:///C:/Users/Marcos/Documents/GitHub/BingoBoard/firestore.rules). Estas reglas realizan las siguientes validaciones:
*   **Salas (`/rooms`):**
    *   Lectura pública abierta para que los jugadores sigan el tablero.
    *   Validación en creación y actualización: se comprueba que el ID de la sala no exceda los 20 caracteres, que la lista de números cantados nunca sea mayor a 75 y que los reclamos activos no excedan los 100 elementos por sala.
    *   **Prohibición de Borrado:** Bloqueo explícito a la directiva `delete` para evitar que usuarios malintencionados eliminen salas en juego.
*   **Logs del Sistema (`/system_logs`):**
    *   Los clientes únicamente tienen permitido **crear** documentos (`allow create`).
    *   Se prohíbe explícitamente leer (`read`), editar (`update`) o borrar (`delete`) logs por motivos de confidencialidad y control.
    *   El tamaño de los logs está limitado (longitud del string del `userAgent` inferior a 500 caracteres) para prevenir ataques de denegación de servicio por llenado de espacio.

### Despliegue en Firebase Hosting
Una vez configurado tu CLI de Firebase (`npm install -g firebase-tools` e iniciando sesión con `firebase login`), puedes compilar y subir tus cambios con:

```bash
# Compilar la última versión estable
npm run build

# Desplegar la aplicación web y las reglas de seguridad
firebase deploy
```

---

## 🎮 ¿Cómo se juega?

1.  **Creación de la sala:** El presentador o moderador ingresa a la aplicación y presiona **"Crear Nueva Sala"**. Se le generará un código único de 5 dígitos (ej. `1294K`).
2.  **Compartir enlace:** El moderador puede hacer clic en **"Compartir Sala por WhatsApp"** para enviar de forma automática una invitación interactiva con el enlace de acceso directo a todos sus contactos.
3.  **Entrar como Jugador:** Los jugadores ingresan con el código de la sala, escriben su nombre y configuran sus cartones. Pueden presionar **"Añadir"** para jugar con 2 o 3 cartones en paralelo.
4.  **Cantar los números:** El presentador abre la **"Pantalla TV"** en el monitor principal del salón con el audio activado. El moderador sortea los números desde su smartphone usando el botón **"Cantar Número Aleatorio"**. El presentador dirá en voz alta las divertidas frases locales de Costa Rica al instante.
5.  **Reclamar Bingo:** Cuando un jugador completa el patrón de victoria, la app del jugador le notificará visualmente. El jugador presiona **"¡Reclamar Bingo!"**. Al moderador le aparecerá la alerta interactiva en pantalla; podrá examinar visualmente el cartón y la validación automática del sistema para proceder a aprobar y festejar el ganador.

¡Disfruta del auténtico Bingo Tico en tiempo real! 🇨🇷🎉
