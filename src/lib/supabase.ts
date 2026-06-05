import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Helper para signed URL de documentos (admin)
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('motos-docs')
    .createSignedUrl(storagePath, 3600) // 1 hora
  if (error) throw error
  return data.signedUrl
}

// Helper para URL pública de fotos
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('motos-fotos')
    .getPublicUrl(storagePath)
  return data.publicUrl
}

// Helper para thumbnail (Supabase Image Transformation)
export function getThumbnailUrl(storagePath: string, width = 400): string {
  const { data } = supabase.storage
    .from('motos-fotos')
    .getPublicUrl(storagePath, {
      transform: { width, height: Math.round(width * 0.75), resize: 'cover' },
    })
  return data.publicUrl
}
