# 📱 UniConnect - Mobile App

Aplicación móvil de **UniConnect**, la red social universitaria diseñada para conectar a la comunidad académica. Esta app está construida utilizando **React Native** con **Expo (v54)** y optimizada para ejecutarse en iOS y Android.

---

## 📋 Requisitos Previos

- **Node.js** (Versión recomendada: `20.x`, requerido: `>=18 <23`)
- **npm** (Instalado con Node)
- **Expo Go** instalado en tu dispositivo móvil (opcional para pruebas en celular)

---

## ⚙️ Instalación

Instala las dependencias ejecutando el siguiente comando desde la raíz del proyecto para resolver el monorepositorio, o específicamente dentro de esta carpeta:

```bash
npm install
```

---

## 🔐 Variables de Entorno (Google Auth)

Define las siguientes variables en el archivo `app/.env` (crea el archivo si no existe):

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=...
```

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: Obligatoria en dispositivos Android físicos o emuladores.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: Obligatoria en dispositivos iOS físicos o simuladores.
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`: Recomendada para pruebas en **Expo Go** (si no se define, el sistema utilizará automáticamente `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).

---

## 🚀 Ejecutar la App

### Comando Principal (Recomendado para la mayoría de sistemas)

Muestra el código QR y utiliza una configuración optimizada y estable para Node 20:

```bash
npm run start:qr
```

### Para Usuarios de Windows (Redes locales restringidas / Adaptadores virtuales)

Si tienes problemas de red local y el código QR de Expo Go no logra conectarse con tu PC, inicia el servidor en modo túnel:

```bash
npm run start:tunnel
```

### Otros Scripts Disponibles

| Comando                | Descripción                                                                         |
| :--------------------- | :---------------------------------------------------------------------------------- |
| `npm run start`        | Inicia el servidor Metro predeterminado de Expo.                                    |
| `npm run start:lan`    | Inicia el servidor Metro forzando la red LAN.                                       |
| `npm run start:tunnel` | Inicia Metro a través de un túnel público seguro de Ngrok.                          |
| `npm run android`      | Abre la aplicación directamente en un emulador Android activo.                      |
| `npm run ios`          | Abre la aplicación directamente en un simulador iOS (requiere macOS y Xcode).       |
| `npm run web`          | Compila y ejecuta la versión web interactiva de Expo.                               |
| `npm run test`         | Ejecuta las pruebas unitarias de Jest configuradas para el entorno de React Native. |

---

## 📦 Distribución del APK Preview

La versión móvil se distribuye mediante **EAS Build** en el perfil `preview`, que genera un **APK instalable en dispositivos Android reales**.

### Último APK Preview

- Enlace de descarga: **https://expo.dev/accounts/leon55490/projects/uniconnect/builds/a8a7bac5-dc69-4ac4-b3a9-4eced94b5ad4**

### Cómo instalarlo en Android

1. Abre el enlace del APK preview desde el dispositivo Android o transfiérelo al teléfono.
2. Descarga el archivo `.apk`.
3. Si Android lo solicita, habilita temporalmente la instalación desde orígenes desconocidos para esa fuente.
4. Abre el archivo descargado e instala la app.
5. Inicia sesión y verifica que la app cargue contra el backend de producción en Fly.io.

### Cómo generar un nuevo APK Preview

Desde la carpeta `app/`, ejecuta:

```bash
eas build -p android --profile preview
```

---

## 📂 Estructura Base de la App

- `App.tsx`: Punto de entrada principal de la interfaz y proveedores de contexto.
- `assets/`: Recursos estáticos de la aplicación (imágenes, fuentes, iconos).
- `index.ts`: Registro formal de la aplicación ante Expo.
- `scripts/`: Scripts personalizados para configurar el arranque de Metro de forma robusta.

---

## Flujo de CI/CD (Integración y Despliegue Continuos)

La aplicación móvil cuenta con integración continua automatizada a través de **GitHub Actions** y compilaciones en la nube mediante **EAS (Expo Application Services)**.

### Diagrama del Flujo de Trabajo

El siguiente diagrama detalla cómo fluyen los cambios y cómo se compila la versión móvil preview en la nube:

![alt text](<Untitled diagram-2026-05-17-234342.png>)

---

## 📱 Entornos Disponibles

| Entorno               | Plataforma / URL         | Activador / Trigger                      | Descripción                                                                          |
| :-------------------- | :----------------------- | :--------------------------------------- | :----------------------------------------------------------------------------------- |
| **Desarrollo Local**  | Servidor Metro (Expo Go) | Manual (`npm run start:qr`)              | Entorno interactivo local con Fast Refresh para el desarrollo diario.                |
| **Preview / Staging** | APK Preview EAS          | `eas build -p android --profile preview` | Compilación instalable para Android real con variables públicas inyectadas en build. |

> [!NOTE]
> El workflow de compilación EAS (`eas-build.yml`) posee una directiva condicional `if: false` a nivel de job para evitar el uso excesivo de minutos en compilaciones tempranas. Puede ser activado removiendo o modificando esta línea cuando el equipo lo requiera.

---

## 🔐 Secretos Requeridos en GitHub Actions

Para que las compilaciones automatizadas y notificaciones de la app se ejecuten sin problemas, deben estar definidos los siguientes secretos en el repositorio (`Settings > Secrets and variables > Actions`):

| Secreto             | Requerido por                       | Descripción                                                                                                                                                                                                     |
| :------------------ | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_TOKEN`        | `eas-build.yml`                     | Token de acceso personal generado en la consola de Expo. Permite a GitHub Actions autenticar la EAS CLI y compilar las aplicaciones iOS/Android de forma remota.                                                |
| `SLACK_WEBHOOK_URL` | `ci.yml`                            | URL del Webhook entrante de Slack para notificar automáticamente al equipo si las pruebas y tipados de la app pasaron o fallaron.                                                                               |
| `GITHUB_TOKEN`      | `eas-build.yml` y `pr-coverage.yml` | Proporcionado automáticamente por la plataforma de GitHub Actions. Se utiliza para generar comentarios de cobertura y para crear la Pre-Release en el repositorio conteniendo el archivo de log y links de EAS. |
