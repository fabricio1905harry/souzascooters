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
  { to: '/admin/baixas', label: 'Baixas', icon: ClipboardList, roles: ['admin', 'despachante'] },
  { to: '/admin/configuracoes', label: 'Configurações', icon: SettingsIcon, roles: ['admin'] },
]

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
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-light text-primary-dark'
                : 'text-muted hover:bg-bg hover:text-text'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Bike className="h-6 w-6 text-primary" />
          <span className="font-semibold text-text">Painel Admin</span>
        </div>
        {nav}
        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-primary">
            {perfil?.papel === 'despachante' ? 'Despachante' : 'Administrador'}
          </p>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-text"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="flex items-center gap-2 font-semibold text-text">
                <Bike className="h-6 w-6 text-primary" /> Painel Admin
              </span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {nav}
            <div className="border-t border-border p-4">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-bg"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Header mobile */}
        <header className="flex items-center gap-3 border-b border-border bg-surface p-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-text" />
          </button>
          <span className="flex items-center gap-2 font-semibold text-text">
            <Bike className="h-5 w-5 text-primary" /> Painel Admin
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
