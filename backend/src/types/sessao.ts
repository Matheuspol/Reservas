import type { PerfilUsuario } from './usuario';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}
