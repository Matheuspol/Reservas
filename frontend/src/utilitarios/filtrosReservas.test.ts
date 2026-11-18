import { describe, expect, it } from 'vitest';
import type { Reserva } from '../tipos';
import { agruparPorData, contarIndicadores, filtrar, filtrosIniciais } from './filtrosReservas';

const hoje = '2026-11-05';

function reserva(dados: Partial<Reserva>): Reserva {
  return {
    id: '1',
    espaco: 'Quadra 1',
    responsavel: 'Mariana',
    data: hoje,
    horaInicio: '18:00',
    horaFim: '19:00',
    status: 'CONFIRMADA',
    ...dados,
  };
}

const lista = [
  reserva({ id: 'a', data: '2026-11-01' }),
  reserva({ id: 'b', data: hoje, espaco: 'Sala A', responsavel: 'Carlos' }),
  reserva({ id: 'c', data: '2026-11-06', status: 'CANCELADA' }),
  reserva({ id: 'd', data: '2026-11-06' }),
];

const ids = (reservas: Reserva[]) => reservas.map((r) => r.id);

describe('filtrar', () => {
  it('mostra só reservas de hoje em diante', () => {
    expect(ids(filtrar(lista, filtrosIniciais, hoje))).toEqual(['b', 'c', 'd']);
  });

  it('filtra por situação', () => {
    const canceladas = filtrar(lista, { ...filtrosIniciais, status: 'CANCELADA' }, hoje);
    expect(ids(canceladas)).toEqual(['c']);
  });

  it('busca por espaço ou responsável, sem diferenciar maiúsculas', () => {
    expect(ids(filtrar(lista, { ...filtrosIniciais, busca: ' SALA ' }, hoje))).toEqual(['b']);
    expect(ids(filtrar(lista, { ...filtrosIniciais, busca: 'carlos' }, hoje))).toEqual(['b']);
  });
});

describe('agruparPorData', () => {
  it('junta as reservas do mesmo dia mantendo a ordem', () => {
    const grupos = agruparPorData(lista);
    expect(grupos.map(([data, itens]) => [data, ids(itens)])).toEqual([
      ['2026-11-01', ['a']],
      [hoje, ['b']],
      ['2026-11-06', ['c', 'd']],
    ]);
  });
});

describe('contarIndicadores', () => {
  it('conta confirmadas de hoje, próximas confirmadas e canceladas', () => {
    expect(contarIndicadores(lista, hoje)).toEqual({ hoje: 1, proximas: 1, canceladas: 1 });
  });
});
