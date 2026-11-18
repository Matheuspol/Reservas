import { UsuarioModelo } from '../models/usuarioModel';

export function buscarUsuarioAtivoPorEmail(email: string) {
  return UsuarioModelo.findOne({ email, ativo: true });
}
