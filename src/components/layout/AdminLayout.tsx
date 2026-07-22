import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bike,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Warehouse,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import type { Papel } from '../../types'

const navItems: { to: string; label: string; icon: typeof Bike; roles: Papel[] }[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/admin/estoque', label: 'Estoque', icon: Warehouse, roles: ['admin'] },
  { to: '/admin/baixas', label: 'Motos Baixadas', icon: ClipboardList, roles: ['admin', 'despachante'] },
  { to: '/admin/configuracoes', label: 'Configurações', icon: SettingsIcon, roles: ['admin'] },
]

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Bike className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-base font-bold uppercase text-white">
        Painel Admin
      </span>
    </span>
  )
}

export default function AdminLayout() {
  const { signOut, user, perfil } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const itensVisiveis = navItems.filter(
    (item) => !perfil || item.roles.includes(perfil.papel)
  )

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-4">
      {itensVisiveis.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/55 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon className="h-5 w-5" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col bg-ink md:flex">
        <div className="border-b border-ink-line p-4">
          <Brand />
        </div>
        {nav}
        <div className="border-t border-ink-line p-4">
          <p className="truncate text-xs text-white/50">{user?.email}</p>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-accent">
            {perfil?.papel === 'despachante' ? 'Despachante' : 'Administrador'}
          </p>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink shadow-lift">
            <div className="flex items-center justify-between border-b border-ink-line p-4">
              <Brand />
              <button onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            {nav}
            <div className="border-t border-ink-line p-4">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Header mobile */}
        <header className="flex items-center gap-3 bg-ink p-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6 text-white" />
          </button>
          <Brand />
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
