/**
 * Client-Side Image Pre-processor
 *
 * Smartphone camera captures (iOS / Android) often yield 12 MB - 25 MB high-resolution images
 * in HEIC, JPEG, or PNG formats. Sending 20MB raw images to AI vision models slows down network transfer
 * and can hit request payload limits.
 *
 * This utility resizes images in browser canvas (max bounding dimension 2048px, JPEG quality 0.85),
 * preserving small text legibility for Legal Metrology OCR while keeping upload size ~300KB - 800KB.
 */

export interface ProcessImageOptions {
  /** Maximum bounding width or height in pixels. Default: 2048 */
  readonly maxDimension?: number;
  /** Compression quality between 0.1 and 1.0. Default: 0.85 */
  readonly quality?: number;
}

const DEFAULT_MAX_DIMENSION = 2048;
const DEFAULT_QUALITY = 0.85;

/**
 * Resizes and optimizes an image file for AI extraction upload.
 * If canvas API is unavailable (e.g. SSR / Node.js test environment) or processing fails,
 * falls back safely to the original file.
 */
export async function processImageForUpload(
  file: File,
  options: ProcessImageOptions = {}
): Promise<File> {
  // If not running in a browser environment with Canvas/Image support, return original file
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return file;
  }

  // If file is already smaller than 600 KB and valid format, no need to process
  if (file.size <= 600 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }

  const maxDimension = options.maxDimension || DEFAULT_MAX_DIMENSION;
  const quality = options.quality || DEFAULT_QUALITY;

  try {
    const imageBitmap = await loadImageBitmap(file);
    if (!imageBitmap) return file;

    const { width, height } = imageBitmap;
    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        targetWidth = maxDimension;
        targetHeight = Math.round((height * maxDimension) / width);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((width * maxDimension) / height);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if ('close' in imageBitmap && typeof imageBitmap.close === 'function') imageBitmap.close();
      return file;
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    if ('close' in imageBitmap && typeof imageBitmap.close === 'function') imageBitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    if (!blob) return file;

    // Create a new File object with jpeg extension and image/jpeg content type
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${originalName || 'scanned_commodity'}.jpg`;

    return new File([blob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // Graceful fallback to original file if processing encounters any browser issue
    return file;
  }
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback to HTMLImageElement if createImageBitmap fails
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
