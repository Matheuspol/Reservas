import { ReservaModelo } from '../models/reservaModel';
import type { DadosReserva, Reserva } from '../types/reserva';

function paraReserva(documento: { toJSON: () => unknown }): Reserva {
  return documento.toJSON() as Reserva;
}

export async function criar(
  dados: DadosReserva & { responsavel: string; usuarioId: string },
): Promise<Reserva> {
  return paraReserva(await ReservaModelo.create(dados));
}

export async function listar(): Promise<Reserva[]> {
  const reservas = await ReservaModelo.find().sort({ data: 1, horaInicio: 1 });
  return reservas.map(paraReserva);
}

export async function buscarPorId(id: string): Promise<Reserva | null> {
  const reserva = await ReservaModelo.findById(id);
  return reserva ? paraReserva(reserva) : null;
}

export async function atualizar(
  id: string,
  dados: DadosReserva & { responsavel?: string },
): Promise<Reserva | null> {
  const reserva = await ReservaModelo.findByIdAndUpdate(id, dados, {
    returnDocument: 'after',
    runValidators: true,
  });
  return reserva ? paraReserva(reserva) : null;
}

export async function excluir(id: string): Promise<boolean> {
  return (await ReservaModelo.findByIdAndDelete(id)) !== null;
}

export async function existeConflito(
  dados: Pick<DadosReserva, 'espaco' | 'data' | 'horaInicio' | 'horaFim'>,
  ignorarId?: string,
): Promise<boolean> {
  const conflito = await ReservaModelo.exists({
    ...(ignorarId ? { _id: { $ne: ignorarId } } : {}),
    espaco: dados.espaco,
    data: dados.data,
    status: 'CONFIRMADA',
    horaInicio: { $lt: dados.horaFim },
    horaFim: { $gt: dados.horaInicio },
  });
  return conflito !== null;
}
