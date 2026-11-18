import { randomBytes } from 'node:crypto';
import type { UsuarioSessao } from '../types/sessao';

export const duracaoSessaoMs = 30 * 60 * 1000;

interface Sessao {
  usuario: UsuarioSessao;
  expiraEm: number;
}

// Sessões ficam na memória: reiniciar a API desloga todo mundo.
const sessoes = new Map<string, Sessao>();

function removerExpiradas(): void {
  const agora = Date.now();

  for (const [token, sessao] of sessoes) {
    if (sessao.expiraEm <= agora) {
      sessoes.delete(token);
    }
  }
}

export function criarSessao(usuario: UsuarioSessao): string {
  removerExpiradas();

  const token = randomBytes(32).toString('hex');
  sessoes.set(token, { usuario, expiraEm: Date.now() + duracaoSessaoMs });
  return token;
}

// Cada uso válido renova o prazo (30 min sem uso).
export function consultarSessao(token: string | undefined): UsuarioSessao | null {
  const sessao = token ? sessoes.get(token) : undefined;

  if (!token || !sessao) {
    return null;
  }

  if (sessao.expiraEm <= Date.now()) {
    sessoes.delete(token);
    return null;
  }

  sessao.expiraEm = Date.now() + duracaoSessaoMs;
  return sessao.usuario;
}

export function encerrarSessao(token: string | undefined): void {
  if (token) {
    sessoes.delete(token);
  }
}

export function limparSessoes(): void {
  sessoes.clear();
}
