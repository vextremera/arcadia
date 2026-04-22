import { d as db, v as MediaAsset } from './_astro_db_Bcz5lWRF.mjs';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = /* @__PURE__ */ new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
class ProductImageUploadError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "ProductImageUploadError";
    this.code = code;
  }
}
function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/gi, "n").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function resolveExtension(file) {
  const fromType = ALLOWED_CONTENT_TYPES.get(file.type);
  if (fromType) return fromType;
  const name = String(file.name ?? "").trim().toLowerCase();
  const extension = name.includes(".") ? name.split(".").pop() ?? "" : "";
  if (extension === "jpg" || extension === "jpeg") return "jpg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  return null;
}
function resolveContentType(file, extension) {
  if (file.type && ALLOWED_CONTENT_TYPES.has(file.type)) return file.type;
  if (extension === "jpg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}
function productImageErrorToQuery(code) {
  if (code === "IMAGE_UPLOAD_DISABLED") return "image-upload-disabled";
  if (code === "INVALID_IMAGE") return "invalid-image";
  if (code === "IMAGE_TOO_LARGE") return "image-too-large";
  return "image-upload-failed";
}
function getImageFileFromFormDataEntry(value) {
  if (!(value instanceof File)) return null;
  if (value.size <= 0) return null;
  return value;
}
async function getBlobPut() {
  try {
    const mod = await import('@vercel/blob');
    return mod.put;
  } catch {
    throw new ProductImageUploadError("IMAGE_UPLOAD_DISABLED", "La dependencia @vercel/blob no está instalada.");
  }
}
async function uploadProductImage(input) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ProductImageUploadError("IMAGE_UPLOAD_DISABLED", "BLOB_READ_WRITE_TOKEN no está configurado.");
  }
  const extension = resolveExtension(input.file);
  if (!extension) {
    throw new ProductImageUploadError("INVALID_IMAGE", "Formato no permitido. Solo JPG, PNG y WEBP.");
  }
  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new ProductImageUploadError("IMAGE_TOO_LARGE", "La imagen supera el tamaño máximo permitido.");
  }
  const baseName = slugify(input.productSlug || input.productName || "producto");
  if (!baseName) {
    throw new ProductImageUploadError("INVALID_IMAGE", "No se ha podido generar el nombre de archivo.");
  }
  const put = await getBlobPut();
  const timestamp = Date.now();
  const pathname = `products/${baseName}/${baseName}-${timestamp}.${extension}`;
  const contentType = resolveContentType(input.file, extension);
  try {
    const blob = await put(pathname, input.file, {
      access: "public",
      addRandomSuffix: false,
      contentType
    });
    const existingAssets = await db.select({
      id: MediaAsset.id
    }).from(MediaAsset);
    const nextMediaId = existingAssets.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(MediaAsset).values({
      id: nextMediaId,
      url: blob.url,
      alt: input.alt?.trim() || input.productName,
      kind: "IMAGE",
      meta: {
        pathname: blob.pathname,
        contentType,
        size: input.file.size,
        source: "ADMIN_PRODUCT_UPLOAD",
        productSlug: input.productSlug ?? null
      },
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      mediaAssetId: nextMediaId
    };
  } catch (error) {
    if (error instanceof ProductImageUploadError) {
      throw error;
    }
    throw new ProductImageUploadError("IMAGE_UPLOAD_FAILED", error instanceof Error ? error.message : "Error subiendo la imagen.");
  }
}

export { ProductImageUploadError as P, getImageFileFromFormDataEntry as g, productImageErrorToQuery as p, uploadProductImage as u };
