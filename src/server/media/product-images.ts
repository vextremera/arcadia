import { db, MediaAsset } from "astro:db";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ProductImageUploadErrorCode =
  | "IMAGE_UPLOAD_DISABLED"
  | "INVALID_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "IMAGE_UPLOAD_FAILED";

export class ProductImageUploadError extends Error {
  code: ProductImageUploadErrorCode;

  constructor(code: ProductImageUploadErrorCode, message: string) {
    super(message);
    this.name = "ProductImageUploadError";
    this.code = code;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveExtension(file: File) {
  const fromType = ALLOWED_CONTENT_TYPES.get(file.type);
  if (fromType) return fromType;

  const name = String(file.name ?? "").trim().toLowerCase();
  const extension = name.includes(".") ? name.split(".").pop() ?? "" : "";

  if (extension === "jpg" || extension === "jpeg") return "jpg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";

  return null;
}

function resolveContentType(file: File, extension: string) {
  if (file.type && ALLOWED_CONTENT_TYPES.has(file.type)) return file.type;
  if (extension === "jpg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}

export function productImageErrorToQuery(code: ProductImageUploadErrorCode) {
  if (code === "IMAGE_UPLOAD_DISABLED") return "image-upload-disabled";
  if (code === "INVALID_IMAGE") return "invalid-image";
  if (code === "IMAGE_TOO_LARGE") return "image-too-large";
  return "image-upload-failed";
}

export function getImageFileFromFormDataEntry(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) return null;
  if (value.size <= 0) return null;
  return value;
}

async function getBlobPut() {
  try {
    const mod = await import("@vercel/blob");
    return mod.put;
  } catch {
    throw new ProductImageUploadError(
      "IMAGE_UPLOAD_DISABLED",
      "La dependencia @vercel/blob no está instalada."
    );
  }
}

export async function uploadProductImage(input: {
  file: File;
  productName: string;
  productSlug?: string | null;
  alt?: string | null;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ProductImageUploadError(
      "IMAGE_UPLOAD_DISABLED",
      "BLOB_READ_WRITE_TOKEN no está configurado."
    );
  }

  const extension = resolveExtension(input.file);
  if (!extension) {
    throw new ProductImageUploadError(
      "INVALID_IMAGE",
      "Formato no permitido. Solo JPG, PNG y WEBP."
    );
  }

  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new ProductImageUploadError(
      "IMAGE_TOO_LARGE",
      "La imagen supera el tamaño máximo permitido."
    );
  }

  const baseName = slugify(input.productSlug || input.productName || "producto");
  if (!baseName) {
    throw new ProductImageUploadError(
      "INVALID_IMAGE",
      "No se ha podido generar el nombre de archivo."
    );
  }

  const put = await getBlobPut();

  const timestamp = Date.now();
  const pathname = `products/${baseName}/${baseName}-${timestamp}.${extension}`;
  const contentType = resolveContentType(input.file, extension);

  try {
    const blob = await put(pathname, input.file, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });

    const existingAssets = await db.select({ id: MediaAsset.id }).from(MediaAsset);
    const nextMediaId =
      existingAssets.reduce((max, row) => Math.max(max, row.id), 0) + 1;

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
        productSlug: input.productSlug ?? null,
      },
      createdAt: new Date(),
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      mediaAssetId: nextMediaId,
    };
  } catch (error) {
    if (error instanceof ProductImageUploadError) {
      throw error;
    }

    throw new ProductImageUploadError(
      "IMAGE_UPLOAD_FAILED",
      error instanceof Error ? error.message : "Error subiendo la imagen."
    );
  }
}