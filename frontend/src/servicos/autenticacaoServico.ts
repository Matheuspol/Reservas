import type { DadosCadastro, UsuarioSessao } from '../tipos';
import { ErroApi, requisitar } from './api';

export async function entrar(email: string, senha: string): Promise<UsuarioSessao> {
  const resposta = await requisitar<{ usuario: UsuarioSessao }>('/login', {
    metodo: 'POST',
    corpo: { email, senha },
    tratar401: true,
  });
  return resposta.usuario;
}

// 401 vira null (sem sessão). Outros erros sobem, para a tela não confundir
// API fora do ar com usuário deslogado.
export async function consultarSessao(): Promise<UsuarioSessao | null> {
  try {
    const resposta = await requisitar<{ usuario: UsuarioSessao }>('/sessao', { tratar401: true });
    return resposta.usuario;
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      return null;
    }
    throw erro;
  }
}

export function sair(): Promise<void> {
  return requisitar<void>('/logout', { metodo: 'POST', tratar401: true });
}

export function cadastrar(dados: DadosCadastro): Promise<void> {
  return requisitar<void>('/cadastro', { metodo: 'POST', corpo: dados });
}
