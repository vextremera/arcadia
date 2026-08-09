# Impresoras — puesta en marcha

Guía operativa para dejar imprimiendo los tickets y las comandas del local.
Va de principio a fin: desde la impresora recién sacada de la caja hasta ver
salir el primer papel de un pedido real.

Para el detalle técnico del proceso puente, ver
[`tools/print-bridge/README.md`](../tools/print-bridge/README.md).

---

## Antes de empezar

Necesitas cuatro cosas:

| | Qué | Por qué |
|---|---|---|
| 1 | Impresora térmica ESC/POS con Ethernet (HIPOS SOL801, 80mm) | La que va a sacar el papel |
| 2 | Un equipo encendido en el local | Abre la conexión con la impresora. Ver abajo |
| 3 | Acceso al router del local | Para fijar la IP de la impresora |
| 4 | Acceso al panel de Vercel | Para configurar el token |

### Por qué hace falta un equipo en el local

Es la parte que sorprende, así que conviene entenderla antes de montar nada.

La impresora tiene Ethernet y una IP como `192.168.1.50`. Esa dirección **sólo
existe dentro de la red del restaurante**. La app corre en Vercel, en internet,
y no puede abrir una conexión contra una IP privada: no hay ninguna ruta hasta
ella.

La solución aparente sería abrir el puerto 9100 en el router para que se pueda
llegar desde fuera. **No lo hagas.** El protocolo ESC/POS sobre el puerto 9100
no tiene autenticación de ningún tipo: no hay usuario, ni contraseña, ni
comprobación de nada. Cualquiera que escanee ese rango de internet —y se escanea
constantemente— podría imprimir lo que quisiera, gastar todo el rollo de papel o
dejar la cola bloqueada. Es un problema conocido y bastante habitual en
hostelería.

Por eso la conexión se invierte: un proceso pequeño (el *bridge*) corre dentro
del local y **pregunta** cada pocos segundos si hay algo que imprimir. Sólo hace
conexiones salientes, igual que un navegador.

```
   Vercel  ──────(nada entra)──────X──────  Router del local
      ▲                                        │
      │  HTTPS saliente                        │  LAN
      │  "¿hay trabajos?"                      │
      └──────────── bridge ────────────────────┴────►  impresora :9100
                (equipo del local)
```

Ventaja añadida: no hay que abrir ningún puerto ni tocar la configuración del
router.

**Qué equipo sirve:** el PC del TPV, un mini PC, o una Raspberry Pi. Consume
prácticamente nada. Lo único importante es que esté encendido durante el
servicio y en la misma red que las impresoras.

**Si ese equipo se apaga o se cae internet:** no sale papel, pero **no se pierde
ningún pedido**. Los trabajos se quedan encolados en el servidor y salen en
cuanto vuelva. Los pedidos siguen entrando con normalidad; la cocina puede
trabajar mientras tanto desde `/admin/cocina`.

---

## Paso 1 · Fijar la IP de la impresora

Si la IP cambia, deja de imprimir. Hay que fijarla.

1. Con la impresora apagada, mantén pulsado **FEED** mientras la enciendes.
   Saldrá la página de autotest con su IP actual.
2. Entra a esa IP desde un navegador del local y asígnale una IP estática dentro
   del rango de tu router (por ejemplo `192.168.1.50`).

   Alternativa recomendada si el router lo permite: deja la impresora en DHCP y
   haz una **reserva por MAC** en el router. Es más robusto, porque la
   configuración vive en un solo sitio.
3. Comprueba desde el equipo del local que responde:

```bash
node -e "require('net').connect(9100,'192.168.1.50',()=>{console.log('OK');process.exit(0)}).on('error',e=>{console.log('FALLO',e.message);process.exit(1)})"
```

Debe imprimir `OK`. Si dice `FALLO`, la impresora no es alcanzable y no tiene
sentido seguir: revisa el cable, la IP y que ambos equipos estén en la misma
subred.

> **Repite este paso por cada impresora.** Lo habitual es tener dos: una de
> cocina para las comandas y una de barra o mostrador para los tickets.

---

## Paso 2 · Configurar el token en Vercel

El bridge se identifica con un secreto compartido. Genéralo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

En Vercel → tu proyecto → **Settings → Environment Variables**, añade:

| Variable | Valor |
|---|---|
| `PRINT_BRIDGE_TOKEN` | el valor generado |

Guarda el token: lo necesitas otra vez en el paso 3.

> **Sin esta variable, `/api/print/poll` responde 401 a todo y no se imprime
> nada.** Es intencionado. Esa ruta queda fuera del middleware que protege
> `/admin`, así que el token es lo único que impide que cualquiera lea los
> pedidos del día. Se prefiere que falle cerrado antes que quedar abierta.

Después de añadir la variable hay que **volver a desplegar** para que la coja.

---

## Paso 3 · Instalar el bridge en el local

Copia la carpeta `tools/print-bridge/` al equipo del local. Necesita **Node 18 o
superior** y nada más: no tiene dependencias que instalar.

Prueba primero a mano, para ver los mensajes:

```bash
ARCADIA_URL=https://tu-dominio.com PRINT_BRIDGE_TOKEN=el-token-del-paso-2 node bridge.mjs
```

En Windows (PowerShell):

```powershell
$env:ARCADIA_URL="https://tu-dominio.com"; $env:PRINT_BRIDGE_TOKEN="el-token-del-paso-2"; node bridge.mjs
```

Debe quedarse mostrando `Bridge iniciado. Sondeando ...`. Si aparece `Token
rechazado`, el valor no coincide con el de Vercel o falta el redespliegue.

Cuando funcione, déjalo como servicio para que arranque solo al encender el
equipo — las recetas de **NSSM** (Windows) y **systemd** (Linux) están en
[`tools/print-bridge/README.md`](../tools/print-bridge/README.md).

