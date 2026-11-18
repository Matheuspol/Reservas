import type { NextFunction, Request, Response } from 'express';
import type { DadosUsuario, PerfilUsuario } from '../types/usuario';

const perfisValidos = new Set<PerfilUsuario>(['CLIENTE', 'ADMIN']);

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function ehTextoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function possuiDadosValidos({ nome, email, senha, perfil, ativo }: DadosUsuario): boolean {
  return (
    [nome, email, senha, perfil].every(ehTextoPreenchido) &&
    typeof ativo === 'boolean' &&
    perfisValidos.has(perfil)
  );
}

export function validarDadosUsuario(
  requisicao: Request<object, object, DadosUsuario>,
  resposta: Response,
  proximo: NextFunction,
): void {
  if (!ehObjeto(requisicao.body) || !possuiDadosValidos(requisicao.body)) {
    resposta.status(400).json({ mensagem: 'Dados do usuário inválidos' });
    return;
  }

  proximo();
}

export function validarIdUsuario(
  requisicao: Request<{ id: string }>,
  resposta: Response,
  proximo: NextFunction,
): void {
  if (!/^[a-fA-F0-9]{24}$/.test(requisicao.params.id)) {
    resposta.status(400).json({ mensagem: 'Identificador inválido' });
    return;
  }
  proximo();
}
