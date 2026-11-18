import type { DadosReserva } from '../tipos';

export type Erros<T> = Partial<Record<keyof T, string>>;

const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string): boolean {
  return formatoEmail.test(email.trim());
}

// Espelha as regras do backend; conflito de horário só a API consegue verificar.
export function validarReserva(dados: DadosReserva, hoje: string, exigirDataFutura: boolean) {
  const erros: Erros<DadosReserva> = {};

  if (!dados.espaco.trim()) erros.espaco = 'Informe o espaço.';

  if (!dados.data) {
    erros.data = 'Informe a data.';
  } else if (exigirDataFutura && dados.data < hoje) {
    erros.data = 'A data não pode estar no passado.';
  }

  if (!dados.horaInicio) erros.horaInicio = 'Informe o horário de início.';
  if (!dados.horaFim) erros.horaFim = 'Informe o horário de término.';

  if (dados.horaInicio && dados.horaFim && dados.horaFim <= dados.horaInicio) {
    erros.horaFim = 'O término deve ser depois do início.';
  }

  return erros;
}

export function validarLogin(email: string, senha: string) {
  const erros: Partial<Record<'email' | 'senha', string>> = {};

  if (!email.trim()) erros.email = 'Informe seu email.';
  else if (!emailValido(email)) erros.email = 'Informe um email válido.';

  if (!senha) erros.senha = 'Informe sua senha.';

  return erros;
}

export function validarCadastro(nome: string, email: string, senha: string, confirmacao: string) {
  const erros: Partial<Record<'nome' | 'email' | 'senha' | 'confirmacao', string>> = {};

  if (!nome.trim()) erros.nome = 'Informe seu nome.';

  if (!email.trim()) erros.email = 'Informe seu email.';
  else if (!emailValido(email)) erros.email = 'Informe um email válido.';

  if (senha.length < 6) erros.senha = 'A senha deve ter pelo menos 6 caracteres.';
  if (confirmacao !== senha) erros.confirmacao = 'As senhas não conferem.';

  return erros;
}
