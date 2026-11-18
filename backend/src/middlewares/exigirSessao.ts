import type { NextFunction, Request, Response } from 'express';
import { NOME_COOKIE_SESSAO, lerCookie, opcoesCookieSessao } from '../configuracoes/cookie';
import { consultarSessao } from '../services/sessaoService';

export function exigirSessao(requisicao: Request, resposta: Response, proximo: NextFunction): void {
  const token = lerCookie(requisicao.headers.cookie, NOME_COOKIE_SESSAO);
  const usuario = consultarSessao(token);

  if (!token || !usuario) {
    resposta.status(401).json({ mensagem: 'Faça login para continuar.' });
    return;
  }

  resposta.cookie(NOME_COOKIE_SESSAO, token, opcoesCookieSessao());
  resposta.locals.usuario = usuario;
  proximo();
}

export function exigirAdmin(_requisicao: Request, resposta: Response, proximo: NextFunction): void {
  const usuario = resposta.locals.usuario as { perfil?: string } | undefined;

  if (usuario?.perfil !== 'ADMIN') {
    resposta.status(403).json({ mensagem: 'Apenas administradores podem acessar este recurso.' });
    return;
  }

  proximo();
}
