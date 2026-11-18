import type { Request, Response } from 'express';
import { NOME_COOKIE_SESSAO, lerCookie, opcoesCookieSessao } from '../configuracoes/cookie';
import { autenticar } from '../services/loginService';
import { criarSessao, encerrarSessao } from '../services/sessaoService';
import type { DadosLogin } from '../types/login';
import type { UsuarioSessao } from '../types/sessao';

export async function entrar(
  requisicao: Request<object, object, DadosLogin>,
  resposta: Response,
): Promise<void> {
  const { email, senha } = requisicao.body ?? {};

  if (typeof email !== 'string' || !email.trim() || typeof senha !== 'string' || !senha.trim()) {
    resposta.status(400).json({ mensagem: 'Informe email e senha.' });
    return;
  }

  const usuario = await autenticar(email, senha);

  if (!usuario) {
    resposta.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    return;
  }

  resposta.cookie(NOME_COOKIE_SESSAO, criarSessao(usuario), opcoesCookieSessao());
  resposta.status(200).json({ mensagem: 'Login realizado.', usuario });
}

export function consultar(_requisicao: Request, resposta: Response): void {
  const usuario = resposta.locals.usuario as UsuarioSessao;
  resposta.status(200).json({ usuario });
}

export function sair(requisicao: Request, resposta: Response): void {
  encerrarSessao(lerCookie(requisicao.headers.cookie, NOME_COOKIE_SESSAO));
  resposta.clearCookie(NOME_COOKIE_SESSAO, { ...opcoesCookieSessao(), maxAge: undefined });
  resposta.status(204).send();
}
