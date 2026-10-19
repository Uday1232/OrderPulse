/**
 * Utility to resolve media and uploaded image URLs across frontend and backend dev/production environments.
 */
export function getMediaUrl(url?: string | null, fallback = '/images/food/burger.jpg'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // Fully qualified URL (Cloudinary, S3, or external)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Local uploads served by Express backend
  if (trimmed.startsWith('/uploads/')) {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    // Strip trailing /api/v1 if present to get server origin
    const baseUrl = backend.replace(/\/api\/v1\/?$/, '');
    return `${baseUrl}${trimmed}`;
  }

  // Local frontend assets (in public/ directory)
  return trimmed;
}
