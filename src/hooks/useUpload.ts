import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DocTipo } from '../types'

/** Upload direto client-side para o Supabase Storage. */
export function useUpload() {
  const [uploading, setUploading] = useState(false)

  async function uploadFoto(file: File, lojaId: string, motoId: string, ordem: number) {
    const ext = file.name.split('.').pop()
    const path = `${lojaId}/${motoId}/${Date.now()}-${ordem}.${ext}`

    const { error } = await supabase.storage
      .from('motos-fotos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) throw error

    const { error: dbError } = await supabase.from('moto_fotos').insert({
      moto_id: motoId,
      storage_path: path,
      ordem,
    })
    if (dbError) throw dbError

    return path
  }

  async function removerFoto(fotoId: string, storagePath: string) {
    await supabase.storage.from('motos-fotos').remove([storagePath])
    const { error } = await supabase.from('moto_fotos').delete().eq('id', fotoId)
    if (error) throw error
  }

  async function uploadDocumento(file: File, tipo: DocTipo, lojaId: string, motoId: string) {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${lojaId}/${motoId}/${tipo}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('motos-docs')           // bucket PRIVADO
        .upload(path, file, { contentType: file.type })

      if (error) throw error

      const { error: dbError } = await supabase.from('moto_documentos').insert({
        moto_id: motoId,
        tipo,
        nome_arquivo: file.name,
        storage_path: path,
        tamanho_bytes: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (dbError) throw dbError
    } finally {
      setUploading(false)
    }
  }

  async function removerDocumento(docId: string, storagePath: string) {
    await supabase.storage.from('motos-docs').remove([storagePath])
    const { error } = await supabase.from('moto_documentos').delete().eq('id', docId)
    if (error) throw error
  }

  return { uploading, uploadFoto, removerFoto, uploadDocumento, removerDocumento }
}
