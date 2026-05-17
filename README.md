# UniConnect Frontend

Bienvenido al repositorio frontend de **UniConnect**. Este proyecto utiliza una arquitectura de **Monorepo** (mediante npm workspaces) para separar de manera eficiente la lógica y el entorno de las dos versiones de la aplicación:

1. **Aplicación Móvil (`app/`)**: Desarrollada con React Native y Expo.
2. **Aplicación Web (`web/`)**: Desarrollada con React y Vite.

Ambas versiones comparten paquetes base (como la lógica de interfaz en `packages/ui` o temas en `packages/theme`) para facilitar el mantenimiento y consistencia del ecosistema.

---

## 🛠 Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/es/) (Se recomienda versión 18+ o superior)
- Git

## 🚀 Instalación y Configuración

Dado que el proyecto utiliza npm workspaces, todas las dependencias (tanto de la app móvil como de la web) se instalan ejecutando un único comando desde la raíz del proyecto.

1. Abre tu terminal en la ruta principal del frontend (`Frontend-UnConnect`).
2. Ejecuta el comando de instalación:
   ```bash
   npm install
   ```

*(Nota: Asegúrate de tener también corriendo el backend de UniConnect en su respectivo entorno local antes de interactuar con la interfaz).*

---

## 🌐 Cómo correr la Versión Web

La versión Web es una Single Page Application construida con React y empaquetada con Vite, diseñada con CSS puro para una carga rápida y aspecto nativo.

Desde la raíz del proyecto (`Frontend-UnConnect`), ejecuta:
```bash
npm run dev:web
```

- Este comando levantará el servidor de desarrollo de Vite.
- Generalmente podrás acceder a la aplicación desde tu navegador en: `http://localhost:5173` (o el puerto que te indique la terminal).

---

## 📱 Cómo correr la Versión Móvil (React Native)

La aplicación móvil está construida sobre el framework Expo, lo que permite probarla fácilmente en dispositivos físicos o emuladores.

Desde la raíz del proyecto (`Frontend-UnConnect`), ejecuta:
```bash
npm run dev:app
```

- Esto levantará el servidor de Metro / Expo.
- Verás un código QR en la consola.
- **Para probar en un dispositivo físico**: Descarga la aplicación **Expo Go** en tu celular (iOS/Android) y escanea el código QR.
- **Para probar en emulador**: Presiona `a` en la terminal para abrir en Android Studio, o `i` para abrir en el simulador de iOS.

---

## 📁 Estructura del Proyecto

\`\`\`
Frontend-UnConnect/
│
├── app/                  # Código fuente de la App Móvil (React Native + Expo)
│   ├── src/screens/      # Pantallas exclusivas móviles
│   ├── src/navigation/   # Enrutamiento móvil (React Navigation)
│   └── ...
│
├── web/                  # Código fuente de la App Web (React + Vite)
│   ├── src/pages/        # Pantallas (Páginas) exclusivas de Web
│   ├── src/components/   # Componentes y Layouts compartidos para Web
│   ├── src/hooks/        # Lógica y hooks como Sockets (adaptados a web)
│   └── ...
│
├── packages/             # Librerías y utilidades compartidas por ambos entornos
│   ├── theme/            # Tokens de diseño, tipografías y colores unificados
│   └── ui/               # Componentes transversales si aplica
│
├── package.json          # Archivo raíz con los scripts globales (workspaces)
└── README.md
\`\`\`

## 🔧 Comandos Adicionales útiles

- `npm run build:web`: Compila y empaqueta la versión Web lista para producción.
- `npm run test:app`: Ejecuta las pruebas unitarias configuradas para la aplicación móvil.

---
**Nota:** Ante cualquier problema de conexión (sockets, peticiones a API), verificar los archivos de variables de entorno (como `.env` o la configuración en `utils/apiConfig.ts`) para garantizar que apuntan al puerto correcto del backend local (usualmente `http://localhost:3000`).

## Flujo de CI/CD
