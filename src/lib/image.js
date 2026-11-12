/**
 * Prepares a profile photo in the browser before upload: checks it is an
 * image, crops the centre square and resizes it to 320×320, then encodes it
 * as WebP (JPEG where WebP encoding is unavailable). Uploads stay small and
 * fast whatever the camera produced.
 */
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const SIZE = 320;

export class ImageError extends Error {}

function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => loadWithElement(file));
  }
  return loadWithElement(file);
}

function loadWithElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new ImageError('That file isn’t an image we can read.')); };
    img.src = url;
  });
}

const toBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

/** @returns {Promise<{ blob: Blob, type: string, previewUrl: string }>} */
export async function prepareAvatar(file) {
  if (!file) throw new ImageError('Choose an image to upload.');
  if (!/^image\/(jpeg|png|webp|gif|heic|heif|avif|bmp)$/i.test(file.type || '')) {
    throw new ImageError('Use a JPEG, PNG or WebP image.');
  }
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('That image is larger than 15 MB. Please choose a smaller one.');

  const img = await loadImage(file);
  const w = img.width || img.naturalWidth;
  const h = img.height || img.naturalHeight;
  if (!w || !h) throw new ImageError('That file isn’t an image we can read.');

  const side = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
  img.close?.();

  let blob = await toBlob(canvas, 'image/webp', 0.88);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.9);
  if (!blob) throw new ImageError('That image couldn’t be processed. Try another one.');
  return { blob, type: blob.type, previewUrl: URL.createObjectURL(blob) };
}
