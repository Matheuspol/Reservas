import { Navigate, Outlet, useLocation } from 'react-router';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { Botao } from './Botao';
import { Carregando } from './Carregando';
import { EstadoVazio } from './EstadoVazio';

// Páginas que exigem login. Sem sessão, vai para /login e volta para cá depois de entrar.
export function RotaProtegida() {
  const { situacao, erroConexao, tentarNovamente } = useAutenticacao();
  const localizacao = useLocation();

  if (situacao === 'carregando') {
    return <Carregando mensagem="Verificando sua sessão…" />;
  }

  if (situacao === 'erro') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EstadoVazio
          titulo="Não foi possível falar com o servidor"
          descricao={erroConexao}
          acao={<Botao onClick={tentarNovamente}>Tentar novamente</Botao>}
        />
      </div>
    );
  }

  if (situacao === 'anonimo') {
    return (
      <Navigate to="/login" replace state={{ de: localizacao.pathname + localizacao.search }} />
    );
  }

  return <Outlet />;
}

// Login e cadastro. Quem já está logado vai direto para o sistema.
export function RotaPublica() {
  const { situacao } = useAutenticacao();
  const estado = useLocation().state as { de?: string } | null;

  if (situacao === 'carregando') {
    return <Carregando />;
  }

  if (situacao === 'autenticado') {
    return <Navigate to={estado?.de ?? '/'} replace />;
  }

  return <Outlet />;
}
