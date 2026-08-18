/**
 * Canales de venta de un producto.
 *
 * Sólo hay dos: CARTA (se ofrece en el local) y DOMICILIO (se puede pedir a
 * casa). Antes había un tercero, «recogida», que no era un canal del producto
 * sino un tipo de pedido del checkout: nada filtraba por él y los 157 productos
 * lo tenían activado, así que sólo añadía ruido a la ficha.
 *
 * Los códigos de columna (`dineInEnabled`, `deliveryEnabled`) se conservan
 * porque renombrarlos obligaría a borrar y recrear la columna, perdiendo el
 * dato de qué productos están en cada canal.
 */

export type ProductChannel = "CARTA" | "DOMICILIO";

export const PRODUCT_CHANNELS: readonly ProductChannel[] = ["CARTA", "DOMICILIO"];

export const PRODUCT_CHANNEL_LABEL: Record<ProductChannel, string> = {
  CARTA: "Carta",
  DOMICILIO: "Domicilio",
};

/** Nombre del campo de formulario y de columna que respalda cada canal. */
export const PRODUCT_CHANNEL_FIELD: Record<ProductChannel, "dineInEnabled" | "deliveryEnabled"> = {
  CARTA: "dineInEnabled",
  DOMICILIO: "deliveryEnabled",
};

type ChannelFlags = { dineInEnabled?: boolean | null; deliveryEnabled?: boolean | null };

export function hasChannel(product: ChannelFlags, channel: ProductChannel): boolean {
  return Boolean(product[PRODUCT_CHANNEL_FIELD[channel]]);
}

/** Canales activos de un producto, para pintarlos. */
export function productChannels(product: ChannelFlags): ProductChannel[] {
  return PRODUCT_CHANNELS.filter((channel) => hasChannel(product, channel));
}
