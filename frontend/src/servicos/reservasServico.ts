import type { DadosReserva, Reserva } from '../tipos';
import { requisitar } from './api';

export function listarReservas(): Promise<Reserva[]> {
  return requisitar<Reserva[]>('/reservas');
}

export function buscarReserva(id: string): Promise<Reserva> {
  return requisitar<Reserva>(`/reservas/${id}`);
}

export function criarReserva(dados: DadosReserva): Promise<Reserva> {
  return requisitar<Reserva>('/reservas', { metodo: 'POST', corpo: dados });
}

export function atualizarReserva(id: string, dados: DadosReserva): Promise<Reserva> {
  return requisitar<Reserva>(`/reservas/${id}`, { metodo: 'PUT', corpo: dados });
}

export function excluirReserva(id: string): Promise<void> {
  return requisitar<void>(`/reservas/${id}`, { metodo: 'DELETE' });
}
