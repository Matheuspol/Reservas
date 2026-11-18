import { ErroDeNegocio } from '../erros/erroDeNegocio';
import * as reservaRepository from '../repositories/reservaRepository';
import * as usuarioRepository from '../repositories/usuarioRepository';
import type { DadosReserva, Reserva } from '../types/reserva';
import type { UsuarioSessao } from '../types/sessao';

const formatoId = /^[a-f0-9]{24}$/i;

// Monta só os campos conhecidos, então qualquer campo extra enviado pelo cliente é ignorado.
function normalizar(dados: DadosReserva): DadosReserva {
  return {
    espaco: dados.espaco.trim(),
    data: dados.data,
    horaInicio: dados.horaInicio,
    horaFim: dados.horaFim,
    status: dados.status,
  };
}

function dataDeHoje(): string {
  return new Date().toLocaleDateString('sv-SE');
}

async function garantirHorarioLivre(dados: DadosReserva, ignorarId?: string): Promise<void> {
  if (dados.status !== 'CONFIRMADA') {
    return;
  }

  if (await reservaRepository.existeConflito(dados, ignorarId)) {
    throw new ErroDeNegocio('Já existe uma reserva confirmada para este espaço neste horário', 409);
  }
}

// O responsável é o dono da reserva. Ao editar, o administrador pode passá-la para outro usuário.
async function buscarNovoDono(usuarioId: string) {
  const dono = formatoId.test(usuarioId) ? await usuarioRepository.buscarPorId(usuarioId) : null;

  if (!dono) {
    throw new ErroDeNegocio('Usuário não encontrado', 400);
  }

  return { usuarioId: dono.id, responsavel: dono.nome };
}

// Cliente só altera as próprias reservas; administrador altera todas.
async function buscarParaAlterar(id: string, usuario: UsuarioSessao): Promise<Reserva | null> {
  const reserva = await reservaRepository.buscarPorId(id);
  const podeAlterar = usuario.perfil === 'ADMIN' || reserva?.usuarioId === usuario.id;

  if (reserva && !podeAlterar) {
    throw new ErroDeNegocio('Você só pode alterar as suas próprias reservas', 403);
  }

  return reserva;
}

export async function criarReserva(dados: DadosReserva, usuario: UsuarioSessao): Promise<Reserva> {
  const reserva = normalizar(dados);

  if (reserva.data < dataDeHoje()) {
    throw new ErroDeNegocio('Não é possível reservar em uma data passada', 400);
  }

  await garantirHorarioLivre(reserva);
  // Quem cria é sempre o dono e o responsável.
  return reservaRepository.criar({ ...reserva, usuarioId: usuario.id, responsavel: usuario.nome });
}

export function listarReservas(): Promise<Reserva[]> {
  return reservaRepository.listar();
}

export function buscarReservaPorId(id: string): Promise<Reserva | null> {
  return reservaRepository.buscarPorId(id);
}

export async function atualizarReserva(
  id: string,
  dados: DadosReserva,
  usuario: UsuarioSessao,
): Promise<Reserva | null> {
  if (!(await buscarParaAlterar(id, usuario))) {
    return null;
  }

  const reserva = normalizar(dados);
  // Só o administrador pode trocar o dono; para os demais a reserva mantém o dono de antes.
  const novoUsuarioId = usuario.perfil === 'ADMIN' ? dados.usuarioId : undefined;
  const novoDono = novoUsuarioId ? await buscarNovoDono(novoUsuarioId) : {};

  await garantirHorarioLivre(reserva, id);
  return reservaRepository.atualizar(id, { ...reserva, ...novoDono });
}

export async function excluirReserva(id: string, usuario: UsuarioSessao): Promise<boolean> {
  if (!(await buscarParaAlterar(id, usuario))) {
    return false;
  }

  return reservaRepository.excluir(id);
}
