import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'
import type { Papel } from '../../types'

interface Props {
  children: ReactNode
  /** Papéis permitidos. Sem prop = qualquer usuário logado com perfil. */
  roles?: Papel[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, perfil, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner className="min-h-screen" />
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />

  // Logado mas sem perfil cadastrado → sem acesso ao painel
  if (!perfil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-semibold text-text">Acesso não configurado</p>
        <p className="max-w-sm text-sm text-muted">
          Seu usuário não tem um perfil de acesso. Peça ao administrador para cadastrar seu
          perfil (tabela <code>perfis</code>).
        </p>
      </div>
    )
  }

  // Papel sem permissão para esta rota → manda para a home do papel dele
  if (roles && !roles.includes(perfil.papel)) {
    const home = perfil.papel === 'despachante' ? '/admin/baixas' : '/admin/dashboard'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}

/** Redireciona a raiz do /admin para a home de cada papel. */
export function RoleHome() {
  const { perfil } = useAuth()
  return (
    <Navigate
      to={perfil?.papel === 'despachante' ? '/admin/baixas' : '/admin/dashboard'}
      replace
    />
  )
}
