import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Loja } from '../types'

/** Sistema de empresa única: busca a (única) loja ativa cadastrada. */
export function useLoja() {
  const [loja, setLoja] = useState<Loja | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchLoja() {
      const { data, error: err } = await supabase
        .from('lojas')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (err) setError(err.message)
      else if (!data) setError('Nenhuma loja cadastrada')
      else setLoja(data as Loja)
      setLoading(false)
    }

    fetchLoja()
    return () => {
      cancelled = true
    }
  }, [])

  return { loja, loading, error }
}
