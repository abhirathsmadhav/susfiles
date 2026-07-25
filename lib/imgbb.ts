// ============================================================
// Image Upload Provider — ImgBB (default)
// To swap providers, only this file needs to change.
// ============================================================

export interface UploadResult {
  url: string;
  deleteUrl?: string;
}

/**
 * Upload an image via the server-side /api/upload proxy.
 * The proxy forwards to ImgBB keeping the API key server-side.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Image upload failed');
  }

  const data = await res.json();
  return { url: data.url, deleteUrl: data.deleteUrl };
}
