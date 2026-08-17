import { defineDb, defineTable, column, NOW } from "astro:db";

/**
 * Convenciones
 * - Dinero en céntimos
 * - Snapshots en pedidos para que el historial no cambie si cambia el catálogo
 * - Sessions guardan cart y user
 */

const User = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    email: column.text({ unique: true }),
    name: column.text({ optional: true }),
    googleSub: column.text({ optional: true }),
    passwordHash: column.text(),
    role: column.text({ enum: ["ADMIN", "STAFF", "CUSTOMER"], default: "CUSTOMER" }),
    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "role" }, { on: "active" }, { on: "googleSub", unique: true }]
});

const UserProfile = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.number({ references: () => User.columns.id }),
    phone: column.text({ optional: true }),
    birthday: column.text({ optional: true }),
    pointsBalance: column.number({ default: 0 }),
    tierId: column.number({ optional: true }),
    preferences: column.json({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "userId", unique: true }]
});

const NewsletterSubscriber = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    email: column.text({ unique: true }),
    userId: column.number({ optional: true, references: () => User.columns.id }),
    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "active" }, { on: "userId" }]
});

const Address = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.number({ references: () => User.columns.id }),
    label: column.text({ optional: true }),
    contactName: column.text(),
    phone: column.text(),
    line1: column.text(),
    line2: column.text({ optional: true }),
    city: column.text(),
    postalCode: column.text(),
    notes: column.text({ optional: true }),
    lat: column.number({ optional: true }),
    lng: column.number({ optional: true }),
    isDefault: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "userId" }, { on: ["userId", "isDefault"] }]
});

const TaxRate = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    rateBps: column.number(),
    active: column.boolean({ default: true })
  },
  indexes: [{ on: "active" }]
});

const Category = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true }),
    imageUrl: column.text({ optional: true })
  },
  indexes: [{ on: "sortOrder" }, { on: "active" }]
});

const Product = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    categoryId: column.number({ references: () => Category.columns.id }),
    taxRateId: column.number({ optional: true, references: () => TaxRate.columns.id }),
    name: column.text(),
    slug: column.text({ unique: true }),
    description: column.text({ optional: true }),
    details: column.text({ optional: true }),
    imageUrl: column.text({ optional: true }),
    priceCents: column.number(),

    deliveryEnabled: column.boolean({ default: true }),
    pickupEnabled: column.boolean({ default: true }),
    dineInEnabled: column.boolean({ default: true }),

    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "categoryId" }, { on: "active" }]
});

const ProductVariant = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    productId: column.number({ references: () => Product.columns.id }),
    name: column.text(),
    priceDeltaCents: column.number({ default: 0 }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true })
  },
  indexes: [{ on: "productId" }, { on: ["productId", "sortOrder"] }]
});

const Ingredient = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
    imageUrl: column.text({ optional: true }),
    addPriceDeltaCents: column.number({ default: 0 }),
    isCommon: column.boolean({ default: false }),
    active: column.boolean({ default: true }),
    sortOrder: column.number({ default: 0 })
  },
  indexes: [{ on: "active" }, { on: "isCommon" }, { on: "sortOrder" }]
});

const ProductIngredient = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    productId: column.number({ references: () => Product.columns.id }),
    ingredientId: column.number({ references: () => Ingredient.columns.id }),
    defaultIncluded: column.boolean({ default: true }),
    removable: column.boolean({ default: true }),
    sortOrder: column.number({ default: 0 })
  },
  indexes: [{ on: ["productId", "ingredientId"], unique: true }, { on: "productId" }]
});

const Allergen = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    slug: column.text({ unique: true }),
    name: column.text(),
    iconUrl: column.text({ optional: true }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "active" }, { on: "sortOrder" }]
});

const ProductAllergen = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    productId: column.number({ references: () => Product.columns.id }),
    allergenId: column.number({ references: () => Allergen.columns.id }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [
    { on: ["productId", "allergenId"], unique: true },
    { on: "productId" },
    { on: "allergenId" }
  ]
});

const CategoryIngredient = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    categoryId: column.number({ references: () => Category.columns.id }),
    ingredientId: column.number({ references: () => Ingredient.columns.id })
  },
  indexes: [{ on: ["categoryId", "ingredientId"], unique: true }]
});

const ModifierGroup = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    minSelect: column.number({ default: 0 }),
    maxSelect: column.number({ default: 1 }),
    required: column.boolean({ default: false }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true })
  },
  indexes: [{ on: "active" }]
});

