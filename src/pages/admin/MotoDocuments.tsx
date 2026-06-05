import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, FileImage, FileText, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, getSignedUrl } from '../../lib/supabase'
import { useLoja } from '../../hooks/useLoja'
import { useUpload } from '../../hooks/useUpload'
import { DOC_TIPOS, formatData, formatTamanho } from '../../lib/helpers'
import type { DocTipo, Moto, MotoDocumento } from '../../types'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const TIPO_BADGE: Record<DocTipo, string> = {
  dut: 'bg-blue-100 text-blue-800',
  crlv: 'bg-green-100 text-green-800',
  laudo: 'bg-purple-100 text-purple-800',
  nf: 'bg-amber-100 text-amber-800',
  outro: 'bg-gray-100 text-gray-600',
}

export default function MotoDocuments() {
  const { id } = useParams<{ id: string }>()
  const { loja } = useLoja()
  const { uploading, uploadDocumento, removerDocumento } = useUpload()

  const [moto, setMoto] = useState<Moto | null>(null)
  const [docs, setDocs] = useState<MotoDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState<DocTipo>('dut')
  const [remover, setRemover] = useState<MotoDocumento | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from('moto_documentos')
      .select('*')
      .eq('moto_id', id)
      .order('created_at', { ascending: false })
    setDocs((data as MotoDocumento[]) ?? [])
  }, [id])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('motos').select('*').eq('id', id).single(),
      fetchDocs(),
    ]).then(([motoRes]) => {
      setMoto(motoRes.data as Moto | null)
      setLoading(false)
    })
  }, [id, fetchDocs])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !loja || !id) return

    try {
      await uploadDocumento(file, tipo, loja.id, id)
      toast.success('Documento enviado!')
      fetchDocs()
    } catch (err) {
      console.error(err)
      toast.error('Erro no upload do documento')
    }
  }

  async function visualizarDocumento(storagePath: string) {
    try {
      const url = await getSignedUrl(storagePath)  // válido por 1 hora
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar link do documento')
    }
  }

  async function handleRemover() {
    if (!remover) return
    try {
      await removerDocumento(remover.id, remover.storage_path)
      toast.success('Documento removido')
      fetchDocs()
    } catch {
      toast.error('Erro ao remover documento')
    } finally {
      setRemover(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/estoque"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
      </Link>

      <h1 className="text-2xl font-bold text-text">
        Documentos — {moto ? `${moto.marca} ${moto.modelo}` : 'Moto'}
      </h1>
      {moto && (
        <p className="mt-1 text-sm text-muted">
          {moto.ano_fab}/{moto.ano_mod} {moto.placa && `· Placa ${moto.placa}`}
        </p>
      )}

      {/* Upload */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold text-text">Enviar documento</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as DocTipo)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {DOC_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          PDF, JPG ou PNG · máx 20 MB · armazenado em bucket privado (motos-docs)
        </p>
      </section>

      {/* Lista */}
      <section className="mt-6 rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border p-5 font-semibold text-text">
          Documentos existentes ({docs.length})
        </h2>
        {docs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhum documento enviado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((doc) => {
              const isPdf = doc.nome_arquivo.toLowerCase().endsWith('.pdf')
              const Icon = isPdf ? FileText : FileImage
              return (
                <li key={doc.id} className="flex items-center gap-3 p-4">
                  <Icon className="h-8 w-8 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{doc.nome_arquivo}</p>
                    <p className="text-xs text-muted">
                      {formatData(doc.created_at)} · {formatTamanho(doc.tamanho_bytes)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${TIPO_BADGE[doc.tipo]}`}
                  >
                    {DOC_TIPOS.find((t) => t.value === doc.tipo)?.label ?? doc.tipo}
                  </span>
                  <button
                    onClick={() => visualizarDocumento(doc.storage_path)}
                    title="Visualizar"
                    className="rounded-lg p-2 text-muted hover:bg-bg hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRemover(doc)}
                    title="Remover"
                    className="rounded-lg p-2 text-muted hover:bg-bg hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!remover}
        titulo="Remover documento"
        mensagem={`O arquivo "${remover?.nome_arquivo}" será excluído permanentemente. Continuar?`}
        onConfirm={handleRemover}
        onCancel={() => setRemover(null)}
      />
    </div>
  )
}
