# ARCADIA

Proyecto web real de Arcadia, bar-restaurante en Lloret de Mar.

Stack actual:
- Astro SSR (`output: "server"`)
- TypeScript
- Preact para islas
- Tailwind CSS
- Astro DB / libSQL
- sesiones con Astro Session
- deploy orientado a Vercel

## Qué incluye

### Público
- Home
- Carta
- Menú
- Pedir
- Checkout
- Estado público de pedido

### Cuenta
- Login / registro
- Perfil
- Direcciones
- Pedidos
- Newsletter desde cuenta

### Admin
- Dashboard
- Pedidos
- Cocina
- Operativa
- Productos
- Ingredientes
- Modificadores
- Alérgenos
- Compatibilidades
- Categorías
- Menú
- Cupones
- Usuarios
- Loyalty
- Newsletter
- Ajustes de pagos y fees

## Requisitos

- Node.js 20+
- npm
- Astro DB configurada
- Upstash Redis para producción
- SMTP si quieres usar el newsletter manual
- Vercel Blob si quieres subida de imágenes de producto

## Variables de entorno

Revisa `.env.example`.

Las más importantes para arrancar:
- `ASTRO_DB_REMOTE_URL`
- `ASTRO_DB_APP_TOKEN`

Para producción:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Para newsletter manual:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM`

## Instalación

```bash
npm install