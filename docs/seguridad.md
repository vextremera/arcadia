# Seguridad de Arcadia

Estado tras el repaso de agosto de 2026. Recoge qué se arregló, qué protege cada
pieza y —lo más importante— qué **sigue sin cubrir**, para que nadie dé por hecha
una defensa que no existe.

## Lo que se cerró

### Un STAFF podía convertirse en ADMIN

`POST /api/admin/users` con `intent=update-user` aceptaba el campo `role` de
cualquiera que pasara el control de acceso, y ese control dejaba entrar a STAFF.
Cualquier persona con la cuenta del pase de cocina se ascendía a administrador
enviando un formulario, o desactivaba la cuenta del dueño.

Ahora el rol y el acceso sólo los cambia un ADMIN, nadie puede degradarse a sí
mismo y no se permite dejar el sistema sin ningún administrador activo.

### La API del panel no estaba en el guardián de rutas

El middleware protegía `/admin/**`, pero las rutas de la API viven en
`/api/admin/**`, que no encaja con ese prefijo. Las 38 rutas se defendían cada una
por su cuenta con la misma condición copiada. Funcionaba, pero bastaba con que una
ruta nueva olvidara copiarla para dejar abierto el catálogo, los pedidos o los
usuarios.

El middleware cubre ahora también `/api/admin/**` y responde 401 en JSON, no una
redirección a una pantalla de login que las islas no sabrían interpretar. Las
comprobaciones de cada ruta se han mantenido: si alguien toca el middleware,
siguen en pie.

### Redirección abierta al iniciar sesión

`/api/auth/login` y `/api/auth/register` devolvían al usuario a lo que viniera en
el campo `next`, sin mirarlo. Con `/login?next=https://sitio-falso/` la víctima
escribía su contraseña en el Arcadia auténtico y acababa en una copia pidiéndosela
otra vez; lo que da credibilidad al engaño es que la primera pantalla es real.

`safeInternalPath` (en `src/server/security/redirects.ts`) sólo acepta rutas
internas, y descarta aparte `//otro-dominio`, que empieza por barra como una ruta
legítima pero el navegador lee como URL absoluta.

### Fijación de sesión

Al identificarse se **reutilizaba** el identificador de sesión que ya trajera el
navegador, para conservar el carrito. Quien lograra fijar esa cookie en el
navegador de otra persona conocía de antemano un identificador que, en cuanto la
víctima entraba, pasaba a estar autenticado como ella.

Ahora se llama a `session.regenerate()`, que crea un identificador nuevo,
conserva los datos (el carrito sigue donde estaba) y borra la sesión anterior del
almacén.

### Intentos de contraseña sin límite

No había ningún freno en el login de clientes ni en el del panel. El del panel
además no tiene captcha.

`src/server/security/rateLimit.ts` cuenta intentos por IP en Upstash Redis, que ya
es obligatorio en producción para las sesiones. Tiene que ser un contador
compartido: en Vercel cada petición puede caer en una instancia distinta, así que
uno en memoria apenas cuenta.

| Endpoint | Límite | Por qué |
| --- | --- | --- |
| `/api/admin/login` | 5 / min | Sin captcha y con el panel entero detrás |
| `/api/auth/login` | 10 / min | Tiene captcha, pero desaparece si falta la clave |
| `/api/auth/register` | 5 / hora | Altas en masa y tanteo de correos existentes |
| `/api/contact` | 5 / hora | Manda correo con la cuenta SMTP del bar |
| `/api/marketing/subscribe` | 10 / hora | Ensuciar la lista de correo |
| `/api/checkout/coupon` | 30 / min | Recorrer códigos hasta dar con una promoción |
| `/api/checkout/submit` | 20 / hora | Comandas falsas saliendo por la impresora |
| `/api/delivery/check` | 20 / min | Atasca la cola de Nominatim de todos los clientes |

### Se podía saber qué correos están registrados

El login salía antes de comprobar la contraseña cuando el usuario no existía, y
comprobarla cuesta unos milisegundos medibles. La diferencia de tiempo entre las
dos respuestas permitía recorrer una lista de correos y ver cuáles tienen cuenta
en el restaurante, sin acertar ni una contraseña. Ahora siempre se comprueba algo,
contra un hash de descarte si hace falta.

### Inyección de HTML en el correo de contacto

El nombre, el asunto y el mensaje se metían tal cual en el cuerpo HTML del correo
que recibe el restaurante. Con `<a href="https://sitio-falso">Pincha aquí</a>` el
personal veía un enlace de aspecto legítimo dentro de un correo que sí salía de la
web. Ahora todo va escapado, y el email se valida antes de usarlo como `Reply-To`.

### Una hoja de estilos de terceros en todas las páginas

`SiteLayout.astro` cargaba 28 KB de CSS desde jsdelivr en cada página, para usar
cuatro de sus doscientas cincuenta banderas. Quien pudiera alterar ese fichero —o
mover la etiqueta de git a la que apuntaba, que no es inmutable— inyectaba CSS en
todo el sitio; con CSS se puede tapar la interfaz o sacar datos por selectores de
atributo. Las cuatro banderas están ahora en `public/images/flags/`.

### `clientAddress` tumbaba las peticiones

