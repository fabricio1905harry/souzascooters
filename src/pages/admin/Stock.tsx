import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  Bike,
  ClipboardList,
  FileText,
  HandCoins,
  Pencil,
  Plus,
  Search,
  Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, getThumbnailUrl } from '../../lib/supabase'
import { useMotosAdmin } from '../../hooks/useMotos'
import { formatKm, formatPreco, STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../lib/helpers'
import type { Moto, MotoStatus } from '../../types'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import VenderModal from '../../components/admin/VenderModal'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}

export default function Stock() {
  const { motos, loading, refetch } = useMotosAdmin()
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<MotoStatus | ''>('')
  const [arquivar, setArquivar] = useState<Moto | null>(null)
  const [vender, setVender] = useState<Moto | null>(null)

  const filtradas = useMemo(() => {
    return motos.filter((m) => {
      if (statusFiltro && m.status !== statusFiltro) return false
      if (busca) {
        const termo = busca.toLowerCase()
        const nome = `${m.marca} ${m.modelo}`.toLowerCase()
        const placa = (m.placa ?? '').toLowerCase()
        return nome.includes(termo) || placa.includes(termo)
      }
      return true
    })
  }, [motos, busca, statusFiltro])

  async function updateMoto(id: string, patch: Partial<Moto>, sucesso: string) {
    // .select() confirma que a linha foi de fato alterada — RLS bloqueando
    // retorna 0 linhas SEM erro, o que mascararia a falha
    const { data, error } = await supabase
      .from('motos')
      .update(patch)
      .eq('id', id)
      .select('id')
    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`)
    } else if (!data || data.length === 0) {
      toast.error('Sem permissão para alterar (verifique as políticas RLS / login)')
    } else {
      toast.success(sucesso)
      refetch()
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase text-text">Estoque</h1>
        <Link
          to="/admin/estoque/nova"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Nova moto
        </Link>
      </div>

      {/* Busca + filtro */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo ou placa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as MotoStatus | '')}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as MotoStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Foto</th>
              <th className="p-3">Moto</th>
              <th className="p-3 whitespace-nowrap">Placa</th>
              <th className="p-3 whitespace-nowrap">Ano</th>
              <th className="p-3 whitespace-nowrap">KM</th>
              <th className="p-3 whitespace-nowrap">Preço</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Destaque</th>
              <th className="p-3 text-center">Publicado</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-muted">
                  Nenhuma moto encontrada.
                </td>
              </tr>
            )}
            {filtradas.map((moto) => (
              <tr key={moto.id} className="hover:bg-bg">
                <td className="p-3">
                  {moto.fotos?.[0] ? (
                    <img
                      src={getThumbnailUrl(moto.fotos[0].storage_path, 100)}
                      alt=""
                      loading="lazy"
                      className="h-12 w-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-16 items-center justify-center rounded-md bg-bg">
                      <Bike className="h-5 w-5 text-border" />
                    </div>
                  )}
                </td>
                <td className="max-w-48 p-3">
                  <p className="truncate font-medium text-text">
                    {moto.marca} {moto.modelo}
                  </p>
                  {moto.destaque && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Destaque
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap p-3 text-muted">{moto.placa || '—'}</td>
                <td className="whitespace-nowrap p-3 text-muted">
                  {moto.ano_fab}/{moto.ano_mod}
                </td>
                <td className="whitespace-nowrap p-3 text-muted">{formatKm(moto.quilometragem)}</td>
                <td className="whitespace-nowrap p-3 font-medium text-text">
                  {formatPreco(moto.preco)}
                </td>
                <td className="whitespace-nowrap p-3">
                  <select
                    value={moto.status}
                    onChange={(e) =>
                      updateMoto(moto.id, { status: e.target.value as MotoStatus }, 'Status atualizado')
                    }
                    className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium focus:ring-2 focus:ring-primary ${STATUS_BADGE_CLASSES[moto.status]}`}
                  >
                    {(Object.keys(STATUS_LABELS) as MotoStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-center">
                  <Toggle
                    checked={moto.destaque}
                    onChange={() =>
                      updateMoto(
                        moto.id,
                        { destaque: !moto.destaque },
                        moto.destaque ? 'Removida dos destaques' : 'Adicionada aos destaques'
                      )
                    }
                  />
                </td>
                <td className="p-3 text-center">
                  <Toggle
                    checked={moto.publicado}
                    onChange={() =>
                      updateMoto(
                        moto.id,
                        { publicado: !moto.publicado },
                        moto.publicado ? 'Despublicada' : 'Publicada'
                      )
                    }
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {moto.status !== 'vendido' ? (
                      <button
                        onClick={() => setVender(moto)}
                        title="Vender — registra o novo dono e envia para o despachante"
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        <HandCoins className="h-3.5 w-3.5" /> Vender
                      </button>
                    ) : (
                      <Link
                        to="/admin/baixas"
                        title="Ver baixa"
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-bg hover:text-primary"
                      >
                        <ClipboardList className="h-3.5 w-3.5" /> Baixa
                      </Link>
                    )}
                    <Link
                      to={`/admin/estoque/${moto.id}/editar`}
                      title="Editar"
                      className="rounded-lg p-2 text-muted hover:bg-bg hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/admin/estoque/${moto.id}/documentos`}
                      title="Documentos"
                      className="rounded-lg p-2 text-muted hover:bg-bg hover:text-primary"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setArquivar(moto)}
                      title="Arquivar"
                      className="rounded-lg p-2 text-muted hover:bg-bg hover:text-red-600"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vender && (
        <VenderModal moto={vender} onClose={() => setVender(null)} onSold={refetch} />
      )}

      <ConfirmDialog
        open={!!arquivar}
        titulo="Arquivar moto"
        mensagem={`A moto ${arquivar?.marca} ${arquivar?.modelo} será removida do catálogo público (soft delete). Continuar?`}
        onConfirm={() => {
          if (arquivar) updateMoto(arquivar.id, { publicado: false }, 'Moto arquivada')
          setArquivar(null)
        }}
        onCancel={() => setArquivar(null)}
      />
    </div>
  )
}
