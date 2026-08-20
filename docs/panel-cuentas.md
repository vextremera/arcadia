# Cuentas del panel

Cómo se entra a `/admin` y quién llega a qué, desde que el acceso al panel se
separó de los clientes de la web.

## Dos tablas, no una

Antes, quien administraba el bar lo hacía con el **mismo registro** que usa un
cliente para pedir a domicilio: una fila de `User` con `role` ADMIN o STAFF. Eso
mezclaba dos cosas que no se parecen en nada — alguien que se registra con sus
puntos de fidelidad y alguien que trabaja aquí — y dejaba el acceso al panel
colgando de un campo de la tabla que alimenta el formulario público de registro.

Ahora hay una tabla propia, `AdminUser`:

| | `User` | `AdminUser` |
| --- | --- | --- |
| Quién | Clientes de la web | Personal del bar |
| Se identifica con | Correo | **Nombre de usuario** |
| Da acceso a | `/cuenta` | `/admin` |
| Se crea desde | Registro público y Google | Sólo `/admin/equipo` |

No hay ningún camino que lleve de una a la otra. Registrarse en la web no puede
acabar dando acceso al panel ni por error ni a propósito.

`User.role` sigue existiendo con los valores que tuviera, pero **ya no concede
nada**. Se conserva porque recortar el `enum` de una columna obliga a Astro DB a
recrear la tabla, y `User` tiene claves foráneas apuntándole: el despliegue se
caería. Por eso el selector de rol desapareció de la pantalla de clientes — un
desplegable que no reparte permisos sólo lleva a engaño.

## Los dos roles

Se entra con usuario y contraseña, no con correo: el personal comparte turnos y
un nombre corto se dicta y se teclea mejor que una dirección.

### Admin total (`ADMIN`)

Todo el panel, incluidas ventas, catálogo, operativa y las cuentas del equipo.

### Trabajador (`WORKER`)

Sólo lo que hace falta en un turno:

- **Pedidos** (`/admin/pedidos`), con el detalle de cada uno y su ticket
- **Cocina** (`/admin/cocina`), incluido el pase
- **Impresoras** (`/admin/impresoras`) y **tickets** (`/admin/tickets`)
- **Su cuenta** (`/admin/cuenta`), para cambiarse la contraseña

Al entrar aterriza en Pedidos, no en el panel de inicio: ese son cifras de
negocio y no es cosa de un turno.

Si escribe a mano la URL de una sección que no le toca, el middleware le devuelve
a Pedidos (y la API responde 403). Esconder un enlace no cierra nada; el reparto
real se aplica en el servidor.

### Dónde se cambia el reparto

Todo sale de `src/lib/admin/roles.ts`, en dos listas: `WORKER_PATHS` para las
pantallas y `WORKER_API_PATHS` para la API que necesitan. De ahí beben tanto el
filtro del menú lateral como el middleware, así que lo que se ve y lo que se
puede abrir no se pueden desincronizar.

Son listas de **lo permitido**, no de lo prohibido: una pantalla nueva queda
fuera del alcance del trabajador por omisión. Al revés, una sección sensible
recién creada estaría abierta hasta que alguien se acordara de vetarla.

Para dar acceso a algo más, se añade su ruta a `WORKER_PATHS` (y la de su API a
`WORKER_API_PATHS` si la pantalla llama a alguna).

## Contraseñas

- **La propia**: cada uno en `/admin/cuenta`. Se pide la contraseña actual
  aunque ya haya sesión: si el panel se queda abierto en la tablet de cocina,
  quien pase por delante no debe poder quedarse con la cuenta cambiando la clave.
- **La de otro**: un admin total la restablece desde `/admin/equipo/[id]`, sin
  necesidad de saber la anterior. Conviene que la persona la cambie después.

Mínimo ocho caracteres. No se exige la mezcla de símbolos del registro público a
propósito: son cuentas que se teclean a diario en una tablet, y una regla
retorcida acaba escrita en un papel pegado al monitor, que es peor que una
contraseña simple.

Se guardan con scrypt y sal por cuenta, igual que las de los clientes
(`src/server/auth/password.ts`). El registro de auditoría anota **que** hubo un
cambio de contraseña, nunca la contraseña ni ninguna pista sobre ella.

## Lo que no te puedes hacer a ti mismo

Un admin total no puede degradarse, desactivarse ni borrarse, y no se puede
dejar el sistema sin ningún admin activo. No es paternalismo: si el panel se
queda sin quien reparta permisos, **no hay forma de recuperarlo desde la web** —
habría que entrar a la base de datos a mano.

## La migración

`db/migrate-admin-users.ts` trae a `AdminUser` las cuentas que tuvieran ADMIN o
STAFF en `User`. Corre sola en cada despliegue, dentro de `db:migrate:remote`.

- El **usuario** sale de la parte del correo anterior a la arroba
  (`victor@arcadia.local` → `victor`). Si dos correos dan el mismo nombre, el
  primero se queda el limpio y el resto llevan sufijo.
- La **contraseña se conserva**: se copia el hash tal cual, así que cada uno
  entra con la misma de siempre, sólo que escribiendo su usuario en vez del
  correo.
- Todos entran como **admin total**. STAFF significaba "puede entrar al panel
  entero", y bajar a alguien de golpe dejaría al bar sin poder trabajar el día
  del despliegue. El reparto fino se hace después desde `/admin/equipo`.

**Sobre la idempotencia**, que aquí importa más de lo normal: la marca de que una
cuenta ya se trajo es `AdminUser.legacyUserId`, no el nombre de usuario. Mirar el
nombre no vale, porque los choques se resuelven con sufijo — y como esto corre en
**cada** despliegue, cada pasada creaba un juego nuevo de administradores en vez
de no hacer nada. Se detectó probándolo tres veces seguidas contra una base
local; conviene repetir esa prueba si se toca el fichero.

## Al desplegar

1. `AdminUser` es una tabla nueva y `AuditLog.actorAdminId` una columna añadida:
   `CREATE TABLE` y `ALTER TABLE ADD COLUMN`, sin recrear nada. Comprobado con la
   simulación del diff de Astro DB antes de subirlo.
2. La migración corre sola y deja las cuentas listas.
3. **Entra una vez y comprueba tu usuario** antes de repartir nada. Si por lo que
   fuera no hubiera ninguna cuenta en `AdminUser`, no habría forma de entrar al
   panel y habría que crear la fila a mano contra la base de datos.
4. En `/admin/equipo`, baja a Trabajador a quien corresponda.
