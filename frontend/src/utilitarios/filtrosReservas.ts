import type { Reserva, StatusReserva } from '../tipos';

export interface Filtros {
  busca: string;
  status: 'TODAS' | StatusReserva;
}

export const filtrosIniciais: Filtros = { busca: '', status: 'TODAS' };

// Só reservas de hoje em diante, filtradas por situação e pela busca (espaço ou responsável).
export function filtrar(reservas: Reserva[], filtros: Filtros, hoje: string): Reserva[] {
  const busca = filtros.busca.trim().toLowerCase();

  return reservas.filter(
    (reserva) =>
      reserva.data >= hoje &&
      (filtros.status === 'TODAS' || reserva.status === filtros.status) &&
      (reserva.espaco.toLowerCase().includes(busca) ||
        reserva.responsavel.toLowerCase().includes(busca)),
  );
}

// Junta as reservas do mesmo dia: [['2026-11-17', [reserva, reserva]], ...]
export function agruparPorData(reservas: Reserva[]): [string, Reserva[]][] {
  const grupos = new Map<string, Reserva[]>();

  for (const reserva of reservas) {
    grupos.set(reserva.data, [...(grupos.get(reserva.data) ?? []), reserva]);
  }

  return [...grupos];
}

export function contarIndicadores(reservas: Reserva[], hoje: string) {
  const confirmadas = reservas.filter((r) => r.status === 'CONFIRMADA');

  return {
    hoje: confirmadas.filter((r) => r.data === hoje).length,
    proximas: confirmadas.filter((r) => r.data > hoje).length,
    canceladas: reservas.filter((r) => r.status === 'CANCELADA').length,
  };
}
