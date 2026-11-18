import type { Request, Response } from 'express';
import {
  atualizarReserva,
  buscarReservaPorId,
  criarReserva,
  excluirReserva,
  listarReservas,
} from '../services/reservaService';
import type { DadosReserva } from '../types/reserva';
import type { UsuarioSessao } from '../types/sessao';

interface ParametrosId {
  id: string;
}

// O middleware exigirSessao já deixou o usuário logado em resposta.locals.
function usuarioLogado(resposta: Response): UsuarioSessao {
  return resposta.locals.usuario as UsuarioSessao;
}

export async function criar(
  requisicao: Request<object, object, DadosReserva>,
  resposta: Response,
): Promise<void> {
  const reserva = await criarReserva(requisicao.body, usuarioLogado(resposta));
  resposta.status(201).json(reserva);
}

export async function listar(_requisicao: Request, resposta: Response): Promise<void> {
  const reservas = await listarReservas();
  resposta.status(200).json(reservas);
}

export async function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const reserva = await buscarReservaPorId(requisicao.params.id);
  if (!reserva) {
    resposta.status(404).json({ mensagem: 'Reserva não encontrada' });
    return;
  }
  resposta.status(200).json(reserva);
}

export async function atualizar(
  requisicao: Request<ParametrosId, object, DadosReserva>,
  resposta: Response,
): Promise<void> {
  const reserva = await atualizarReserva(
    requisicao.params.id,
    requisicao.body,
    usuarioLogado(resposta),
  );
  if (!reserva) {
    resposta.status(404).json({ mensagem: 'Reserva não encontrada' });
    return;
  }
  resposta.status(200).json(reserva);
}

export async function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const reservaFoiExcluida = await excluirReserva(requisicao.params.id, usuarioLogado(resposta));
  if (!reservaFoiExcluida) {
    resposta.status(404).json({ mensagem: 'Reserva não encontrada' });
    return;
  }
  resposta.status(204).send();
}
