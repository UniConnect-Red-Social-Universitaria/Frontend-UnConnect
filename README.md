# Frontend UnConnect

Aplicación móvil de **UnConnect** construida con **React Native + Expo**.

## Requisitos

- Node.js (recomendado: 20.x)
- npm
- Expo Go en tu dispositivo móvil (opcional para pruebas en celular)

## Instalación

```bash
npm install
```

## Variables de entorno (Google Auth)

Define estas variables en `uniconnect-app/.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=...
```

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: obligatoria en Android.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: obligatoria en iOS.
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`: recomendada para Expo Go (si no se define, se usa `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).

## Ejecutar la app

Comando principal (muestra QR y usa configuración estable en Linux):

```bash
npm run start:qr
```

Si estás en **Windows** y el QR no carga en Expo Go, usa:

```bash
npm run start:tunnel
```

Esto evita problemas de red local/adaptadores virtuales.

Otros scripts disponibles:

- `npm run start`
- `npm run start:lan`
- `npm run start:tunnel`
- `npm run android`
- `npm run ios`
- `npm run web`

## Estructura base

- `App.tsx`: punto de entrada principal de la interfaz.
- `assets/`: recursos estáticos.
- `index.ts`: registro de la app.

