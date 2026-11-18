import type { NextFunction, Request, Response } from 'express';
import { validarDadosReserva, validarIdReserva } from '../../src/middlewares/validarDadosReserva';
import type { DadosReserva } from '../../src/types/reserva';

const dadosValidos: DadosReserva = {
  espaco: 'Quadra 1',
  data: '2026-12-10',
  horaInicio: '18:00',
  horaFim: '19:00',
  status: 'CONFIRMADA',
};

function criarResposta(): { resposta: Response; status: jest.Mock; json: jest.Mock } {
  const status = jest.fn();
  const json = jest.fn();
  const resposta = { status, json } as unknown as Response;
  status.mockReturnValue(resposta);
  return { resposta, status, json };
}

function validar(body: unknown): { proximo: jest.Mock; status: jest.Mock; json: jest.Mock } {
  const { resposta, status, json } = criarResposta();
  const proximo = jest.fn();

  validarDadosReserva(
    { body } as Request<object, object, DadosReserva>,
    resposta,
    proximo as NextFunction,
  );

  return { proximo, status, json };
}

function esperarRejeicao(body: unknown): void {
  const { proximo, status, json } = validar(body);

  expect(status).toHaveBeenCalledWith(400);
  expect(json).toHaveBeenCalledWith({ mensagem: 'Dados da reserva inválidos' });
  expect(proximo).not.toHaveBeenCalled();
}

describe('validarDadosReserva', () => {
  it('libera um body completo e válido', () => {
    const { proximo, status } = validar(dadosValidos);

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('aceita o status CANCELADA', () => {
    const { proximo } = validar({ ...dadosValidos, status: 'CANCELADA' });

    expect(proximo).toHaveBeenCalledTimes(1);
  });

  it('rejeita espaço vazio', () => {
    esperarRejeicao({ ...dadosValidos, espaco: '   ' });
  });

  it.each(['espaco', 'data', 'horaInicio', 'horaFim', 'status'] as const)(
    'rejeita quando %s não é informado',
    (campo) => {
      const semCampo = Object.entries(dadosValidos).filter(([chave]) => chave !== campo);
      esperarRejeicao(Object.fromEntries(semCampo));
    },
  );

  it.each(['10/12/2026', '2026-13-01', '2026-02-31', '2026-1-5', 'amanhã'])(
    'rejeita a data inválida %s',
    (data) => {
      esperarRejeicao({ ...dadosValidos, data });
    },
  );

  it.each(['24:00', '9:00', '18:60', 'abc', '18h'])('rejeita a hora inválida %s', (hora) => {
    esperarRejeicao({ ...dadosValidos, horaInicio: hora });
  });

  it('rejeita hora de fim igual à hora de início', () => {
    esperarRejeicao({ ...dadosValidos, horaInicio: '18:00', horaFim: '18:00' });
  });

  it('rejeita hora de fim anterior à hora de início', () => {
    esperarRejeicao({ ...dadosValidos, horaInicio: '19:00', horaFim: '18:00' });
  });

  it('rejeita status fora da lista permitida', () => {
    esperarRejeicao({ ...dadosValidos, status: 'PENDENTE' });
  });

  it.each([undefined, null, [], 'texto'])('rejeita body que não é objeto (%s)', (body) => {
    esperarRejeicao(body);
  });
});

describe('validarIdReserva', () => {
  it('libera id MongoDB com 24 caracteres hexadecimais', () => {
    const { resposta, status } = criarResposta();
    const proximo = jest.fn();

    validarIdReserva(
      { params: { id: '66c47aa12ea87f8123456702' } } as Request<{ id: string }>,
      resposta,
      proximo as NextFunction,
    );

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('rejeita id fora do formato MongoDB', () => {
    const { resposta, status, json } = criarResposta();
    const proximo = jest.fn();

    validarIdReserva(
      { params: { id: 'id-invalido' } } as Request<{ id: string }>,
      resposta,
      proximo as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ mensagem: 'Identificador inválido' });
    expect(proximo).not.toHaveBeenCalled();
  });
});
