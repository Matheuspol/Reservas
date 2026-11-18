import { buscarUsuarioAtivoPorEmail } from '../repositories/loginRepository';
import type { UsuarioSessao } from '../types/sessao';

export async function autenticar(email: string, senha: string): Promise<UsuarioSessao | null> {
  const usuario = await buscarUsuarioAtivoPorEmail(email.trim().toLowerCase());

  if (usuario?.senha !== senha) {
    return null;
  }

  return {
    id: String(usuario._id),
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };
}
