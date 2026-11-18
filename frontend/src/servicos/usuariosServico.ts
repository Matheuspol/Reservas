import type { UsuarioSessao } from '../tipos';
import { requisitar } from './api';

// Só o administrador pode listar usuários (usado para trocar o responsável ao editar).
export function listarUsuarios(): Promise<UsuarioSessao[]> {
  return requisitar<UsuarioSessao[]>('/usuarios');
}
