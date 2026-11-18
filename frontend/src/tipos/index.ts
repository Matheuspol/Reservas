export type PerfilUsuario = 'CLIENTE' | 'ADMIN';

export type StatusReserva = 'CONFIRMADA' | 'CANCELADA';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

// Dados que o formulário envia. usuarioId só é usado pelo administrador (reservar em nome de alguém).
export interface DadosReserva {
  espaco: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReserva;
  usuarioId?: string;
}

// O responsável é o nome do dono da reserva, definido pelo servidor.
export interface Reserva extends DadosReserva {
  id: string;
  responsavel: string;
}
