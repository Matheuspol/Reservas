import { Outlet, useNavigate } from 'react-router';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { Botao } from './Botao';
import { Logotipo } from './Logotipo';

// Cabeçalho com o usuário e o botão Sair, mais a área onde cada página aparece.
export function LayoutPrincipal() {
  const { usuario, sair } = useAutenticacao();
  const navegar = useNavigate();

  async function aoSair() {
    await sair();
    navegar('/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logotipo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{usuario?.nome}</span>
            <Botao variante="secundario" compacto onClick={aoSair}>
              Sair
            </Botao>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
