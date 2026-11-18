import type { CookieOptions } from 'express';
import { duracaoSessaoMs } from '../services/sessaoService';

export const NOME_COOKIE_SESSAO = 'sessao';

// HttpOnly esconde o token do JavaScript; SameSite=Lax evita o envio em requisições de outros sites.
export function opcoesCookieSessao(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: duracaoSessaoMs,
  };
}

export function lerCookie(cabecalho: string | undefined, nome: string): string | undefined {
  if (!cabecalho) {
    return undefined;
  }

  for (const par of cabecalho.split(';')) {
    const posicao = par.indexOf('=');

    if (posicao > 0 && par.slice(0, posicao).trim() === nome) {
      return decodeURIComponent(par.slice(posicao + 1).trim());
    }
  }

  return undefined;
}
