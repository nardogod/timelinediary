'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Check, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface TelegramSettingsProps {
  userId: string;
}

export default function TelegramSettings({ userId }: TelegramSettingsProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLinkStatus();
  }, [userId]);

  const checkLinkStatus = async () => {
    try {
      const response = await fetch(`/api/telegram/status?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.linked) {
          setIsLinked(true);
          setTelegramUsername(data.telegram_username);
        } else {
          setIsLinked(false);
        }
      }
    } catch (err) {
      console.error('Error checking link status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      setError(null);
      if (!user) {
        setError('Você precisa estar autenticado.');
        return;
      }

      const response = await fetch('/api/telegram/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError('Erro ao gerar token. Tente novamente.');
      console.error('Error generating token:', err);
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold text-lg">Configurações Telegram</h3>
      </div>

      {isLinked ? (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">Conta vinculada</span>
          </div>
          {telegramUsername && (
            <p className="text-slate-300 text-sm">
              Usuário: @{telegramUsername}
            </p>
          )}
          <p className="text-slate-400 text-xs mt-2">
            Você pode criar eventos enviando mensagens para o bot no Telegram.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-2 text-yellow-400 mb-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span className="font-medium">Conta não vinculada</span>
            </div>
            <p className="text-slate-300 text-sm">
              Vincule sua conta Telegram para criar eventos via bot.
            </p>
          </div>

          {token ? (
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token de vinculação:
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 px-3 py-2 rounded text-sm text-green-400 font-mono break-all">
                    {token}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Copiar token"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm font-medium mb-2">
                  📱 Próximos passos:
                </p>
                <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Abra o bot no Telegram</li>
                  <li>Envie: <code className="bg-slate-800 px-1 rounded">/link {token}</code></li>
                  <li>Aguarde a confirmação</li>
                </ol>
              </div>

              <button
                onClick={() => setToken(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Gerar novo token
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateToken}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Gerar Token de Vinculação
            </button>
          )}

          <div className="bg-slate-700/30 rounded-lg p-4">
            <p className="text-slate-300 text-sm font-medium mb-2">
              📚 Como usar o bot:
            </p>
            <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
              <li>Envie mensagens de texto para criar eventos</li>
              <li>Use o formato: Título | Data | Tipo | Link</li>
              <li>Comandos: /start, /help, /eventos</li>
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
