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

    UpsellItem
  }
});