`Astro.clientAddress` **lanza una excepción** cuando el adaptador no la puede
resolver, y el de Vercel la saca de `x-forwarded-for`. Basta con nombrarla al
desestructurar el contexto de la ruta para que salte, así que un endpoint que la
pidiera respondía 500 en cuanto esa cabecera faltaba o no traía una IP válida. El
login ya lo hacía antes de este repaso, para el captcha.

Se lee siempre desde `clientKey()`, protegida, y nunca en la firma de la ruta.

### Cabeceras de seguridad

No se enviaba ninguna. Ahora, desde `src/server/security/headers.ts`:

- `X-Frame-Options: DENY` y `frame-ancestors 'none'` — el panel no se puede
  incrustar en una página ajena para robar clics.
- `X-Content-Type-Options: nosniff` — el navegador deja de adivinar el tipo.
- `Referrer-Policy: strict-origin-when-cross-origin` — al salir a un dominio
  externo no viaja la ruta, que en el seguimiento de pedidos lleva el `publicId`.
- `Permissions-Policy` — cámara, micrófono, ubicación y pago denegados.
- `Strict-Transport-Security` sólo bajo https, sin `preload` (entrar en esa lista
  es difícil de revertir y afecta a todos los subdominios).
- `Cache-Control: no-store` en `/admin`, `/cuenta` y `/api`, para que una caché
  compartida no sirva datos de un cliente a otro.

## Lo que sigue sin estar cubierto

### La CSP no protege contra scripts inyectados en el HTML

La política lleva `'unsafe-inline'` en `script-src`. **No es un descuido.** Astro
sabe generar una CSP estricta calculando el hash de cada script, pero sólo de los
que él procesa, y los diez de este proyecto son `<script is:inline>` (menú móvil,
barra lateral del panel, buscador de la carta, menú diario y festivo…). Se probó
contra el build real y el navegador bloqueaba el menú hamburguesa y buena parte
del panel. Dos de esos scripts usan `define:vars`, que **obliga** a `is:inline`.

Lo que sí aporta la política actual: un `<script src>` a un dominio ajeno no se
ejecuta, un `<base>` inyectado no puede reescribir las rutas, un formulario no
puede enviarse fuera, y las imágenes y peticiones sólo pueden ir a los destinos
previstos, que son las vías habituales para sacar datos.

**Para cerrarlo** habría que convertir esos `is:inline` en scripts que Astro
procese. Es un cambio bastante mayor que un repaso de seguridad y toca casi todo
el panel, así que conviene hacerlo aparte y con tiempo para probarlo.

### La pasarela de pago de prueba

`/api/payments/test/confirm` marca un pedido como pagado a quien conozca su
`publicId`, sin sesión ni comprobación. Es una pasarela falsa y está documentada
como tal (`raw.mode: "test-gateway"`), no mueve dinero. **Debe desaparecer el día
que se conecte una pasarela real**, no adaptarse.

### El captcha se cae solo si falta la clave

`verifyRecaptcha` devuelve `true` cuando no hay `RECAPTCHA_SECRET_KEY`, para que
en local no estorbe. Si esa variable falta en producción, el captcha desaparece
sin avisar. El límite por IP es ahora la red de seguridad, pero conviene
comprobar que la variable está puesta.

### El límite de peticiones se abre si Redis falla

`checkRateLimit` deja pasar si Upstash no responde: quedarse sin contador no debe
dejar al restaurante sin poder recibir pedidos. El riesgo se asume porque el
límite nunca debería ser la única defensa de nada.

## Lo que ya estaba bien

- **Contraseñas**: scrypt con N=16384, sal por usuario y comparación en tiempo
  constante (`src/server/auth/password.ts`).
- **SQL**: todo pasa por Drizzle con parámetros. No hay una sola consulta armada
  con cadenas.
- **Direcciones de cliente**: todas las consultas de `/api/account/addresses`
  filtran por `userId`; no se puede leer ni tocar la dirección de otro.
- **CSRF**: Astro comprueba el `Origin` de los envíos por defecto. Verificado: un
  POST sin esa cabecera recibe 403.
- **Cookie de sesión**: `httpOnly`, `sameSite=lax` y `secure` en producción, por
  defecto de Astro.
- **OAuth de Google**: el `state` se genera, se guarda en sesión y se compara al
  volver; y ya filtraba el `next` correctamente.
- **Puente de impresión**: `/api/print/poll` compara el token en tiempo constante
  y falla cerrado si `PRINT_BRIDGE_TOKEN` no está configurado.

## Cómo se comprobó

La CSP y las cabeceras **no se pueden verificar con `astro dev`**: Astro sólo
inyecta la política en el build. Se compiló con

```bash
ASTRO_DATABASE_FILE="file:///ruta/al/.astro/content.db" npx astro build
```

y se sirvió la función resultante
(`.vercel/output/functions/_render.func/dist/server/entry.mjs`, que exporta un
objeto con `fetch`) desde un servidor mínimo, para recorrer las páginas con el
navegador escuchando `securitypolicyviolation`. Así apareció el bloqueo del menú
móvil, que en desarrollo no se veía.

Los ataques se reprodujeron antes y después de cada arreglo: ascenso de STAFF a
ADMIN, redirección a un dominio externo, agotamiento del límite de intentos,
rotación del identificador de sesión conservando el carrito y llamadas a la API
del panel sin sesión.
