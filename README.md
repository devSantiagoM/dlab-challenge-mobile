# Bienvenido a tu app Expo 👋

Este código es un cliente móvil de [Expo](https://expo.dev) + React Native construido con TypeScript y Expo Router.

<!-- Badges -->

![Expo](https://img.shields.io/badge/Expo-51%2B-000000?logo=expo&logoColor=white)
![React_Native](https://img.shields.io/badge/React%20Native-0.7x-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS%20%7C%20Web-8A2BE2)
![Lint](https://img.shields.io/badge/Lint-ESLint-4B32C3?logo=eslint&logoColor=white)

## Características

- Pantallas: Login, Dashboard, Empleados, Recibos, Configuración.
- Filtros básicos y avanzados con UI responsiva.
- Integración con servicios (fetch) y almacenamiento local con AsyncStorage para sesión.
- Expo Router con Drawer y Stack; theming centralizado.

## Requisitos

- Node.js 18+ y npm 9+.
- Expo CLI: se instala automáticamente al ejecutar los scripts.
- Emulador Android/iOS o dispositivo físico con Expo Go para desarrollo.

## Inicio rápido

1. Instalar dependencias

```bash
npm install
```

2. Ejecutar en modo desarrollo

```bash
npx expo start
```

Luego abre en:

- Android (emulador o Expo Go)
- iOS (simulador o Expo Go)
- Web

## Guía rápida de uso

1. Inicia sesión: usa tus credenciales válidas. La app guarda el token en `AsyncStorage` para mantener la sesión.
2. Navegación principal: desde el Drawer accedes a Dashboard, Empleados, Recibos, Comunicación y Configuración.
3. Empleados: filtra y consulta el listado. En una siguiente iteración se podrá importar desde Excel.
4. Recibos: visualiza y filtra recibos; los datos provienen del servicio configurado en `services/`.
5. Comunicación: envía y consulta mensajes; en un futuro se podria conectarse a datos reales mediante API.
6. Configuración: ajusta preferencias básicas; se puede extender con opciones funcionales (ver Roadmap).

## Scripts útiles

- `npm start` / `npx expo start`: inicia el servidor de desarrollo.
- `npm run reset-project`: script de ejemplo incluido por Expo para reiniciar estructura.

## Estructura del proyecto

```
client-mobile/
├─ app/                 # Rutas y pantallas (Expo Router)
│  ├─ (auth)/           # Flujo de autenticación
│  ├─ (drawer)/         # Flujo principal con Drawer (Dashboard, Empleados, etc.)
│  └─ _layout.tsx       # Layout raíz y navegación
├─ components/          # Componentes UI reutilizables
├─ constants/           # Tema, colores, radios, spacing, etc.
├─ services/            # Llamadas a API y mapeos a modelos de UI
├─ assets/              # Imágenes y fuentes
└─ README.md
```

## Configuración

Este proyecto no requiere variables sensibles para ejecutarse en desarrollo. Si en el futuro agregas llaves o endpoints privados, usa variables de entorno (.env) y nunca subas secretos al repositorio.

## Posibles mejoras / Roadmap

- Renovación de sesión periódica: posibilidad de solicitar re-login o refrescar token cada cierto tiempo (middleware de auth + `refresh_token`).
- Importación de empleados vía Excel: carga de archivos `.xlsx`/`.csv`, parseo y validación para alta/actualización masiva.
- Comunicación con datos reales: integrar endpoints reales para mensajes/notificaciones y estado de lectura.
- Configuración funcional: habilitar switches y preferencias que impacten el comportamiento de la app (tema, notificaciones, idioma, etc.).

## Calidad de código

- ESLint y convenciones de estilo.
- TypeScript en todas las pantallas y servicios.

## Resolución de problemas

- Si el emulador no detecta la app, reinicia Metro Bundler (`r`) y borra caché: `npx expo start -c`.
- Errores de dependencias nativas: asegúrate de tener la app de Expo Go actualizada o usa Development Builds.
- Si ves advertencias de TypeScript en módulos de terceros, no afectan la ejecución.

## Licencia

Este proyecto se proporciona para fines de evaluación/desarrollo. No contiene ni expone datos sensibles en este README.
