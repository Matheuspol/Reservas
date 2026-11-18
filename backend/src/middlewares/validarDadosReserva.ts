import type { NextFunction, Request, Response } from 'express';
import type { DadosReserva } from '../types/reserva';

const statusValidos = new Set(['CONFIRMADA', 'CANCELADA']);
const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
const formatoData = /^(\d{4})-(\d{2})-(\d{2})$/;

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function ehTextoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function ehDataValida(valor: unknown): boolean {
  const partes = typeof valor === 'string' ? formatoData.exec(valor) : null;

  if (!partes) {
    return false;
  }

  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

function ehHoraValida(valor: unknown): valor is string {
  return typeof valor === 'string' && formatoHora.test(valor);
}

function possuiIntervaloValido({ horaInicio, horaFim }: Record<string, unknown>): boolean {
  return ehHoraValida(horaInicio) && ehHoraValida(horaFim) && horaInicio < horaFim;
}

function possuiDadosValidos(dados: Record<string, unknown>): boolean {
  return (
    ehTextoPreenchido(dados.espaco) &&
    ehDataValida(dados.data) &&
    possuiIntervaloValido(dados) &&
    typeof dados.status === 'string' &&
    statusValidos.has(dados.status)
  );
}

export function validarDadosReserva(
  requisicao: Request<object, object, DadosReserva>,
  resposta: Response,
  proximo: NextFunction,
): void {
  if (!ehObjeto(requisicao.body) || !possuiDadosValidos(requisicao.body)) {
    resposta.status(400).json({ mensagem: 'Dados da reserva inválidos' });
    return;
  }

  proximo();
}

export function validarIdReserva(
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
