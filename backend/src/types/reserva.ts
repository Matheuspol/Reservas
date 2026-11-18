export type StatusReserva = 'CONFIRMADA' | 'CANCELADA';

// Dados enviados ao criar ou editar uma reserva.
// usuarioId só vale ao editar e só para o administrador: passa a reserva para outro usuário.
export interface DadosReserva {
  espaco: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReserva;
  usuarioId?: string;
}

// O responsável e o dono (usuarioId) são definidos pelo servidor.
export interface Reserva extends DadosReserva {
  id: string;
  responsavel: string;
}
