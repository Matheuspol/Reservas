import type { NextFunction, Request, Response } from 'express';

const metodosSeguros = new Set(['GET', 'HEAD', 'OPTIONS']);
const origensPadrao = ['http://localhost:5173', 'http://localhost:3000'];

function origensPermitidas(): string[] {
  const configuradas = (process.env.ORIGENS_PERMITIDAS ?? '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

  return configuradas.length > 0 ? configuradas : origensPadrao;
}

// Contra CSRF: o navegador sempre envia Origin em POST/PUT/DELETE. Sem Origin (curl), passa.
export function verificarOrigem(
  requisicao: Request,
  resposta: Response,
  proximo: NextFunction,
): void {
  const origem = requisicao.headers.origin;

  if (!metodosSeguros.has(requisicao.method) && origem && !origensPermitidas().includes(origem)) {
    resposta.status(403).json({ mensagem: 'Origem não permitida.' });
    return;
  }

  proximo();
}
