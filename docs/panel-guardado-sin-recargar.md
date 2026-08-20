# Guardado sin recargar en el panel

Cómo se quitó el parpadeo al guardar en `/admin`, y qué implica.

## El problema

Los 82 formularios del panel hacen `POST` a `/api/admin/**`, y esas rutas
responden con una redirección a la misma pantalla con `?saved=…` o `?error=…`.
Es simple y funciona sin JavaScript, pero cada guardado repinta la página
entera: parpadeo, el scroll de vuelta al principio y los desplegables cerrados.
Editando un producto —veintinueve formularios en una sola pantalla— eso cansa
de verdad.

## Lo que se hizo

Una capa que intercepta el envío, hace la misma petición por detrás, sigue la
redirección y cambia **sólo el contenido de `<main>`** con el HTML que devuelve
el servidor. La barra lateral, la cabecera y el scroll se quedan donde estaban.

Vive en `src/scripts/adminAjax.ts` y se carga una vez desde `AdminLayout.astro`.

**No hubo que tocar ni un formulario ni una ruta de la API.** Los 82 siguen
siendo HTML normal y las 36 rutas siguen redirigiendo igual: si el script no
carga, todo funciona como antes.

No es una idea nueva en este proyecto: es lo que ya hacían a mano las pantallas
de menú diario y festivo, sacado a un sitio para que valga en todas.

### Qué se conserva al guardar

- El scroll dentro del contenido
- Los `<details>` que estuvieran abiertos
- El foco, si el elemento tiene `id`
- El estado de la barra lateral (plegada o no), que ni se toca

### El aviso

El banner de la página sigue estando arriba del contenido, pero además sale un
aviso flotante abajo. Si guardas un formulario que queda a media pantalla, el
banner no se vería sin subir — y subir sola es justo lo que molestaba.

El resultado se decide por la URL a la que redirige el servidor (`?saved=` o
`?error=`), no por el aspecto del HTML. Se intentó al revés y salió mal: buscar
"el primer recuadro verde" cogía la insignia **Admin total** de la pantalla de
Equipo y la mostraba como si fuera el resultado de guardar.

## Lo que sigue igual (a propósito)

**El servidor renderiza la página completa.** Esto no es una API que devuelva
sólo el campo que cambió: la respuesta es el HTML entero de la pantalla. Lo que
se elimina es el repintado del navegador, que es lo que se nota. Hacerlo "de
verdad" —JSON y actualizar el DOM a mano— obligaría a escribir la lógica de
actualización de cada una de las veintiséis pantallas, y a mantenerla.

**Si el servidor manda a otra pantalla, se navega de verdad.** Un borrado que
vuelve al listado hace una navegación completa: cambiar sólo el `<main>` dejaría
la barra lateral señalando una sección que ya no se está viendo.

**Ante la duda, se rinde.** Si la red falla, si la respuesta no trae un `<main>`
reconocible o si pasa cualquier cosa rara, deja que el navegador envíe el
formulario como siempre. Vale más un parpadeo que una pantalla a medias.

## Detalles que costaron

### Los `<script>` inline no se ejecutan solos

Asignar `innerHTML` inserta las etiquetas `<script>` pero el navegador no las
ejecuta, por diseño. Sin hacer nada, pantallas como Tickets o Newsletter
perdían su comportamiento en cuanto se guardaba algo dentro de ellas.

La capa los vuelve a crear para que corran. Y por eso hubo que cambiar dos
pantallas que arrancaban con `DOMContentLoaded`: ese evento no se dispara otra
vez, así que su script se re-ejecutaba pero no hacía nada. Ahora se llaman
directamente, que además es lo correcto — el script va detrás del marcado que
necesita.

**Si escribes un `<script>` nuevo en una pantalla del panel, no lo cuelgues de
`DOMContentLoaded`.**

### Las pantallas que ya se apañaban solas

Menú diario y festivo traen su propia versión de esto. Sus formularios llaman a
`preventDefault()` desde un listener que está más abajo en el árbol, así que ya
ha corrido cuando llega el de aquí: la capa comprueba `defaultPrevented` y se
aparta. También se puede marcar un formulario con `data-no-ajax` para excluirlo.

### Los modales

Al guardar desde un modal, el contenido se reconstruye y el modal queda cerrado.
Es lo mismo que pasaba recargando, así que no cambia nada — pero conviene
saberlo: **si el guardado falla, lo que estaba escrito en el modal se pierde** y
sólo queda el aviso. Eso ya era así antes.

## Cómo se comprobó

La prueba clave es marcar la instancia de la página (`window.__vida = …`) antes
de guardar y comprobar que sigue ahí después: si sobrevive, no hubo recarga.

Verificado en desarrollo y contra el build real (con la CSP puesta, cero
violaciones):

- **Operativa**: guarda, conserva el scroll en 500 px, sale el aviso, el valor
  vuelve del servidor y se comprobó en la base de datos.
- **Equipo**: error (aviso rojo con el mensaje real) y éxito (aviso verde, la
  fila nueva aparece en la tabla), ambos sin recargar.
- **Equipo → borrar**: navegación completa al listado, como debe ser.
- **Tickets**: tras guardar, la vista previa del ticket **sigue reaccionando** —
  el script inline se volvió a enganchar.
- **Producto (29 formularios)**: sin recargar, scroll intacto en 900 px, y el
  encabezado de la cabecera y el título del documento actualizados al renombrar.

Queda sin probar de punta a punta la **subida de imagen**: `FormData` maneja los
ficheros de forma nativa y el navegador pone el `multipart` por su cuenta, pero
en local no hay `BLOB_READ_WRITE_TOKEN` y no se llegó a subir una imagen real.
