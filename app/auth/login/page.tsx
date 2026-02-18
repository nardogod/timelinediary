'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
        return;
      }
      setError('Email ou senha incorretos.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6 relative overflow-hidden">
      <div className="animated-background-bubbles"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-semibold gradient-text mb-2 tracking-tight">Entrar</h1>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-sm mb-8">
            Acesse sua conta para ver suas timelines
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary text-sm">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="font-medium transition-colors" style={{ color: 'var(--color-primary-500)' }}>
                Criar conta
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 glass rounded-xl">
            <p className="text-xs text-tertiary text-center">
              Conta de teste: usuario@exemplo.com / senha123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
