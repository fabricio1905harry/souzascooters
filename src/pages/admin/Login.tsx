import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Bike } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (loading) return <Spinner className="min-h-screen" />
  if (user) return <Navigate to={from} replace />

  async function onSubmit(values: LoginForm) {
    try {
      await signIn(values.email, values.password)
      toast.success('Bem-vindo!')
      navigate(from, { replace: true })
    } catch {
      toast.error('E-mail ou senha inválidos')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink bg-[radial-gradient(ellipse_at_top,rgba(77,95,156,0.35),transparent_60%)] p-4">
      <div className="w-full max-w-sm animate-fade-up overflow-hidden rounded-2xl bg-surface shadow-lift">
        <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-primary-dark" />
        <div className="p-8">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Bike className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 font-display text-xl font-bold uppercase text-text">
            Painel Admin
          </h1>
          <p className="text-sm text-muted">Entre para gerenciar o estoque</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
              E-mail
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="field"
              placeholder="voce@loja.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
              Senha
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="field"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary px-4 py-3 font-display text-base font-semibold uppercase tracking-wider text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}
