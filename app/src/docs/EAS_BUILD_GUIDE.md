# Guía de Construcción y Despliegue con EAS (Expo Application Services)

Este documento explica cómo está configurado el sistema de construcción (builds) para la aplicación móvil usando EAS Build y cómo generar versiones instalables de la aplicación (APKs para pruebas o AABs para la Play Store).

## ¿Qué es EAS Build?

**EAS (Expo Application Services)** es un servicio alojado en la nube proporcionado por el equipo de Expo. Sirve para compilar y construir versiones instalables de tu aplicación (como archivos `.apk` para Android o `.ipa` para iOS) sin necesidad de tener configurado localmente el entorno nativo de desarrollo (como Android Studio o Xcode).

## Configuración en `eas.json`

El archivo clave para la configuración es `eas.json`. En nuestro proyecto, hemos definido varios **perfiles** de construcción, que determinan qué tipo de paquete se generará:

1. **development**: Perfil para generar una versión de desarrollo con herramientas integradas (generalmente para usar con bibliotecas nativas personalizadas vía `expo-dev-client`).
2. **preview**: Perfil configurado para generar un archivo **`.apk`** instalable directamente en dispositivos Android. Es ideal para enviarlo a docentes, pares evaluadores, o a un equipo para pruebas internas sin necesidad de publicarlo en las tiendas de aplicaciones ni requerir que ellos tengan instalada la app *Expo Go*.
3. **production**: Perfil configurado para generar un archivo **`.aab` (App Bundle)**. Este es el formato oficial requerido por la **Google Play Store** y se utiliza para lanzar la aplicación oficialmente al público.

*Fragmento de la configuración:*
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

## Comandos para Generar los Builds

> **Nota:** Todos los comandos deben ejecutarse dentro de la carpeta donde se encuentra el archivo `eas.json` (en este caso, la carpeta `app/`).

### 1. Generar un APK para Pruebas y Revisión (Docente/Evaluadores)
Este comando le dice a EAS que construya la app usando el perfil `preview`, resultando en un archivo `.apk`:

```bash
eas build --profile preview --platform android
```

### 2. Generar el Archivo para Producción (Play Store)
Este comando le dice a EAS que construya la app usando el perfil `production`, resultando en un App Bundle (`.aab`):

```bash
eas build --profile production --platform android
```

## ¿Dónde accedo y descargo el APK generado?

A diferencia de las compilaciones tradicionales locales, EAS compila la aplicación en los servidores de Expo en la nube. Puedes acceder al archivo generado de dos maneras:

### Opción 1: Desde la misma Terminal
- Cuando ejecutas el comando de build, EAS sube tu código a la nube y muestra una barra de estado o un enlace en la terminal para rastrear el proceso.
- Una vez finalizado el build correctamente, la terminal mostrará un mensaje de éxito junto con:
  1. **Un enlace directo** para descargar el archivo `.apk` a tu computador.
  2. **Un código QR** que puedes escanear directamente con la cámara de cualquier dispositivo Android para descargar e instalar la aplicación inmediatamente.

### Opción 2: Desde el Dashboard (Panel Web) de Expo
- Ingresa a la página oficial de Expo: [expo.dev](https://expo.dev/) e inicia sesión con la cuenta de Expo en la que inicializaste el proyecto.
- En tu panel, selecciona tu proyecto (probablemente llamado `uniconnect`).
- En el menú izquierdo, haz clic en la sección **Builds**.
- Allí verás el historial completo de todas las construcciones que has realizado (su estado, fecha y el perfil utilizado).
- Al hacer clic en un build terminado, verás un botón gigante de **Download** para descargar el archivo `.apk` o `.aab` según corresponda.

## Pasos para instalar el APK en un dispositivo Android

Para que los evaluadores puedan probar la app:
1. Descarga el archivo `.apk` y envíaselo por un medio de tu preferencia (WhatsApp, correo electrónico, Drive, etc.).
2. Ellos deberán abrir el archivo desde su celular.
3. El sistema Android podría mostrarles una advertencia indicando que no se permite instalar aplicaciones de fuentes desconocidas. Ellos simplemente deben tocar en **"Configuración"** y activar la opción de **"Permitir desde esta fuente"**.
4. Continuar con la instalación y listo; la app aparecerá en sus teléfonos como cualquier otra aplicación.
