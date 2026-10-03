export function isValidMobile(v: string): boolean {
  return /^\d{10}$/.test(v.trim());
}

export function isValidEmail(v: string): boolean {
  return v.trim() === "" ? true : /.+@.+\..+/.test(v.trim());
}

export function isRequired(v: string, min = 1): boolean {
  return v.trim().length >= min;
}

export function isValidOtp(v: string): boolean {
  return /^\d{4}$/.test(v.trim());
}

export interface ImageFileValidation {
  ok: boolean;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_MB = 10;

export function validateImageFile(file: File): ImageFileValidation {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Unsupported format — use JPG, PNG, WEBP or GIF." };
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return { ok: false, error: `File too large — maximum ${MAX_IMAGE_MB} MB per photo.` };
  }
  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
