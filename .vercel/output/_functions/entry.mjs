import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BYzNZonL.mjs';
import { manifest } from './manifest_B_HPQJBD.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/ajustes/fees.astro.mjs');
const _page2 = () => import('./pages/admin/ajustes/pagos.astro.mjs');
const _page3 = () => import('./pages/admin/catalogo/alergenos.astro.mjs');
const _page4 = () => import('./pages/admin/catalogo/compatibilidades.astro.mjs');
const _page5 = () => import('./pages/admin/catalogo/ingredientes.astro.mjs');
const _page6 = () => import('./pages/admin/catalogo/modificadores.astro.mjs');
const _page7 = () => import('./pages/admin/catalogo/productos/nuevo.astro.mjs');
const _page8 = () => import('./pages/admin/catalogo/productos/_id_.astro.mjs');
const _page9 = () => import('./pages/admin/catalogo/productos.astro.mjs');
const _page10 = () => import('./pages/admin/categorias.astro.mjs');
const _page11 = () => import('./pages/admin/cocina.astro.mjs');
const _page12 = () => import('./pages/admin/cupones.astro.mjs');
const _page13 = () => import('./pages/admin/login.astro.mjs');
const _page14 = () => import('./pages/admin/loyalty.astro.mjs');
const _page15 = () => import('./pages/admin/menu.astro.mjs');
const _page16 = () => import('./pages/admin/newsletter.astro.mjs');
const _page17 = () => import('./pages/admin/operativa.astro.mjs');
const _page18 = () => import('./pages/admin/pedidos/ticket/_publicid_.astro.mjs');
const _page19 = () => import('./pages/admin/pedidos/_publicid_.astro.mjs');
const _page20 = () => import('./pages/admin/pedidos.astro.mjs');
const _page21 = () => import('./pages/admin/upsell.astro.mjs');
const _page22 = () => import('./pages/admin/usuarios.astro.mjs');
const _page23 = () => import('./pages/admin.astro.mjs');
const _page24 = () => import('./pages/api/account/addresses.astro.mjs');
const _page25 = () => import('./pages/api/account/profile.astro.mjs');
const _page26 = () => import('./pages/api/admin/allergens.astro.mjs');
const _page27 = () => import('./pages/api/admin/categories.astro.mjs');
const _page28 = () => import('./pages/api/admin/category-ingredients.astro.mjs');
const _page29 = () => import('./pages/api/admin/coupons.astro.mjs');
const _page30 = () => import('./pages/api/admin/ingredients.astro.mjs');
const _page31 = () => import('./pages/api/admin/kitchen/orders.astro.mjs');
const _page32 = () => import('./pages/api/admin/login.astro.mjs');
const _page33 = () => import('./pages/api/admin/logout.astro.mjs');
const _page34 = () => import('./pages/api/admin/loyalty-tiers.astro.mjs');
const _page35 = () => import('./pages/api/admin/menu-v2.astro.mjs');
const _page36 = () => import('./pages/api/admin/menus/_id_/items.astro.mjs');
const _page37 = () => import('./pages/api/admin/menus.astro.mjs');
const _page38 = () => import('./pages/api/admin/modifier-groups/_id_/options.astro.mjs');
const _page39 = () => import('./pages/api/admin/modifier-groups.astro.mjs');
const _page40 = () => import('./pages/api/admin/newsletter.astro.mjs');
const _page41 = () => import('./pages/api/admin/operativa/hours.astro.mjs');
const _page42 = () => import('./pages/api/admin/operativa/save.astro.mjs');
const _page43 = () => import('./pages/api/admin/operativa/special-dates.astro.mjs');
const _page44 = () => import('./pages/api/admin/orders/_publicid_/update.astro.mjs');
const _page45 = () => import('./pages/api/admin/products/new.astro.mjs');
const _page46 = () => import('./pages/api/admin/products/_id_/allergens.astro.mjs');
const _page47 = () => import('./pages/api/admin/products/_id_/ingredients.astro.mjs');
const _page48 = () => import('./pages/api/admin/products/_id_/modifier-groups.astro.mjs');
const _page49 = () => import('./pages/api/admin/products/_id_/variants.astro.mjs');
const _page50 = () => import('./pages/api/admin/products/_id_.astro.mjs');
const _page51 = () => import('./pages/api/admin/settings/fees.astro.mjs');
const _page52 = () => import('./pages/api/admin/settings/payments.astro.mjs');
const _page53 = () => import('./pages/api/admin/upsell/add.astro.mjs');
const _page54 = () => import('./pages/api/admin/upsell/delete.astro.mjs');
const _page55 = () => import('./pages/api/admin/upsell/update.astro.mjs');
const _page56 = () => import('./pages/api/admin/users.astro.mjs');
const _page57 = () => import('./pages/api/auth/login.astro.mjs');
const _page58 = () => import('./pages/api/auth/logout.astro.mjs');
const _page59 = () => import('./pages/api/auth/register.astro.mjs');
const _page60 = () => import('./pages/api/cart/add.astro.mjs');
const _page61 = () => import('./pages/api/cart/clear.astro.mjs');
const _page62 = () => import('./pages/api/cart/remove.astro.mjs');
const _page63 = () => import('./pages/api/cart/set-qty.astro.mjs');
const _page64 = () => import('./pages/api/cart/summary.astro.mjs');
const _page65 = () => import('./pages/api/cart.astro.mjs');
const _page66 = () => import('./pages/api/catalog/categories/_id_/products.astro.mjs');
const _page67 = () => import('./pages/api/catalog/categories.astro.mjs');
const _page68 = () => import('./pages/api/catalog/menu.astro.mjs');
const _page69 = () => import('./pages/api/catalog/upsell.astro.mjs');
const _page70 = () => import('./pages/api/checkout/availability.astro.mjs');
const _page71 = () => import('./pages/api/checkout/coupon.astro.mjs');
const _page72 = () => import('./pages/api/checkout/submit.astro.mjs');
const _page73 = () => import('./pages/api/home/reviews.astro.mjs');
const _page74 = () => import('./pages/api/marketing/subscribe.astro.mjs');
const _page75 = () => import('./pages/api/products/_id_.astro.mjs');
const _page76 = () => import('./pages/api/settings/payments.astro.mjs');
const _page77 = () => import('./pages/carta/_categoria_.astro.mjs');
const _page78 = () => import('./pages/carta.astro.mjs');
const _page79 = () => import('./pages/checkout.astro.mjs');
const _page80 = () => import('./pages/cuenta/pedidos.astro.mjs');
const _page81 = () => import('./pages/cuenta.astro.mjs');
const _page82 = () => import('./pages/login.astro.mjs');
const _page83 = () => import('./pages/menu.astro.mjs');
const _page84 = () => import('./pages/pedido/_publicid_.astro.mjs');
const _page85 = () => import('./pages/pedir.astro.mjs');
const _page86 = () => import('./pages/proximamente.astro.mjs');
const _page87 = () => import('./pages/registro.astro.mjs');
const _page88 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/ajustes/fees.astro", _page1],
    ["src/pages/admin/ajustes/pagos.astro", _page2],
    ["src/pages/admin/catalogo/alergenos.astro", _page3],
    ["src/pages/admin/catalogo/compatibilidades.astro", _page4],
    ["src/pages/admin/catalogo/ingredientes.astro", _page5],
    ["src/pages/admin/catalogo/modificadores.astro", _page6],
    ["src/pages/admin/catalogo/productos/nuevo.astro", _page7],
    ["src/pages/admin/catalogo/productos/[id].astro", _page8],
    ["src/pages/admin/catalogo/productos/index.astro", _page9],
    ["src/pages/admin/categorias.astro", _page10],
    ["src/pages/admin/cocina.astro", _page11],
    ["src/pages/admin/cupones.astro", _page12],
    ["src/pages/admin/login.astro", _page13],
    ["src/pages/admin/loyalty.astro", _page14],
    ["src/pages/admin/menu.astro", _page15],
    ["src/pages/admin/newsletter.astro", _page16],
    ["src/pages/admin/operativa.astro", _page17],
    ["src/pages/admin/pedidos/ticket/[publicId].astro", _page18],
    ["src/pages/admin/pedidos/[publicId].astro", _page19],
    ["src/pages/admin/pedidos/index.astro", _page20],
    ["src/pages/admin/upsell.astro", _page21],
    ["src/pages/admin/usuarios.astro", _page22],
    ["src/pages/admin/index.astro", _page23],
    ["src/pages/api/account/addresses.ts", _page24],
    ["src/pages/api/account/profile.ts", _page25],
    ["src/pages/api/admin/allergens.ts", _page26],
    ["src/pages/api/admin/categories.ts", _page27],
    ["src/pages/api/admin/category-ingredients.ts", _page28],
    ["src/pages/api/admin/coupons.ts", _page29],
    ["src/pages/api/admin/ingredients.ts", _page30],
    ["src/pages/api/admin/kitchen/orders.ts", _page31],
    ["src/pages/api/admin/login.ts", _page32],
    ["src/pages/api/admin/logout.ts", _page33],
    ["src/pages/api/admin/loyalty-tiers.ts", _page34],
    ["src/pages/api/admin/menu-v2.ts", _page35],
    ["src/pages/api/admin/menus/[id]/items.ts", _page36],
    ["src/pages/api/admin/menus.ts", _page37],
    ["src/pages/api/admin/modifier-groups/[id]/options.ts", _page38],
    ["src/pages/api/admin/modifier-groups.ts", _page39],
    ["src/pages/api/admin/newsletter.ts", _page40],
    ["src/pages/api/admin/operativa/hours.ts", _page41],
    ["src/pages/api/admin/operativa/save.ts", _page42],
    ["src/pages/api/admin/operativa/special-dates.ts", _page43],
    ["src/pages/api/admin/orders/[publicId]/update.ts", _page44],
    ["src/pages/api/admin/products/new.ts", _page45],
    ["src/pages/api/admin/products/[id]/allergens.ts", _page46],
    ["src/pages/api/admin/products/[id]/ingredients.ts", _page47],
    ["src/pages/api/admin/products/[id]/modifier-groups.ts", _page48],
    ["src/pages/api/admin/products/[id]/variants.ts", _page49],
    ["src/pages/api/admin/products/[id].ts", _page50],
    ["src/pages/api/admin/settings/fees.ts", _page51],
    ["src/pages/api/admin/settings/payments.ts", _page52],
    ["src/pages/api/admin/upsell/add.ts", _page53],
    ["src/pages/api/admin/upsell/delete.ts", _page54],
    ["src/pages/api/admin/upsell/update.ts", _page55],
    ["src/pages/api/admin/users.ts", _page56],
    ["src/pages/api/auth/login.ts", _page57],
    ["src/pages/api/auth/logout.ts", _page58],
    ["src/pages/api/auth/register.ts", _page59],
    ["src/pages/api/cart/add.ts", _page60],
    ["src/pages/api/cart/clear.ts", _page61],
    ["src/pages/api/cart/remove.ts", _page62],
    ["src/pages/api/cart/set-qty.ts", _page63],
    ["src/pages/api/cart/summary.ts", _page64],
    ["src/pages/api/cart/index.ts", _page65],
    ["src/pages/api/catalog/categories/[id]/products.ts", _page66],
    ["src/pages/api/catalog/categories/index.ts", _page67],
    ["src/pages/api/catalog/menu.ts", _page68],
    ["src/pages/api/catalog/upsell.ts", _page69],
    ["src/pages/api/checkout/availability.ts", _page70],
    ["src/pages/api/checkout/coupon.ts", _page71],
    ["src/pages/api/checkout/submit.ts", _page72],
    ["src/pages/api/home/reviews.ts", _page73],
    ["src/pages/api/marketing/subscribe.ts", _page74],
    ["src/pages/api/products/[id].ts", _page75],
    ["src/pages/api/settings/payments.ts", _page76],
    ["src/pages/carta/[categoria].astro", _page77],
    ["src/pages/carta/index.astro", _page78],
    ["src/pages/checkout.astro", _page79],
    ["src/pages/cuenta/pedidos.astro", _page80],
    ["src/pages/cuenta/index.astro", _page81],
    ["src/pages/login.astro", _page82],
    ["src/pages/menu.astro", _page83],
    ["src/pages/pedido/[publicId].astro", _page84],
    ["src/pages/pedir.astro", _page85],
    ["src/pages/proximamente.astro", _page86],
    ["src/pages/registro.astro", _page87],
    ["src/pages/index.astro", _page88]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "3627c344-cd6c-4323-a686-147c19a00b0e",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
