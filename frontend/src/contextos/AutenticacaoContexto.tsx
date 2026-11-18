import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { definirAoPerderSessao, mensagemDoErro } from '../servicos/api';
import * as autenticacaoServico from '../servicos/autenticacaoServico';
import type { UsuarioSessao } from '../tipos';

type Situacao = 'carregando' | 'autenticado' | 'anonimo' | 'erro';

interface AutenticacaoValor {
  situacao: Situacao;
  usuario: UsuarioSessao | null;
  erroConexao: string;
  sessaoExpirada: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  tentarNovamente: () => void;
}

const AutenticacaoContexto = createContext<AutenticacaoValor | null>(null);

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [situacao, setSituacao] = useState<Situacao>('carregando');
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [erroConexao, setErroConexao] = useState('');
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;

    autenticacaoServico
      .consultarSessao()
      .then((encontrado) => {
        if (cancelado) return;
        setUsuario(encontrado);
        setSituacao(encontrado ? 'autenticado' : 'anonimo');
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        setErroConexao(mensagemDoErro(erro));
        setSituacao('erro');
      });

    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  useEffect(() => {
    definirAoPerderSessao(() => {
      setUsuario(null);
      setSituacao('anonimo');
      setSessaoExpirada(true);
    });
    return () => definirAoPerderSessao(null);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const logado = await autenticacaoServico.entrar(email, senha);
    setSessaoExpirada(false);
    setUsuario(logado);
    setSituacao('autenticado');
  }, []);

  const sair = useCallback(async () => {
    try {
      await autenticacaoServico.sair();
    } finally {
      setSessaoExpirada(false);
      setUsuario(null);
      setSituacao('anonimo');
    }
  }, []);

  const tentarNovamente = useCallback(() => {
    setSituacao('carregando');
    setTentativa((atual) => atual + 1);
  }, []);

  const valor = useMemo(
    () => ({ situacao, usuario, erroConexao, sessaoExpirada, entrar, sair, tentarNovamente }),
    [situacao, usuario, erroConexao, sessaoExpirada, entrar, sair, tentarNovamente],
  );

  return <AutenticacaoContexto value={valor}>{children}</AutenticacaoContexto>;
}

export function useAutenticacao(): AutenticacaoValor {
  const contexto = useContext(AutenticacaoContexto);

  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de AutenticacaoProvider');
  }

  return contexto;
}
