import { apiFetch } from '@/shared/api/apiFetch'
import type { ImageUploadResponse } from '@/shared/api/types'

/** `POST /uploads/images` – lädt ein Bild hoch und liefert seine URL. */
export function uploadImageApi(file: File): Promise<ImageUploadResponse> {
  const form = new FormData()

  form.append('file', file)

  return apiFetch<ImageUploadResponse>('/uploads/images', { method: 'POST', body: form })
}
