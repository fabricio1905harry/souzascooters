import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CatalogFilters, Moto } from '../types'

const ordenacaoMap = {
  recentes: { column: 'created_at', ascending: false },
  menor_preco: { column: 'preco', ascending: true },
  maior_preco: { column: 'preco', ascending: false },
  menor_km: { column: 'quilometragem', ascending: true },
} as const

/** Catálogo público: consulta a view motos_publicas (sem placa/chassi). */
export function useMotosPublicas(lojaId: string | undefined, filters: CatalogFilters) {
  const [motos, setMotos] = useState<Moto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lojaId) return
    let cancelled = false
    setLoading(true)

    async function fetchMotos() {
      let query = supabase
        .from('motos_publicas')        // view sem placa/chassi
        .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem)')
        .eq('loja_id', lojaId)

      if (filters.marca) query = query.eq('marca', filters.marca)
      if (filters.categoria) query = query.eq('categoria', filters.categoria)
      if (filters.precoMin) query = query.gte('preco', filters.precoMin)
      if (filters.precoMax) query = query.lte('preco', filters.precoMax)
      if (filters.busca) query = query.ilike('modelo', `%${filters.busca}%`)

      const ord = ordenacaoMap[filters.ordenacao ?? 'recentes']
      query = query.order(ord.column, { ascending: ord.ascending })

      const { data, error } = await query
      if (cancelled) return
      if (!error && data) {
        setMotos(
          (data as Moto[]).map((m) => ({
            ...m,
            fotos: (m.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
          }))
        )
      }
      setLoading(false)
    }

    fetchMotos()
    return () => {
      cancelled = true
    }
  }, [lojaId, filters])

  return { motos, loading }
}

/** Marcas únicas das motos publicadas (para o select de filtro). */
export function useMarcas(lojaId: string | undefined) {
  const [marcas, setMarcas] = useState<string[]>([])

  useEffect(() => {
    if (!lojaId) return
    supabase
      .from('motos_publicas')
      .select('marca')
      .eq('loja_id', lojaId)
      .then(({ data }) => {
        if (data) setMarcas([...new Set(data.map((d) => d.marca as string))].sort())
      })
  }, [lojaId])

  return marcas
}

/** Detalhe público de uma moto. */
export function useMotoPublica(id: string | undefined) {
  const [moto, setMoto] = useState<Moto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    supabase
      .from('motos_publicas')
      .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        if (data) {
          const m = data as Moto
          m.fotos = (m.fotos ?? []).sort((a, b) => a.ordem - b.ordem)
          setMoto(m)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { moto, loading }
}

/** Estoque admin: tabela motos completa (inclui placa/chassi). */
export function useMotosAdmin() {
  const [motos, setMotos] = useState<Moto[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('motos')
      .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMotos(
        (data as Moto[]).map((m) => ({
          ...m,
          fotos: (m.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { motos, loading, refetch }
}
