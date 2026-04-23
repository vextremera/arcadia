# ARCADIA

Aplicación web SSR para un bar-restaurante, construida con Astro y pensada para cubrir el flujo completo de catálogo, pedido online y backoffice operativo.

## Qué incluye

### Front público
- Home con horario, reseñas y newsletter.
- Carta y menú por categorías.
- Carrito persistente por sesión.
- Checkout con validación de disponibilidad, cupones y envío/recogida.
- Cuenta de cliente y listado de pedidos.
- Página de confirmación de pedido.

### Configuración de producto
- Modal de personalización por pasos.
- Quitar ingredientes base.
- Añadir ingredientes comunes por categoría.
- Extras y salsas por modificadores.
- Resumen final antes de añadir al carrito.

### Backoffice / admin
- Dashboard.
- Gestión de categorías, productos, ingredientes, alérgenos, compatibilidades y modificadores.
- Operativa, horarios, fees y métodos de pago.
- Upsell.
- Usuarios y loyalty.
- Cocina.
- Cupones.
- Newsletter.
- Auditoría.

## Stack
- Astro 6
- TypeScript
- Preact
- Tailwind CSS 4
- Astro DB
- Adapter de Vercel
- Sesiones con Upstash Redis en producción
- Vercel Blob para imágenes de producto
- Nodemailer para newsletter/admin mail

## Requisitos
- Node.js 22.x
- npm
- Proyecto de Vercel para deploy SSR
- Upstash Redis para sesiones en producción

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run db:push
npm run db:seed
npm run db:push:remote
npm run db:seed:remote
```

### Qué hace cada script
- `npm run dev`: arranca el entorno local.
- `npm run build`: build SSR usando base remota (`astro build --remote`).
- `npm run preview`: preview local del build.
- `npm run db:push`: aplica schema a la base local.
- `npm run db:seed`: ejecuta `db/seed.ts` en local.
- `npm run db:push:remote`: aplica schema a la base remota.
- `npm run db:seed:remote`: ejecuta `db/seed.ts` en remoto.

## Aviso importante sobre seeds

`db/seed.ts` es un seed **de catálogo y datos base** pensado para desarrollo/reset. En su estado actual es **destructivo**: limpia tablas importantes antes de reconstruir catálogo y configuración.

Eso significa:
- úsalo en local cuando quieras regenerar catálogo desde cero;
- **no lo ejecutes en remoto** si ya tienes pedidos, pagos o datos reales que quieras conservar.

Además existe `db/seed.runtime.ts`, que contiene defaults de runtime no destructivos como:
- `AppSetting`
- `OpeningHour`
- `LoyaltyTier`
- migración/seed de menú V2 desde el legacy si está vacío

Ese fichero no está conectado a los scripts actuales por defecto.

## Variables de entorno

### Producción / Vercel
Necesarias para que la app SSR funcione correctamente:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sin estas variables, el build en Vercel falla a propósito para evitar sesiones rotas.

### Reseñas de Google
```env
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
```

### reCAPTCHA
```env
PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

### SMTP / newsletter
```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_FROM=
SMTP_REPLY_TO=
SMTP_USER=
SMTP_PASS=
```

### Blob storage
```env
BLOB_READ_WRITE_TOKEN=
```

## Estructura principal

```text
/db
  config.ts
  seed.ts
  seed.runtime.ts
/public
  images/
  assets/
/src
  components/
  features/
  islands/
  layouts/
  pages/
```

### Zonas clave del proyecto
- `db/config.ts`: schema completo de Astro DB.
- `db/seed.ts`: seed principal de catálogo.
- `db/seed.runtime.ts`: defaults operativos/runtime.
- `src/pages/api/checkout/submit.ts`: creación de pedido.
- `src/islands/product/ProductConfiguratorModal.tsx`: personalización del producto.
- `src/islands/cart/CartDrawer.tsx`: carrito.
- `src/islands/upsell/UpsellModal.tsx`: upsell.
- `src/pages/admin/**`: backoffice.

## Flujo de datos principal

### Pedido
1. El cliente navega por `/pedir`, `/carta` o `/menu`.
2. Abre el configurador del producto.
3. Añade al carrito.
4. Checkout valida disponibilidad y cupones.
5. Se crea el pedido y sus líneas.
6. El pedido se consulta desde `/pedido/[publicId]`.

### Loyalty
- El proyecto tiene tablas de loyalty (`UserProfile`, `LoyaltyTier`, `LoyaltyLedger`).
- La representación visual y el awarding dependen de la configuración y de que existan tiers sembrados.

## Imágenes

### Productos
- Las imágenes viven en `public/images/products`.
- El seed intenta mapear imágenes por slug/nombre.

### Ingredientes
- Las imágenes viven en `public/images/ingredients`.
- Si no hay match exacto, se usa `placeholder.svg`.
- Algunas familias se resuelven por reglas (`queso`, `pollo`, `beicon`, `salsas`, etc.).
- En admin ya se puede editar `imageUrl` manualmente por ingrediente.

## Desarrollo local recomendado

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Después abre:
- `http://localhost:4321`
- `http://localhost:4321/admin`

## Deploy en Vercel

### Estado actual del repo
- El proyecto usa `@astrojs/vercel` con `output: "server"`.
- El build usa `astro build --remote`.
- El deploy **no ejecuta seeds remotos automáticamente**.

### Qué implica
Si la base remota está vacía y haces deploy sin poblarla antes, te faltarán datos como:
- catálogo base
- imágenes resueltas en DB
- horarios
- tiers de loyalty
- configuraciones operativas

### Recomendación mínima
1. Configurar variables de entorno en Vercel.
2. Ejecutar `npm run db:push:remote`.
3. Poblar remoto con cuidado según el estado real de la base.

## Estado del proyecto

El proyecto está orientado a una versión avanzada/casi final del producto, con:
- front público funcional,
- admin amplio,
- catálogo rico,
- configurador de producto,
- upsell,
- loyalty,
- newsletter,
- cocina,
- auditoría.

Aun así, antes de producción conviene revisar especialmente:
- estrategia de seed/bootstrap remoto,
- hardening de deploy,
- integraciones externas,
- smoke tests completos de compra y administración.

## Licencia

Uso interno / proyecto privado.
