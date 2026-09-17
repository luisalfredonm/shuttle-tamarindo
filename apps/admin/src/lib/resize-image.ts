/** Ancho suficiente para el hero a pantalla completa; next/image genera el resto */
const MAX_SIDE = 2000;
/** Por debajo del tope del API (4 MB) con margen para el multipart */
const MAX_BYTES = 3.5 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

/**
 * Achica y comprime la foto en el navegador antes de subirla.
 *
 * Una foto de celular pesa 5-10 MB y el proxy del panel corre en Vercel, que
 * rechaza cuerpos de más de 4.5 MB. Se redibuja a 2000 px como máximo y se
 * baja la calidad JPEG hasta que entre. Sale siempre en JPEG: es el formato
 * que todos los navegadores saben codificar.
 */
export async function resizeImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    // from-image respeta la rotación EXIF: si no, las fotos verticales quedan acostadas
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No se pudo leer la imagen. Usa una foto JPG, PNG o WebP.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo procesar la imagen.");
  // Fondo blanco: un PNG con transparencia quedaría negro al pasar a JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("La foto es demasiado pesada incluso comprimida.");
}
