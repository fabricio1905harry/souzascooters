import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute, { RoleHome } from './components/layout/ProtectedRoute'
import Spinner from './components/ui/Spinner'

// Páginas públicas (carregadas no bundle principal)
import LinkPage from './pages/public/LinkPage'
import Catalog from './pages/public/Catalog'
import MotoDetail from './pages/public/MotoDetail'

// Páginas admin (code-split — só carregam quando acessadas)
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Stock = lazy(() => import('./pages/admin/Stock'))
const MotoForm = lazy(() => import('./pages/admin/MotoForm'))
const MotoDocuments = lazy(() => import('./pages/admin/MotoDocuments'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const Baixas = lazy(() => import('./pages/admin/Baixas'))
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<Spinner className="min-h-screen" />}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<LinkPage />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/moto/:id" element={<MotoDetail />} />

            {/* Auth */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin protegido */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleHome />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="estoque"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Stock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="estoque/nova"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MotoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="estoque/:id/editar"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MotoForm />
                  </ProtectedRoute>
                }
              />
              {/* Documentos: despachante também acessa (motos vendidas, via RLS) */}
              <Route path="estoque/:id/documentos" element={<MotoDocuments />} />
              <Route path="baixas" element={<Baixas />} />
              <Route
                path="configuracoes"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