const ModifierOption = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    groupId: column.number({ references: () => ModifierGroup.columns.id }),
    name: column.text(),
    priceDeltaCents: column.number({ default: 0 }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true })
  },
  indexes: [{ on: "groupId" }, { on: ["groupId", "sortOrder"] }]
});

const ProductModifierGroup = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    productId: column.number({ references: () => Product.columns.id }),
    groupId: column.number({ references: () => ModifierGroup.columns.id }),
    sortOrder: column.number({ default: 0 })
  },
  indexes: [{ on: ["productId", "groupId"], unique: true }]
});

const OpeningHour = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    dayOfWeek: column.number(),
    channel: column.text({ enum: ["DINE_IN", "DELIVERY", "PICKUP"] }),
    openMins: column.number(),
    closeMins: column.number(),
    isClosed: column.boolean({ default: false })
  },
  indexes: [{ on: ["dayOfWeek", "channel"] }]
});

const SpecialDate = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    dateISO: column.text(),
    channel: column.text({ enum: ["DINE_IN", "DELIVERY", "PICKUP"] }),
    isClosed: column.boolean({ default: true }),
    openMins: column.number({ optional: true }),
    closeMins: column.number({ optional: true }),
    note: column.text({ optional: true })
  },
  indexes: [{ on: ["dateISO", "channel"], unique: true }]
});

const DeliveryZone = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    active: column.boolean({ default: true }),
    shape: column.json(),
    pricing: column.json()
  },
  indexes: [{ on: "active" }]
});

const LoyaltyTier = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    minPoints: column.number(),
    perks: column.json({ optional: true }),
    active: column.boolean({ default: true }),
    sortOrder: column.number({ default: 0 })
  },
  indexes: [{ on: "active" }, { on: ["active", "sortOrder"] }]
});

const LoyaltyLedger = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.number({ references: () => User.columns.id }),
    orderId: column.number({ optional: true }),
    pointsDelta: column.number(),
    reason: column.text({
      enum: ["ORDER_PAID", "ORDER_REFUND", "MANUAL_ADJUST", "PROMO_BONUS"],
      default: "ORDER_PAID"
    }),
    meta: column.json({ optional: true }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "userId" }, { on: "createdAt" }]
});

const Coupon = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    code: column.text({ unique: true }),
    type: column.text({ enum: ["PERCENT", "FIXED", "FREE_DELIVERY"] }),
    value: column.number(),
    minSubtotalCents: column.number({ optional: true }),
    maxUses: column.number({ optional: true }),
    usesCount: column.number({ default: 0 }),
    active: column.boolean({ default: true }),
    startsAt: column.date({ optional: true }),
    endsAt: column.date({ optional: true }),
    requiredTierId: column.number({ optional: true, references: () => LoyaltyTier.columns.id })
  },
  indexes: [{ on: "active" }, { on: "requiredTierId" }]
});

const Order = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    publicId: column.text({ unique: true }),

    /**
     * Clave de idempotencia del checkout.
     *
     * Dos peticiones simultáneas (doble clic, reintento de red, dos pestañas)
     * leen el carrito antes de que ninguna lo vacíe, así que cada una insertaba
     * su pedido. El índice único es lo único atómico disponible: la segunda
     * inserción falla y el endpoint devuelve el pedido ya creado.
     *
     * Opcional porque los pedidos anteriores a este cambio no la tienen.
     */
    idempotencyKey: column.text({ optional: true, unique: true }),

    userId: column.number({ optional: true, references: () => User.columns.id }),

    addressId: column.number({ optional: true, references: () => Address.columns.id }),
    zoneId: column.number({ optional: true, references: () => DeliveryZone.columns.id }),
    addressSnapshot: column.json({ optional: true }),

    type: column.text({ enum: ["DELIVERY", "PICKUP"], default: "DELIVERY" }),
    status: column.text({
      enum: ["PENDING", "PAID", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PENDING"
    }),
    paymentStatus: column.text({
      enum: ["UNPAID", "AUTH", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "UNPAID"
    }),

    currency: column.text({ default: "EUR" }),
    subtotalCents: column.number(),
    deliveryFeeCents: column.number({ default: 0 }),
    discountCents: column.number({ default: 0 }),
    taxCents: column.number({ default: 0 }),
    totalCents: column.number(),

    couponId: column.number({ optional: true, references: () => Coupon.columns.id }),

    customerName: column.text({ optional: true }),
    customerPhone: column.text({ optional: true }),
    customerEmail: column.text({ optional: true }),

    notes: column.text({ optional: true }),
    scheduledFor: column.date({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "createdAt" }, { on: "status" }, { on: "userId" }]
});

