// O Vite repassa /api para a API (veja vite.config.ts).
const URL_BASE = '/api';

export class ErroApi extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

let aoPerderSessao: (() => void) | null = null;

export function definirAoPerderSessao(funcao: (() => void) | null): void {
  aoPerderSessao = funcao;
}

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
  // Login e /sessao esperam 401 e tratam o caso sozinhos.
  tratar401?: boolean;
}

function mensagemPadrao(status: number): string {
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Você não tem permissão para fazer isso.';
  if (status === 404) return 'Registro não encontrado.';
  if (status >= 500) return 'O servidor encontrou um problema. Tente novamente em instantes.';
  return 'Não foi possível concluir a operação.';
}

export async function requisitar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo, tratar401 = false } = opcoes;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(
      'Não foi possível conectar ao servidor. Verifique se a API está no ar e tente novamente.',
      0,
    );
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401 && !tratar401) {
      aoPerderSessao?.();
    }

    const mensagem =
      typeof dados === 'object' && dados !== null && 'mensagem' in dados
        ? String(dados.mensagem)
        : mensagemPadrao(resposta.status);

    throw new ErroApi(mensagem, resposta.status);
  }

  return dados as T;
}

export function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}
