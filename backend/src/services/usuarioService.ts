import { ErroDeNegocio } from '../erros/erroDeNegocio';
import * as usuarioRepository from '../repositories/usuarioRepository';
import type { DadosUsuario, Usuario } from '../types/usuario';

function normalizar(dados: DadosUsuario): DadosUsuario {
  return { ...dados, nome: dados.nome.trim(), email: dados.email.trim().toLowerCase() };
}

async function garantirEmailDisponivel(email: string, ignorarId?: string): Promise<void> {
  if (await usuarioRepository.emailEmUso(email, ignorarId)) {
    throw new ErroDeNegocio('Já existe um usuário cadastrado com este email', 409);
  }
}

export async function criarUsuario(dados: DadosUsuario): Promise<Usuario> {
  const usuario = normalizar(dados);

  await garantirEmailDisponivel(usuario.email);
  return usuarioRepository.criar(usuario);
}

export function listarUsuarios(): Promise<Usuario[]> {
  return usuarioRepository.listar();
}

export function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  return usuarioRepository.buscarPorId(id);
}

export async function atualizarUsuario(id: string, dados: DadosUsuario): Promise<Usuario | null> {
  const usuario = normalizar(dados);

  await garantirEmailDisponivel(usuario.email, id);
  return usuarioRepository.atualizar(id, usuario);
}

export function excluirUsuario(id: string): Promise<boolean> {
  return usuarioRepository.excluir(id);
}
