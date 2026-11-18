export type PerfilUsuario = 'CLIENTE' | 'ADMIN';

export interface DadosUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface Usuario extends DadosUsuario {
  id: string;
}
