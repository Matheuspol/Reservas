import type { Request, Response } from 'express';
import type { DadosUsuario } from '../types/usuario';
import {
  atualizarUsuario,
  buscarUsuarioPorId,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '../services/usuarioService';

interface ParametrosId {
  id: string;
}

export async function criar(
  requisicao: Request<object, object, DadosUsuario>,
  resposta: Response,
): Promise<void> {
  const usuario = await criarUsuario(requisicao.body);
  resposta.status(201).json(usuario);
}

export async function listar(_requisicao: Request, resposta: Response): Promise<void> {
  const usuarios = await listarUsuarios();
  resposta.status(200).json(usuarios);
}

export async function buscarPorId(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const usuario = await buscarUsuarioPorId(requisicao.params.id);
  if (!usuario) {
    resposta.status(404).json({ mensagem: 'Usuário não encontrado' });
    return;
  }
  resposta.status(200).json(usuario);
}

export async function atualizar(
  requisicao: Request<ParametrosId, object, DadosUsuario>,
  resposta: Response,
): Promise<void> {
  const usuario = await atualizarUsuario(requisicao.params.id, requisicao.body);
  if (!usuario) {
    resposta.status(404).json({ mensagem: 'Usuário não encontrado' });
    return;
  }
  resposta.status(200).json(usuario);
}

export async function excluir(
  requisicao: Request<ParametrosId>,
  resposta: Response,
): Promise<void> {
  const usuarioFoiExcluido = await excluirUsuario(requisicao.params.id);
  if (!usuarioFoiExcluido) {
    resposta.status(404).json({ mensagem: 'Usuário não encontrado' });
    return;
  }
  resposta.status(204).send();
}
