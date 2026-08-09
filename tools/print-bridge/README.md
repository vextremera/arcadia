# Puente de impresión (print bridge)

Conecta las impresoras térmicas del local con la app desplegada en Vercel.

## Por qué hace falta

La app corre en Vercel. Una función serverless **no puede abrir un socket contra
`192.168.1.x`**: esa IP sólo existe dentro de la red del restaurante. Da igual
que la impresora tenga Ethernet — es alcanzable desde el local, no desde
internet.

La alternativa "obvia" sería abrir el puerto 9100 en el router hacia internet.
**No lo hagas.** El puerto 9100 de ESC/POS no tiene ningún tipo de
autenticación: cualquiera que escanee ese rango puede imprimir lo que quiera,
gastar todo el papel o dejar la cola bloqueada.

Por eso el bridge invierte la dirección: en vez de que el servidor llame a la
impresora, un proceso dentro del local pregunta cada pocos segundos si hay algo
que imprimir. Sólo hace conexiones **salientes**, así que no hay que abrir
ningún puerto ni tocar la configuración del router.

```
Vercel  ──(nada entra)──X──  Router
   ▲                            │
   │ HTTPS saliente             │ LAN
   └──────── bridge ────────────┴──► impresora :9100
```

## Requisitos

- Un equipo encendido en la misma red que las impresoras: el PC del TPV, un mini
  PC o una Raspberry Pi. Si ese equipo se apaga, no sale papel — los pedidos
  siguen encolándose y salen al volver.
- Node 18 o superior.
- Cada impresora con **IP fija** (o reserva DHCP por MAC en el router). Si la IP
  baila, deja de imprimir.

## Configurar la impresora (HIPOS SOL801)

1. Con la impresora encendida, mantén pulsado FEED mientras la enciendes para
   imprimir la página de autotest: ahí sale su IP actual.
2. Entra a esa IP por navegador y fíjale una IP estática dentro del rango de tu
   router (por ejemplo `192.168.1.50`), o haz la reserva por MAC en el router.
3. Comprueba que responde:

```bash
node -e "require('net').connect(9100,'192.168.1.50',()=>{console.log('OK');process.exit(0)}).on('error',e=>{console.log('FALLO',e.message);process.exit(1)})"
```

4. Da de alta la impresora en `/admin/impresoras` con esa IP y el puerto 9100.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ARCADIA_URL` | URL pública de la app, p. ej. `https://arcadia.vercel.app` |
| `PRINT_BRIDGE_TOKEN` | Secreto compartido. **El mismo valor** en Vercel y aquí |
| `POLL_INTERVAL_MS` | Opcional, por defecto `4000` |

Genera el token con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ponlo en Vercel como `PRINT_BRIDGE_TOKEN` y úsalo también al arrancar el bridge.
Sin esa variable en el servidor, `/api/print/poll` responde 401 a todo: es
deliberado, porque esa ruta queda fuera del middleware de admin y el token es lo
único que la protege.

## Arrancar

```bash
ARCADIA_URL=https://tu-dominio.com PRINT_BRIDGE_TOKEN=xxxxx node bridge.mjs
```

En Windows (PowerShell):

```powershell
$env:ARCADIA_URL="https://tu-dominio.com"; $env:PRINT_BRIDGE_TOKEN="xxxxx"; node bridge.mjs
```

## Dejarlo corriendo siempre

**Windows** — con [NSSM](https://nssm.cc/) para que arranque como servicio:

```bash
nssm install ArcadiaPrintBridge "C:\Program Files\nodejs\node.exe" "C:\arcadia\bridge.mjs"
nssm set ArcadiaPrintBridge AppEnvironmentExtra ARCADIA_URL=https://tu-dominio.com PRINT_BRIDGE_TOKEN=xxxxx
nssm start ArcadiaPrintBridge
```

**Linux / Raspberry Pi** — con systemd en `/etc/systemd/system/arcadia-print.service`:

```ini
[Unit]
Description=Arcadia print bridge
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/arcadia/bridge.mjs
Environment=ARCADIA_URL=https://tu-dominio.com
Environment=PRINT_BRIDGE_TOKEN=xxxxx
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now arcadia-print
```

## Cómo saber si funciona

En `/admin/impresoras`:

- **Conectada** significa que el bridge abrió el socket contra esa impresora
  hace menos de 3 minutos. No es un interruptor: es un hecho reportado.
- **Sin señal** con el aviso de que el puente no ha contactado nunca = el bridge
  no está corriendo o el token no coincide.
- La cola muestra el resultado real de cada trabajo, con el error si falló.

Un trabajo entregado al bridge que no recibe confirmación en 60 segundos vuelve
a la cola solo. Tras 5 intentos queda en `ERROR` y deja de reintentarse, para no
sacar veinte copias del mismo ticket cuando alguien arregle el atasco.

## Notas

- El bridge no guarda nada en disco ni expone ningún puerto.
- Si se cae la conexión con Vercel, los `ack` pendientes se conservan en memoria
  y se reenvían al reconectar. Si el proceso muere justo ahí, el servidor
  reintentará el trabajo por timeout: es preferible un ticket repetido a una
  comanda perdida.
- Los tickets se generan en el servidor y viajan ya en ESC/POS (base64). El
  bridge no interpreta nada: sólo abre el socket y vuelca bytes.
