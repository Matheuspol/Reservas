import type { Request, Response } from 'express';
import { consultar, entrar, sair } from '../../src/controllers/loginController';
import * as loginService from '../../src/services/loginService';
import * as sessaoService from '../../src/services/sessaoService';
import type { DadosLogin } from '../../src/types/login';
import type { UsuarioSessao } from '../../src/types/sessao';

jest.mock('../../src/services/loginService');

const serviceMockado = jest.mocked(loginService);

const usuario: UsuarioSessao = {
  id: '66c47aa12ea87f8123456701',
  nome: 'Mariana Costa',
  email: 'mariana@email.com',
  perfil: 'CLIENTE',
};

function criarResposta() {
  const status = jest.fn();
  const json = jest.fn();
  const send = jest.fn();
  const cookie = jest.fn();
  const clearCookie = jest.fn();
  const resposta = { status, json, send, cookie, clearCookie, locals: {} } as unknown as Response;
  status.mockReturnValue(resposta);
  return { resposta, status, json, send, cookie, clearCookie };
}

function requisicaoDeLogin(corpo: unknown): Request<object, object, DadosLogin> {
  return { body: corpo } as Request<object, object, DadosLogin>;
}

describe('loginController.entrar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    sessaoService.limparSessoes();
  });

  it('responde 200, grava o cookie de sessão e devolve o usuário quando as credenciais são válidas', async () => {
    serviceMockado.autenticar.mockResolvedValue(usuario);
    const { resposta, status, json, cookie } = criarResposta();

    await entrar(requisicaoDeLogin({ email: 'mariana@email.com', senha: '123456' }), resposta);

    expect(serviceMockado.autenticar).toHaveBeenCalledWith('mariana@email.com', '123456');
    expect(cookie).toHaveBeenCalledWith(
      'sessao',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Login realizado.', usuario });
  });

  it('responde 401 e não cria cookie quando as credenciais são inválidas', async () => {
    serviceMockado.autenticar.mockResolvedValue(null);
    const { resposta, status, json, cookie } = criarResposta();

    await entrar(requisicaoDeLogin({ email: 'mariana@email.com', senha: 'errada' }), resposta);

    expect(cookie).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Email ou senha inválidos.' });
  });

  it('responde 400 e não chama o service quando faltam email ou senha', async () => {
    const { resposta, status, json } = criarResposta();

    await entrar(requisicaoDeLogin({ email: '', senha: '123456' }), resposta);

    expect(serviceMockado.autenticar).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Informe email e senha.' });
  });

  it('responde 400 quando o body não é informado', async () => {
    const { resposta, status, json } = criarResposta();

    await entrar(requisicaoDeLogin(undefined), resposta);

    expect(serviceMockado.autenticar).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Informe email e senha.' });
  });
});

describe('loginController.consultar', () => {
  it('devolve o usuário que o middleware deixou na resposta', () => {
    const { resposta, status, json } = criarResposta();
    resposta.locals.usuario = usuario;

    consultar({} as Request, resposta);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ usuario });
  });
});

describe('loginController.sair', () => {
  it('encerra a sessão no servidor, remove o cookie e responde 204', () => {
    const token = sessaoService.criarSessao(usuario);
    const { resposta, status, send, clearCookie } = criarResposta();

    sair({ headers: { cookie: `sessao=${token}` } } as Request, resposta);

    expect(sessaoService.consultarSessao(token)).toBeNull();
    expect(clearCookie).toHaveBeenCalledWith('sessao', expect.objectContaining({ httpOnly: true }));
    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalled();
  });

  it('também responde 204 quando não há cookie (logout é idempotente)', () => {
    const { resposta, status } = criarResposta();

    sair({ headers: {} } as Request, resposta);

    expect(status).toHaveBeenCalledWith(204);
  });
});
