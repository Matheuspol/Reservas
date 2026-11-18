import type { NextFunction, Request, Response } from 'express';

// O cadastro público nunca cria administrador: perfil e situação vêm do servidor.
export function definirPerfilCliente(
  requisicao: Request,
  _resposta: Response,
  proximo: NextFunction,
): void {
  const corpo: unknown = requisicao.body;

  if (typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo)) {
    Object.assign(corpo, { perfil: 'CLIENTE', ativo: true });
  }

  proximo();
}
