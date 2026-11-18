import type { NextFunction, Request, Response } from 'express';
import { validarDadosUsuario, validarIdUsuario } from '../../src/middlewares/validarDadosUsuario';
import type { DadosUsuario } from '../../src/types/usuario';

const dadosValidos: DadosUsuario = {
  nome: 'Mariana Costa',
  email: 'mariana.costa@email.com',
  senha: 'senhaInicial123',
  perfil: 'ADMIN',
  ativo: true,
};

function criarResposta(): { resposta: Response; status: jest.Mock; json: jest.Mock } {
  const status = jest.fn();
  const json = jest.fn();
  const resposta = { status, json } as unknown as Response;
  status.mockReturnValue(resposta);
  return { resposta, status, json };
}

describe('validarDadosUsuario', () => {
  it('libera um body completo e válido', () => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarDadosUsuario(
      { body: dadosValidos } as Request<object, object, DadosUsuario>,
      resposta,
      proximo,
    );

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it.each(['nome', 'email', 'senha', 'perfil'] as const)('rejeita %s vazio', (campo) => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn() as NextFunction;
    const body = { ...dadosValidos, [campo]: '   ' };

    validarDadosUsuario({ body } as Request<object, object, DadosUsuario>, resposta, proximo);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Dados do usuário inválidos' });
    expect(proximo).not.toHaveBeenCalled();
  });

  it('aceita ativo igual a false, pois ele continua sendo booleano', () => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarDadosUsuario(
      { body: { ...dadosValidos, ativo: false } } as Request<object, object, DadosUsuario>,
      resposta,
      proximo,
    );

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it('rejeita ativo que não é booleano', () => {
    const { resposta, status } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarDadosUsuario(
      { body: { ...dadosValidos, ativo: 'true' } } as unknown as Request<
        object,
        object,
        DadosUsuario
      >,
      resposta,
      proximo,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(proximo).not.toHaveBeenCalled();
  });

  it('rejeita perfil que não pertence à lista permitida', () => {
    const { resposta, status } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarDadosUsuario(
      { body: { ...dadosValidos, perfil: 'GERENTE' } } as unknown as Request<
        object,
        object,
        DadosUsuario
      >,
      resposta,
      proximo,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(proximo).not.toHaveBeenCalled();
  });

  it('rejeita body que não é objeto', () => {
    const { resposta, status } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarDadosUsuario(
      { body: [] } as unknown as Request<object, object, DadosUsuario>,
      resposta,
      proximo,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(proximo).not.toHaveBeenCalled();
  });
});

describe('validarIdUsuario', () => {
  it('libera id MongoDB com 24 caracteres hexadecimais', () => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarIdUsuario(
      { params: { id: '66c47aa12ea87f8123456701' } } as Request<{ id: string }>,
      resposta,
      proximo,
    );

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it('rejeita id fora do formato MongoDB', () => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn() as NextFunction;

    validarIdUsuario(
      { params: { id: 'id-invalido' } } as Request<{ id: string }>,
      resposta,
      proximo,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Identificador inválido' });
    expect(proximo).not.toHaveBeenCalled();
  });
});
