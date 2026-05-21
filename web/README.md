# 🌐 UniConnect - Web Dashboard

Plataforma web de **UniConnect**, la red social universitaria diseñada para conectar a la comunidad académica. Este dashboard administrativo y de usuario está construido con **React 19**, **TypeScript** y **Vite**.

---

## 🛠️ Tecno-Stack & Características

- **Core:** React 19 & TypeScript para una interfaz reactiva y tipado seguro.
- **Build Tool:** Vite para un desarrollo ultra-rápido con Hot Module Replacement (HMR).
- **Tiempo Real:** Conectividad mediante Socket.io Client para chats y notificaciones instantáneas.
- **Testing:** Suite de pruebas unitarias y de integración con Vitest y Testing Library.
- **Calidad de Código:** Configuración avanzada de ESLint con reglas para React y TypeScript.

---

## 🚀 Desarrollo Local

### Requisitos Previos

- **Node.js** (Versión recomendada: `20.x`)
- **npm** (Instalado junto con Node)

### Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para instalar las dependencias de todos los espacios de trabajo:

```bash
npm install
```

### Comandos de Desarrollo

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local de Vite en `http://localhost:5173`. |
| `npm run build` | Compila los tipos de la API (`@uniconnect/api-types`) y construye la app para producción en `./dist`. |
| `npm run lint` | Analiza el código con ESLint en busca de errores y malas prácticas. |
| `npm run test` | Ejecuta las pruebas unitarias una sola vez con Vitest. |
| `npm run test:watch` | Ejecuta las pruebas de forma interactiva (modo watch). |
| `npm run preview` | Previsualiza la compilación de producción generada en `./dist` localmente. |

---

## 🚀 Flujo de CI/CD (Integración y Despliegue Continuos)

El desarrollo del proyecto está completamente automatizado a través de **GitHub Actions**. A continuación se detalla cómo fluyen los cambios desde que se realiza un Pull Request hasta el despliegue a producción.

### Diagrama del Flujo de Trabajo

El siguiente diagrama detalla los pipelines involucrados en el desarrollo y despliegue del Dashboard Web:

![alt text](<Untitled diagram-2026-05-17-234814.png>)

---

## 🌐 Entornos Disponibles

| Entorno | Plataforma / URL | Activador / Trigger | Descripción |
| :--- | :--- | :--- | :--- |
| **Desarrollo Local** | `http://localhost:5173` | Manual (`npm run dev`) | Entorno local de desarrollo rápido con HMR y conexión a API local o dev. |
| **Producción (Web)** | [uniconnect-frontend.fly.dev](https://uniconnect-frontend.fly.dev/) | Push automático a `main` | Aplicación web productiva desplegada en Fly.io conectada a la API productiva. |

---

## 🔐 Secretos Requeridos en GitHub Actions

Para asegurar que los workflows de GitHub Actions funcionen correctamente, se deben configurar los siguientes secretos en el repositorio (`Settings > Secrets and variables > Actions`):

| Secreto | Requerido por | Descripción |
| :--- | :--- | :--- |
| `FLY_API_TOKEN` | `fly-deploy.yml` | Token de autenticación de Fly.io que permite compilar y desplegar la aplicación web de forma remota, así como gestionar rollbacks automáticos en caso de fallos. |
| `SLACK_WEBHOOK_URL` | `ci.yml` y `fly-deploy.yml` | URL del Webhook entrante de Slack para enviar notificaciones automáticas al canal del equipo ante éxitos o fallos de compilación/despliegue. |
| `GITHUB_TOKEN` | `pr-coverage.yml` | Proporcionado automáticamente por GitHub Actions. Permite que la tarea de cobertura de código pueda comentar en las Pull Requests con el informe detallado de cobertura. |

> [!NOTE]
> Las variables de entorno de la aplicación web en producción como `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`, `EXPO_PUBLIC_AUTH0_DOMAIN` y `EXPO_PUBLIC_AUTH0_CLIENT_ID` se configuran como secretos de Fly.io a nivel de contenedor (`fly secrets set`) y no a través de secretos de GitHub Actions, manteniendo la consistencia de seguridad.
