'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await register(email, password, username, name);
    
    if (success) {
      router.push('/');
    } else {
      setError('Email ou username já está em uso');
    }
    
    setIsLoading(false);
  };

  return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6 relative overflow-hidden">
      <div className="animated-background-bubbles"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-semibold gradient-text mb-2 tracking-tight">Criar conta</h1>
          <p className="text-secondary text-sm mb-8">
            Registre-se para começar sua jornada no Timeline Diary
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-primary mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                required
                className="w-full px-4 py-3 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
                placeholder="seu_username"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
                style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary text-sm">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="font-medium transition-colors" style={{ color: 'var(--color-primary-500)' }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
