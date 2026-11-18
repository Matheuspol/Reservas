import { createContext, useContext, useState, type ReactNode } from 'react';

interface Notificacao {
  id: string;
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

interface NotificacoesValor {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
}

const NotificacoesContexto = createContext<NotificacoesValor | null>(null);

// Avisos que aparecem no canto da tela e somem sozinhos.
export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  function remover(id: string) {
    setNotificacoes((atuais) => atuais.filter((n) => n.id !== id));
  }

  function adicionar(tipo: Notificacao['tipo'], mensagem: string) {
    const id = crypto.randomUUID();
    setNotificacoes((atuais) => [...atuais, { id, tipo, mensagem }]);
    setTimeout(() => remover(id), 5000);
  }

  const valor = {
    sucesso: (mensagem: string) => adicionar('sucesso', mensagem),
    erro: (mensagem: string) => adicionar('erro', mensagem),
  };

  return (
    <NotificacoesContexto value={valor}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2"
      >
        {notificacoes.map((n) => (
          <div
            key={n.id}
            role={n.tipo === 'erro' ? 'alert' : 'status'}
            className={`flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 text-sm font-medium shadow-lg ${
              n.tipo === 'erro'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            <p className="flex-1">{n.mensagem}</p>
            <button type="button" onClick={() => remover(n.id)} aria-label="Fechar aviso">
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificacoesContexto>
  );
}

export function useNotificacoes(): NotificacoesValor {
  const contexto = useContext(NotificacoesContexto);

  if (!contexto) {
    throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  }

  return contexto;
}
