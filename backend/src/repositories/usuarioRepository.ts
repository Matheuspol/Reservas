import { UsuarioModelo } from '../models/usuarioModel';
import type { DadosUsuario, Usuario } from '../types/usuario';

export async function criar(dados: DadosUsuario): Promise<Usuario> {
  const usuario = await UsuarioModelo.create(dados);
  return usuario.toJSON() as unknown as Usuario;
}

export async function listar(): Promise<Usuario[]> {
  const usuarios = await UsuarioModelo.find();
  return usuarios.map((usuario) => usuario.toJSON() as unknown as Usuario);
}

export async function buscarPorId(id: string): Promise<Usuario | null> {
  const usuario = await UsuarioModelo.findById(id);
  return usuario ? (usuario.toJSON() as unknown as Usuario) : null;
}

export async function atualizar(id: string, dados: DadosUsuario): Promise<Usuario | null> {
  const usuario = await UsuarioModelo.findByIdAndUpdate(id, dados, {
    returnDocument: 'after',
    runValidators: true,
  });
  return usuario ? (usuario.toJSON() as unknown as Usuario) : null;
}

export async function excluir(id: string): Promise<boolean> {
  const usuario = await UsuarioModelo.findByIdAndDelete(id);
  return usuario !== null;
}

export async function emailEmUso(email: string, ignorarId?: string): Promise<boolean> {
  const usuario = await UsuarioModelo.exists({
    ...(ignorarId ? { _id: { $ne: ignorarId } } : {}),
    email,
  });
  return usuario !== null;
}