const OrderItem = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    orderId: column.number({ references: () => Order.columns.id }),

    productId: column.number({ optional: true, references: () => Product.columns.id }),
    variantId: column.number({ optional: true, references: () => ProductVariant.columns.id }),

    nameSnapshot: column.text(),
    variantSnapshot: column.text({ optional: true }),

    unitPriceCents: column.number(),
    qty: column.number(),
    modifiers: column.json({ optional: true }),
    lineTotalCents: column.number(),

    notes: column.text({ optional: true })
  },
  indexes: [{ on: "orderId" }]
});

const Payment = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    orderId: column.number({ references: () => Order.columns.id }),
    provider: column.text({ enum: ["stripe"], default: "stripe" }),
    providerIntentId: column.text({ optional: true }),
    providerChargeId: column.text({ optional: true }),
    status: column.text({ enum: ["CREATED", "AUTHORIZED", "PAID", "FAILED"], default: "CREATED" }),
    amountCents: column.number(),
    currency: column.text({ default: "EUR" }),
    raw: column.json({ optional: true }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "orderId" }, { on: "providerIntentId" }]
});

const Refund = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    paymentId: column.number({ references: () => Payment.columns.id }),
    providerRefundId: column.text({ optional: true }),
    status: column.text({ enum: ["CREATED", "SUCCEEDED", "FAILED"], default: "CREATED" }),
    amountCents: column.number(),
    raw: column.json({ optional: true }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "paymentId" }]
});

const Menu = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.text(),
    kind: column.text({ enum: ["DIARIO", "FESTIVO"] }),
    active: column.boolean({ default: true }),
    validFrom: column.date({ optional: true }),
    validTo: column.date({ optional: true })
  },
  indexes: [{ on: "active" }, { on: "kind" }]
});

const MenuItem = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    menuId: column.number({ references: () => Menu.columns.id }),
    productId: column.number({ references: () => Product.columns.id }),
    course: column.text({ enum: ["PRIMERO", "SEGUNDO", "POSTRE"] }),
    printOrder: column.number({ default: 1 }),
    sortOrder: column.number({ default: 0 })
  },
  indexes: [{ on: ["menuId", "course"] }, { on: ["menuId", "course", "sortOrder"] }]
});

const MenuDish = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
    /**
     * Descripción del plato tal y como se lee en la web.
     * Sin esta columna el sistema V2 no podía sustituir al legacy: la carta
     * pública mostraba descripciones que V2 era incapaz de guardar, así que
     * publicar desde el admin habría vaciado los textos.
     */
    description: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  }
});

const MenuDishAssignment = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    kind: column.text({ enum: ["DIARIO", "FESTIVO"] }),
    course: column.text({ enum: ["PRIMERO", "SEGUNDO", "POSTRE"] }),
    dishId: column.number({ references: () => MenuDish.columns.id }),
    /**
     * Orden dentro del plato. El sistema legacy lo tenía en MenuItem; sin él,
     * V2 sólo podía ordenar por fecha de creación y el orden de la carta
     * quedaba fuera del control del admin.
     */
    sortOrder: column.number({ default: 0 }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [
    { on: ["kind", "course"] },
    { on: ["kind", "dishId"], unique: true },
    { on: "dishId" }
  ]
});

const AppSetting = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    key: column.text({ unique: true }),
    value: column.json(),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "key", unique: true }]
});

const MediaAsset = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    url: column.text(),
    alt: column.text({ optional: true }),
    kind: column.text({ enum: ["IMAGE", "VIDEO", "OTHER"], default: "IMAGE" }),
    meta: column.json({ optional: true }),
    createdAt: column.date({ default: NOW })
  }
});

const AuditLog = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    actorUserId: column.number({ optional: true, references: () => User.columns.id }),
    action: column.text(),
    entityType: column.text(),
    entityId: column.text(),
    diff: column.json({ optional: true }),
    ip: column.text({ optional: true }),
    userAgent: column.text({ optional: true }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "createdAt" }, { on: "actorUserId" }]
});