---

## Paso 4 · Dar de alta las impresoras en el admin

En **`/admin/impresoras` → «+ Añadir impresora»**:

| Campo | Qué poner |
|---|---|
| **Nombre** | Cómo la llamáis en el local: «Cocina», «Barra» |
| **Ubicación** | Opcional, para orientarse |
| **Dirección IP** | La IP fija del paso 1 |
| **Puerto** | `9100` salvo que la hayas cambiado |
| **Tipo** | **Comanda cocina** o **Ticket cliente** — ver abajo |
| **Ancho de papel** | `80 mm` para la SOL801 |
| **Plantilla** | Opcional, se gestionan en `/admin/tickets` |
| **Imprimir pedidos automáticamente** | Marcado para que salga sola al entrar el pedido |

### La diferencia entre los dos tipos

No es cosmética, cambia qué se imprime:

- **Comanda cocina** — sin precios ni totales. Letra grande y los cambios sobre
  el producto destacados (`SIN cebolla`, `+ jalapeños`, `> salsa barbacoa`), que
  es lo único que hace falta leer de un vistazo mientras se cocina.
- **Ticket cliente** — importes por línea, subtotal, envío, descuento, total,
  forma de pago y datos de entrega.

Lo normal es tener una de cada. Si tienes dos impresoras del mismo tipo, cada
pedido sale por las dos.

---

## Paso 5 · La prueba de impresión

Pulsa **Imprimir prueba** en la impresora recién dada de alta.

Ojo: ese botón **no imprime en el momento**, encola. El papel sale unos segundos
después, cuando el bridge recoja el trabajo. Es el comportamiento correcto.

En el papel, comprueba estas tres cosas:

1. **El ancho.** La línea de guiones debe llegar de borde a borde sin partirse.
   Si se parte en dos líneas, el ancho de papel está mal configurado.
2. **Los acentos.** Debe leerse `áéíóú ÁÉÍÓÚ ñÑ çÇ àèòï`. Si salen símbolos
   raros, la impresora no está usando la tabla de códigos esperada.
3. **El euro.** La línea de símbolos lleva `12,34 €`. Si el € sale como otro
   carácter, esa unidad no tiene el glifo en su ROM — avisa, porque entonces hay
   que cambiar los importes a `EUR` en el código.

También debe **cortar el papel** al terminar.

---

## Cómo saber si está funcionando

En `/admin/impresoras`:

- **CONECTADA** significa que el bridge consiguió abrir el socket contra esa
  impresora hace menos de 3 minutos. **No es un interruptor**: es un hecho
  reportado desde el local. No se puede marcar a mano a propósito, porque un
  estado que alguien puso a dedo no sirve para diagnosticar nada.
- **SIN SEÑAL** + aviso naranja de que el puente no ha contactado nunca = el
  bridge no está corriendo, o el token no coincide.
- La **cola** muestra el resultado real de cada trabajo, con el error concreto
  si falló.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Aviso naranja «el puente no ha contactado» | El bridge no corre | Arráncalo en el equipo del local |
| El bridge dice `Token rechazado` | Token distinto en Vercel y en el bridge | Iguálalos y **redespliega** Vercel |
| `CONECTADA` pero no sale papel | Sin papel, tapa abierta o atasco | Revisa la impresora físicamente |
| Trabajos en `Error: Timeout conectando` | La IP cambió o la impresora está apagada | Repite el paso 1 y fija la IP |
| Salen símbolos raros donde van los acentos | Tabla de códigos distinta | Avisa: hay que ajustar el mapa en `src/server/printing/escpos.ts` |
| El texto se parte a mitad de línea | Ancho de papel mal configurado | Cámbialo a 80 mm en la ficha de la impresora |
| Sale el ticket pero no corta | Corte deshabilitado en la impresora | Revisa su configuración |
| Salen dos copias del mismo ticket | El bridge se reinició justo tras imprimir | Es el comportamiento previsto: se prefiere repetir a perder una comanda |

---

## Qué pasa si...

**...se apaga el equipo del bridge a mitad de servicio.**
Los pedidos siguen entrando y encolándose. Al volver a arrancar, sale todo lo
pendiente. Nada se pierde.

**...se cae internet en el local.**
El bridge reintenta con una espera progresiva para no saturar. En cuanto vuelve
la conexión, imprime lo acumulado.

**...un pedido no llega a imprimirse.**
Desde la ficha del pedido, **Reimprimir comanda** lo vuelve a encolar. Esa acción
se salta el ajuste de impresión automática, porque ahí el papel se está pidiendo
a propósito, y queda registrada en la actividad del pedido.

**...un trabajo falla varias veces seguidas.**
Se reintenta hasta 5 veces y luego queda en `ERROR`, visible en la cola. El tope
existe para que un atasco de papel no acabe escupiendo veinte copias del mismo
ticket cuando alguien lo arregle.

**...hay que cambiar el diseño del ticket.**
En `/admin/tickets`. Los cambios afectan a los pedidos nuevos: los trabajos ya
encolados guardan el ticket tal y como estaba al generarse.

---

## Notas técnicas

- Los tickets se generan **en el servidor** y viajan ya en ESC/POS. El bridge no
  interpreta nada: abre el socket y vuelca bytes.
- La codificación es **CP858** (CP850 más el euro en `0xD5`). Mandar UTF-8 crudo
  a una térmica no da error: imprime basura, que es peor porque no se detecta
  hasta ver el papel.
- 80 mm de papel son 72 mm imprimibles = 576 puntos = **48 caracteres** por línea
  en Font A. En 58 mm son 32.
- El bridge no guarda nada en disco ni abre ningún puerto de escucha.
