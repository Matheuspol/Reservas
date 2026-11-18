import { ErroDeNegocio } from '../../src/erros/erroDeNegocio';
import * as reservaRepository from '../../src/repositories/reservaRepository';
import * as usuarioRepository from '../../src/repositories/usuarioRepository';
import * as reservaService from '../../src/services/reservaService';
import type { DadosReserva, Reserva } from '../../src/types/reserva';
import type { UsuarioSessao } from '../../src/types/sessao';
import type { Usuario } from '../../src/types/usuario';

jest.mock('../../src/repositories/reservaRepository');
jest.mock('../../src/repositories/usuarioRepository');

const repositoryMockado = jest.mocked(reservaRepository);
const usuariosMockado = jest.mocked(usuarioRepository);

const dono: UsuarioSessao = {
  id: '66c47aa12ea87f8123456701',
  nome: 'Mariana Costa',
  email: 'mariana@email.com',
  perfil: 'CLIENTE',
};
const outroCliente: UsuarioSessao = {
  id: '66c47aa12ea87f8123456799',
  nome: 'Carlos Souza',
  email: 'carlos@email.com',
  perfil: 'CLIENTE',
};
const administrador: UsuarioSessao = {
  id: '66c47aa12ea87f8123456700',
  nome: 'Administrador',
  email: 'admin@email.com',
  perfil: 'ADMIN',
};

const dadosReserva: DadosReserva = {
  espaco: 'Quadra 1',
  data: '2026-12-10',
  horaInicio: '18:00',
  horaFim: '19:00',
  status: 'CONFIRMADA',
};

const reserva: Reserva = {
  id: '66c47aa12ea87f8123456702',
  usuarioId: dono.id,
  responsavel: dono.nome,
  ...dadosReserva,
};

const donoDaReserva = { usuarioId: dono.id, responsavel: dono.nome };

