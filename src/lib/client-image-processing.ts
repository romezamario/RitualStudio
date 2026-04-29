export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION_PX = 2000;
export const DEFAULT_WEBP_QUALITY = 0.82;

const ALLOWED_INPUT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export type ProcessedImageFile = {
  file: File;
  width: number;
  height: number;
  outputMimeType: "image/webp" | "image/jpeg" | "image/png";
  originalFilename: string;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };
    image.src = objectUrl;
  });
}

function computeTargetSize(width: number, height: number) {
  const maxSide = Math.max(width, height);

  if (maxSide <= MAX_IMAGE_DIMENSION_PX) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION_PX / maxSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function processImageBeforeUpload(file: File, webpQuality = DEFAULT_WEBP_QUALITY): Promise<ProcessedImageFile> {
  if (!file.type.startsWith("image/") || !ALLOWED_INPUT_MIME_TYPES.has(file.type)) {
    throw new Error("Formato no soportado. Usa JPG, PNG, WEBP o AVIF.");
  }

  if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error("La imagen excede el límite de 8MB antes de procesar.");
  }

  const image = await loadImageFromFile(file);
  const target = computeTargetSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo inicializar el procesador de imagen del navegador.");
  }

  context.drawImage(image, 0, 0, target.width, target.height);

  const safeBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-") || "imagen";
  const clampedQuality = Math.max(0.4, Math.min(webpQuality, 0.95));

  const webpBlob = await canvasToBlob(canvas, "image/webp", clampedQuality);
  if (webpBlob) {
    return {
      file: new File([webpBlob], `${safeBaseName}.webp`, { type: "image/webp" }),
      width: target.width,
      height: target.height,
      outputMimeType: "image/webp",
      originalFilename: file.name,
    };
  }

  const fallbackMimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const fallbackBlob = await canvasToBlob(canvas, fallbackMimeType, fallbackMimeType === "image/jpeg" ? clampedQuality : undefined);

  if (!fallbackBlob) {
    throw new Error("No fue posible exportar la imagen procesada. Intenta con otro archivo.");
  }

  return {
    file: new File([fallbackBlob], `${safeBaseName}.${fallbackMimeType === "image/png" ? "png" : "jpg"}`, {
      type: fallbackMimeType,
    }),
    width: target.width,
    height: target.height,
    outputMimeType: fallbackMimeType,
    originalFilename: file.name,
  };
}
