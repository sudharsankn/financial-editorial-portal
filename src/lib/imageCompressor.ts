/**
 * Client-side image compression & aspect-ratio cropping utility.
 * Optimizes user-uploaded images to the exact 560px × 320px (7:4) editorial framing
 * and compresses them to lightweight high-quality JPGs before uploading to Supabase.
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
}

/**
 * Compresses and center-crops any image to the exact 560x320 (or 2x 1120x640 Retina) aspect ratio.
 */
export async function compressAndCropTo560x320(
  file: File,
  targetWidth: number = 1120, // 2x Retina for crisp 560x320 display
  targetHeight: number = 640,
  quality: number = 0.85
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.onload = () => {
        try {
          const originalSize = file.size;
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not initialize canvas context'));
            return;
          }

          // Enable high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Calculate center-crop (cover) coordinates
          const targetRatio = targetWidth / targetHeight; // 1.75 (7:4)
          const imgRatio = img.width / img.height;

          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (imgRatio > targetRatio) {
            // Source is wider than target ratio: crop sides
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            // Source is taller than target ratio: crop top/bottom
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          // Fill white background in case of transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw the center-cropped image
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

          // Compress to JPEG blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
              }

              const compressedSize = blob.size;
              const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
              const dataUrl = canvas.toDataURL('image/jpeg', quality);

              resolve({
                blob,
                dataUrl,
                originalSize,
                compressedSize,
                savingsPercent: savings,
                width: targetWidth,
                height: targetHeight,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable KB / MB
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