describe('reservaService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: new Date(2026, 11, 1, 12, 0) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('criarReserva', () => {
    it('cria a reserva com o usuário logado como dono e responsável', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.criar.mockResolvedValue(reserva);

      const resultado = await reservaService.criarReserva(dadosReserva, dono);

      expect(repositoryMockado.existeConflito).toHaveBeenCalledWith(dadosReserva, undefined);
      expect(repositoryMockado.criar).toHaveBeenCalledWith({ ...dadosReserva, ...donoDaReserva });
      expect(resultado).toEqual(reserva);
    });

    it('ignora usuarioId e responsável enviados por um cliente', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.criar.mockResolvedValue(reserva);

      await reservaService.criarReserva(
        {
          ...dadosReserva,
          usuarioId: outroCliente.id,
          responsavel: 'Outra Pessoa',
        } as DadosReserva,
        dono,
      );

      expect(repositoryMockado.criar).toHaveBeenCalledWith({ ...dadosReserva, ...donoDaReserva });
      expect(usuariosMockado.buscarPorId).not.toHaveBeenCalled();
    });

    it('remove espaços extras do espaço antes de salvar', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.criar.mockResolvedValue(reserva);

      await reservaService.criarReserva({ ...dadosReserva, espaco: '  Quadra 1 ' }, dono);

      expect(repositoryMockado.criar).toHaveBeenCalledWith({ ...dadosReserva, ...donoDaReserva });
    });

    it('rejeita com 409 quando já existe reserva confirmada no mesmo horário', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(true);

      const tentativa = reservaService.criarReserva(dadosReserva, dono);

      await expect(tentativa).rejects.toBeInstanceOf(ErroDeNegocio);
      await expect(tentativa).rejects.toMatchObject({ status: 409 });
      expect(repositoryMockado.criar).not.toHaveBeenCalled();
    });

    it('rejeita com 400 uma data passada, sem consultar o banco', async () => {
      const tentativa = reservaService.criarReserva({ ...dadosReserva, data: '2026-11-30' }, dono);

      await expect(tentativa).rejects.toMatchObject({ status: 400 });
      expect(repositoryMockado.existeConflito).not.toHaveBeenCalled();
      expect(repositoryMockado.criar).not.toHaveBeenCalled();
    });

    it('aceita reservar para o dia de hoje', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.criar.mockResolvedValue(reserva);

      await reservaService.criarReserva({ ...dadosReserva, data: '2026-12-01' }, dono);

      expect(repositoryMockado.criar).toHaveBeenCalledTimes(1);
    });

    it('não verifica conflito quando a reserva já nasce cancelada', async () => {
      repositoryMockado.criar.mockResolvedValue({ ...reserva, status: 'CANCELADA' });

      await reservaService.criarReserva({ ...dadosReserva, status: 'CANCELADA' }, dono);

      expect(repositoryMockado.existeConflito).not.toHaveBeenCalled();
      expect(repositoryMockado.criar).toHaveBeenCalledTimes(1);
    });

    it('mesmo para o administrador, quem cria é sempre o dono e o responsável', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.criar.mockResolvedValue(reserva);

      await reservaService.criarReserva(
        { ...dadosReserva, usuarioId: outroCliente.id },
        administrador,
      );

      expect(usuariosMockado.buscarPorId).not.toHaveBeenCalled();
      expect(repositoryMockado.criar).toHaveBeenCalledWith({
        ...dadosReserva,
        usuarioId: administrador.id,
        responsavel: administrador.nome,
      });
    });
  });

  describe('atualizarReserva', () => {
    beforeEach(() => {
      repositoryMockado.buscarPorId.mockResolvedValue(reserva);
    });

    it('atualiza ignorando a própria reserva na checagem de conflito', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.atualizar.mockResolvedValue(reserva);

      const resultado = await reservaService.atualizarReserva(reserva.id, dadosReserva, dono);

      expect(repositoryMockado.existeConflito).toHaveBeenCalledWith(dadosReserva, reserva.id);
      expect(repositoryMockado.atualizar).toHaveBeenCalledWith(reserva.id, dadosReserva);
      expect(resultado).toEqual(reserva);
    });

    it('não deixa o cliente trocar o dono nem o responsável', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.atualizar.mockResolvedValue(reserva);

      await reservaService.atualizarReserva(
        reserva.id,
        { ...dadosReserva, usuarioId: outroCliente.id, responsavel: 'Hacker' } as DadosReserva,
        dono,
      );

      expect(repositoryMockado.atualizar).toHaveBeenCalledWith(reserva.id, dadosReserva);
    });

    it('rejeita com 409 quando o novo horário conflita com outra reserva', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(true);

      await expect(
        reservaService.atualizarReserva(reserva.id, dadosReserva, dono),
      ).rejects.toMatchObject({ status: 409 });
      expect(repositoryMockado.atualizar).not.toHaveBeenCalled();
    });

    it('permite cancelar sem checar conflito', async () => {
      const cancelada = { ...dadosReserva, status: 'CANCELADA' as const };
      repositoryMockado.atualizar.mockResolvedValue({ ...reserva, status: 'CANCELADA' });

      await reservaService.atualizarReserva(reserva.id, cancelada, dono);

      expect(repositoryMockado.existeConflito).not.toHaveBeenCalled();
      expect(repositoryMockado.atualizar).toHaveBeenCalledWith(reserva.id, cancelada);
    });

    it('devolve null quando a reserva não existe', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(null);

      await expect(
        reservaService.atualizarReserva(reserva.id, dadosReserva, dono),
      ).resolves.toBeNull();
      expect(repositoryMockado.atualizar).not.toHaveBeenCalled();
    });

    it('rejeita com 403 quando a reserva é de outro cliente', async () => {
      const tentativa = reservaService.atualizarReserva(reserva.id, dadosReserva, outroCliente);

      await expect(tentativa).rejects.toMatchObject({ status: 403 });
      expect(repositoryMockado.atualizar).not.toHaveBeenCalled();
    });

    it('rejeita com 403 quando a reserva não tem dono e quem pede é cliente', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue({ ...reserva, usuarioId: undefined });

      await expect(
        reservaService.atualizarReserva(reserva.id, dadosReserva, dono),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('permite que o administrador altere a reserva de qualquer cliente, sem trocar o dono', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.atualizar.mockResolvedValue(reserva);

      await reservaService.atualizarReserva(reserva.id, dadosReserva, administrador);

      expect(repositoryMockado.atualizar).toHaveBeenCalledWith(reserva.id, dadosReserva);
    });

    it('rejeita com 400 quando o administrador escolhe um usuário que não existe', async () => {
      usuariosMockado.buscarPorId.mockResolvedValue(null);

      const tentativa = reservaService.atualizarReserva(
        reserva.id,
        { ...dadosReserva, usuarioId: outroCliente.id },
        administrador,
      );

      await expect(tentativa).rejects.toMatchObject({ status: 400 });
      expect(repositoryMockado.atualizar).not.toHaveBeenCalled();
    });

    it('rejeita com 400 um id malformado, sem consultar o banco', async () => {
      const tentativa = reservaService.atualizarReserva(
        reserva.id,
        { ...dadosReserva, usuarioId: 'nao-e-um-id' },
        administrador,
      );

      await expect(tentativa).rejects.toMatchObject({ status: 400 });
      expect(usuariosMockado.buscarPorId).not.toHaveBeenCalled();
    });

    it('permite que o administrador passe a reserva para outra pessoa', async () => {
      repositoryMockado.existeConflito.mockResolvedValue(false);
      repositoryMockado.atualizar.mockResolvedValue(reserva);
      usuariosMockado.buscarPorId.mockResolvedValue({
        id: outroCliente.id,
        nome: outroCliente.nome,
      } as Usuario);

      await reservaService.atualizarReserva(
        reserva.id,
        { ...dadosReserva, usuarioId: outroCliente.id },
        administrador,
      );

      expect(repositoryMockado.atualizar).toHaveBeenCalledWith(reserva.id, {
        ...dadosReserva,
        usuarioId: outroCliente.id,
        responsavel: outroCliente.nome,
      });
    });
  });

  describe('consulta e exclusão', () => {
    it('lista as reservas, inclusive quando não há nenhuma', async () => {
      repositoryMockado.listar.mockResolvedValue([]);

      await expect(reservaService.listarReservas()).resolves.toEqual([]);
    });

    it('devolve a reserva localizada pelo identificador', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(reserva);

      await expect(reservaService.buscarReservaPorId(reserva.id)).resolves.toEqual(reserva);
      expect(repositoryMockado.buscarPorId).toHaveBeenCalledWith(reserva.id);
    });

    it('devolve null quando a reserva procurada não existe', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(null);

      await expect(reservaService.buscarReservaPorId(reserva.id)).resolves.toBeNull();
    });

    it('exclui a própria reserva', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(reserva);
      repositoryMockado.excluir.mockResolvedValue(true);

      await expect(reservaService.excluirReserva(reserva.id, dono)).resolves.toBe(true);
      expect(repositoryMockado.excluir).toHaveBeenCalledWith(reserva.id);
    });

    it('devolve false, sem excluir, quando a reserva não existe', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(null);

      await expect(reservaService.excluirReserva(reserva.id, dono)).resolves.toBe(false);
      expect(repositoryMockado.excluir).not.toHaveBeenCalled();
    });

    it('rejeita com 403 a exclusão da reserva de outro cliente', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(reserva);

      await expect(reservaService.excluirReserva(reserva.id, outroCliente)).rejects.toMatchObject({
        status: 403,
      });
      expect(repositoryMockado.excluir).not.toHaveBeenCalled();
    });

    it('permite que o administrador exclua a reserva de qualquer cliente', async () => {
      repositoryMockado.buscarPorId.mockResolvedValue(reserva);
      repositoryMockado.excluir.mockResolvedValue(true);

      await expect(reservaService.excluirReserva(reserva.id, administrador)).resolves.toBe(true);
    });
  });
});
