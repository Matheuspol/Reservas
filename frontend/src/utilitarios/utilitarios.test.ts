import { describe, expect, it } from 'vitest';
import type { DadosReserva } from '../tipos';
import { diasEntre, hojeISO, tituloDoDia } from './datas';
import { validarCadastro, validarLogin, validarReserva } from './validacao';

const reservaValida: DadosReserva = {
  espaco: 'Quadra 1',
  data: '2026-12-10',
  horaInicio: '18:00',
  horaFim: '19:00',
  status: 'CONFIRMADA',
};

describe('datas', () => {
  it('calcula a diferença em dias', () => {
    expect(diasEntre('2026-11-05', '2026-11-06')).toBe(1);
    expect(diasEntre('2026-11-05', '2026-11-05')).toBe(0);
    expect(diasEntre('2026-11-05', '2026-11-04')).toBe(-1);
  });

  it('dá nome especial a hoje e amanhã', () => {
    expect(tituloDoDia('2026-11-05', '2026-11-05')).toMatch(/^Hoje · /);
    expect(tituloDoDia('2026-11-06', '2026-11-05')).toMatch(/^Amanhã · /);
    expect(tituloDoDia('2026-11-20', '2026-11-05')).toMatch(/^Sexta-feira, 20 de novembro$/);
  });

  it('usa o dia local em hojeISO', () => {
    expect(hojeISO(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
  });
});

describe('validarReserva', () => {
  it('aceita uma reserva completa', () => {
    expect(validarReserva(reservaValida, '2026-11-05', true)).toEqual({});
  });

  it('exige os campos de texto, a data e os horários', () => {
    const erros = validarReserva(
      { ...reservaValida, espaco: ' ', data: '', horaInicio: '', horaFim: '' },
      '2026-11-05',
      true,
    );

    expect(Object.keys(erros).sort()).toEqual(['data', 'espaco', 'horaFim', 'horaInicio'].sort());
  });

  it('recusa data passada só quando exigido', () => {
    const passada = { ...reservaValida, data: '2026-01-01' };

    expect(validarReserva(passada, '2026-11-05', true).data).toBeDefined();
    expect(validarReserva(passada, '2026-11-05', false).data).toBeUndefined();
  });

  it('exige término depois do início', () => {
    expect(validarReserva({ ...reservaValida, horaFim: '18:00' }, '2026-11-05', true).horaFim).toBe(
      'O término deve ser depois do início.',
    );
  });
});

describe('validarLogin e validarCadastro', () => {
  it('valida email e senha do login', () => {
    expect(validarLogin('', '')).toEqual({
      email: 'Informe seu email.',
      senha: 'Informe sua senha.',
    });
    expect(validarLogin('abc', '123').email).toBe('Informe um email válido.');
    expect(validarLogin('a@b.com', '123')).toEqual({});
  });

  it('valida nome, tamanho da senha e confirmação no cadastro', () => {
    expect(validarCadastro('', 'a@b.com', '123', '321')).toEqual({
      nome: 'Informe seu nome.',
      senha: 'A senha deve ter pelo menos 6 caracteres.',
      confirmacao: 'As senhas não conferem.',
    });
    expect(validarCadastro('Ana', 'a@b.com', '123456', '123456')).toEqual({});
  });
});