const SalesDaily = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    dateISO: column.text({ unique: true }),
    ordersCount: column.number({ default: 0 }),
    revenueCents: column.number({ default: 0 }),
    avgTicketCents: column.number({ default: 0 }),
    deliveryCount: column.number({ default: 0 }),
    pickupCount: column.number({ default: 0 }),
    cashCents: column.number({ default: 0 }),
    cardCents: column.number({ default: 0 }),
    discountCents: column.number({ default: 0 }),
    newCustomers: column.number({ default: 0 }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "dateISO", unique: true }]
});

const ProductSalesDaily = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    dateISO: column.text(),
    productId: column.number({ references: () => Product.columns.id }),
    qty: column.number({ default: 0 }),
    revenueCents: column.number({ default: 0 })
  },
  indexes: [
    { on: ["dateISO", "productId"], unique: true },
    { on: "dateISO" },
    { on: "productId" }
  ]
});

const TicketTemplate = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    kind: column.text({ enum: ["TICKET", "KITCHEN"], default: "TICKET" }),
    paperWidth: column.number({ default: 80 }),
    layout: column.json(),
    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "kind" }, { on: "active" }]
});

/**
 * Impresora física del local.
 *
 * `host`/`port` son la dirección en la LAN del restaurante (ESC/POS crudo sobre
 * TCP, puerto 9100 por defecto). Vercel no puede abrir ese socket: quien lo hace
 * es el bridge que corre en un equipo del local (tools/print-bridge). Por eso
 * aquí sólo se guarda la configuración, y `lastSeenAt` lo actualiza el bridge
 * cada vez que reporta — es la única fuente real de "está conectada".
 */
const Printer = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    location: column.text({ default: "" }),
    kind: column.text({ enum: ["TICKET", "KITCHEN"], default: "TICKET" }),

    host: column.text(),
    port: column.number({ default: 9100 }),
    paperWidth: column.number({ default: 80 }),

    templateId: column.number({ optional: true, references: () => TicketTemplate.columns.id }),

    /** Encola automáticamente al confirmarse un pedido. */
    autoPrint: column.boolean({ default: true }),
    enabled: column.boolean({ default: true }),

    /** Última vez que el bridge consiguió hablar con esta impresora. */
    lastSeenAt: column.date({ optional: true }),
    lastError: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW })
  },
  indexes: [{ on: "kind" }, { on: "enabled" }]
});

/**
 * Cola de impresión.
 *
 * `document` guarda el ticket ya resuelto como modelo de documento (líneas +
 * alineación + énfasis), no bytes ESC/POS: así el job es un snapshot estable del
 * pedido, pero un fallo de codificación o de comando de corte se arregla sin
 * tener que reencolar nada — los bytes se generan al servirlo.
 */
const PrintJob = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    printerId: column.number({ references: () => Printer.columns.id }),
    orderId: column.number({ optional: true, references: () => Order.columns.id }),

    kind: column.text({ enum: ["TICKET", "KITCHEN", "TEST"], default: "TICKET" }),
    title: column.text(),
    document: column.json(),

    status: column.text({ enum: ["PENDING", "SENT", "DONE", "ERROR"], default: "PENDING" }),
    attempts: column.number({ default: 0 }),
    lastError: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
    claimedAt: column.date({ optional: true }),
    doneAt: column.date({ optional: true })
  },
  indexes: [{ on: "status" }, { on: "printerId" }, { on: "createdAt" }, { on: "orderId" }]
});

const UpsellItem = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    productId: column.number({ references: () => Product.columns.id }),
    sortOrder: column.number({ default: 0 }),
    active: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW })
  },
  indexes: [{ on: "active" }, { on: ["active", "sortOrder"] }, { on: "productId", unique: true }]
});

export default defineDb({
  tables: {
    User,
    UserProfile,
    NewsletterSubscriber,
    Address,

    TaxRate,
    Category,
    Product,
    ProductVariant,

    Ingredient,
    ProductIngredient,
    CategoryIngredient,

    Allergen,
    ProductAllergen,

    ModifierGroup,
    ModifierOption,
    ProductModifierGroup,

    OpeningHour,
    SpecialDate,

    DeliveryZone,

    LoyaltyTier,
    LoyaltyLedger,

    Coupon,

    Order,
    OrderItem,

    Payment,
    Refund,

    Menu,
    MenuItem,
    MenuDish,
    MenuDishAssignment,

    AppSetting,
    MediaAsset,

    AuditLog,

    TicketTemplate,
    Printer,
    PrintJob,

    UpsellItem,

    SalesDaily,
    ProductSalesDaily
  }
});