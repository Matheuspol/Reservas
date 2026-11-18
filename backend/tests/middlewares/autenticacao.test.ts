import type { NextFunction, Request, Response } from 'express';
import { lerCookie } from '../../src/configuracoes/cookie';
import { definirPerfilCliente } from '../../src/middlewares/definirPerfilCliente';
import { exigirAdmin, exigirSessao } from '../../src/middlewares/exigirSessao';
import { verificarOrigem } from '../../src/middlewares/verificarOrigem';
import * as sessaoService from '../../src/services/sessaoService';

function criarResposta() {
  const status = jest.fn();
  const json = jest.fn();
  const cookie = jest.fn();
  const resposta = { status, json, cookie, locals: {} } as unknown as Response;
  status.mockReturnValue(resposta);
  return { resposta, status, json, cookie };
}

describe('lerCookie', () => {
  it('encontra o cookie pelo nome entre vários', () => {
    expect(lerCookie('tema=escuro; sessao=abc123; idioma=pt', 'sessao')).toBe('abc123');
  });

  it('devolve undefined quando não há cabeçalho ou o cookie não existe', () => {
    expect(lerCookie(undefined, 'sessao')).toBeUndefined();
    expect(lerCookie('tema=escuro', 'sessao')).toBeUndefined();
  });

  it('não confunde cookies com nomes parecidos', () => {
    expect(lerCookie('outra_sessao=x', 'sessao')).toBeUndefined();
  });
});

describe('exigirSessao', () => {
  const usuario = {
    id: '66c47aa12ea87f8123456701',
    nome: 'Mariana',
    email: 'm@email.com',
    perfil: 'CLIENTE',
  } as const;

  beforeEach(() => {
    sessaoService.limparSessoes();
  });

  it('libera a requisição e deixa o usuário em locals quando o cookie é válido', () => {
    const token = sessaoService.criarSessao(usuario);
    const { resposta, status, cookie } = criarResposta();
    const proximo = jest.fn();

    exigirSessao({ headers: { cookie: `sessao=${token}` } } as Request, resposta, proximo);

    expect(proximo).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
    expect(resposta.locals.usuario).toEqual(usuario);
    expect(cookie).toHaveBeenCalledWith(
      'sessao',
      token,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('responde 401 sem cookie ou com token desconhecido', () => {
    for (const cabecalho of [undefined, 'sessao=desconhecido']) {
      const { resposta, status, json } = criarResposta();
      const proximo = jest.fn();

      exigirSessao({ headers: { cookie: cabecalho } } as Request, resposta, proximo);

      expect(proximo).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ mensagem: 'Faça login para continuar.' });
    }
  });
});

describe('exigirAdmin', () => {
  it('libera administradores', () => {
    const { resposta } = criarResposta();
    resposta.locals.usuario = { perfil: 'ADMIN' };
    const proximo = jest.fn();

    exigirAdmin({} as Request, resposta, proximo);

    expect(proximo).toHaveBeenCalled();
  });

  it('responde 403 para clientes', () => {
    const { resposta, status } = criarResposta();
    resposta.locals.usuario = { perfil: 'CLIENTE' };
    const proximo = jest.fn();

    exigirAdmin({} as Request, resposta, proximo);

    expect(proximo).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });
});

describe('verificarOrigem', () => {
  function executar(metodo: string, origem?: string) {
    const { resposta, status } = criarResposta();
    const proximo: NextFunction = jest.fn();

    verificarOrigem({ method: metodo, headers: { origin: origem } } as Request, resposta, proximo);

    return { status, proximo };
  }

  it('recusa com 403 uma escrita vinda de outro site', () => {
    const { status, proximo } = executar('POST', 'http://site-malicioso.com');

    expect(status).toHaveBeenCalledWith(403);
    expect(proximo).not.toHaveBeenCalled();
  });

  it('aceita escrita vinda do frontend', () => {
    const { proximo } = executar('DELETE', 'http://localhost:5173');

    expect(proximo).toHaveBeenCalled();
  });

  it('aceita escrita sem Origin (curl, testes automatizados)', () => {
    const { proximo } = executar('POST');

    expect(proximo).toHaveBeenCalled();
  });

  it('não bloqueia leituras, mesmo de outra origem', () => {
    const { proximo } = executar('GET', 'http://site-malicioso.com');

    expect(proximo).toHaveBeenCalled();
  });
});

describe('definirPerfilCliente', () => {
  it('sobrescreve perfil e situação enviados pelo cliente', () => {
    const requisicao = { body: { nome: 'X', perfil: 'ADMIN', ativo: false } } as Request;
    const proximo = jest.fn();

    definirPerfilCliente(requisicao, {} as Response, proximo);

    expect(requisicao.body).toMatchObject({ perfil: 'CLIENTE', ativo: true });
    expect(proximo).toHaveBeenCalled();
  });
});
