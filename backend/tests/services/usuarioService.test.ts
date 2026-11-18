import * as usuarioRepository from '../../src/repositories/usuarioRepository';
import * as usuarioService from '../../src/services/usuarioService';
import type { DadosUsuario, Usuario } from '../../src/types/usuario';

jest.mock('../../src/repositories/usuarioRepository');

const repositoryMockado = jest.mocked(usuarioRepository);

const dadosUsuario: DadosUsuario = {
  nome: 'Mariana Costa',
  email: 'mariana.costa@email.com',
  senha: 'senhaInicial123',
  perfil: 'ADMIN',
  ativo: true,
};

const usuario: Usuario = {
  id: '66c47aa12ea87f8123456701',
  ...dadosUsuario,
};

describe('usuarioService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('cria um usuário encaminhando os dados ao repository', async () => {
    repositoryMockado.criar.mockResolvedValue(usuario);

    const resultado = await usuarioService.criarUsuario(dadosUsuario);

    expect(repositoryMockado.criar).toHaveBeenCalledWith(dadosUsuario);
    expect(resultado).toEqual(usuario);
  });

  it('normaliza o email (minúsculas e sem espaços) antes de salvar', async () => {
    repositoryMockado.criar.mockResolvedValue(usuario);

    await usuarioService.criarUsuario({ ...dadosUsuario, email: '  Mariana.Costa@Email.com ' });

    expect(repositoryMockado.emailEmUso).toHaveBeenCalledWith(dadosUsuario.email, undefined);
    expect(repositoryMockado.criar).toHaveBeenCalledWith(dadosUsuario);
  });

  it('rejeita com 409 o cadastro de um email já utilizado', async () => {
    repositoryMockado.emailEmUso.mockResolvedValue(true);

    await expect(usuarioService.criarUsuario(dadosUsuario)).rejects.toMatchObject({ status: 409 });
    expect(repositoryMockado.criar).not.toHaveBeenCalled();
  });

  it('rejeita com 409 a troca para o email de outro usuário', async () => {
    repositoryMockado.emailEmUso.mockResolvedValue(true);

    await expect(usuarioService.atualizarUsuario(usuario.id, dadosUsuario)).rejects.toMatchObject({
      status: 409,
    });
    expect(repositoryMockado.emailEmUso).toHaveBeenCalledWith(dadosUsuario.email, usuario.id);
    expect(repositoryMockado.atualizar).not.toHaveBeenCalled();
  });

  it('lista os usuários, inclusive quando não há cadastros', async () => {
    repositoryMockado.listar.mockResolvedValue([]);

    const resultado = await usuarioService.listarUsuarios();

    expect(repositoryMockado.listar).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual([]);
  });

  it('devolve o usuário localizado pelo identificador', async () => {
    repositoryMockado.buscarPorId.mockResolvedValue(usuario);

    const resultado = await usuarioService.buscarUsuarioPorId(usuario.id);

    expect(repositoryMockado.buscarPorId).toHaveBeenCalledWith(usuario.id);
    expect(resultado).toEqual(usuario);
  });

  it('devolve null quando o usuário procurado não existe', async () => {
    repositoryMockado.buscarPorId.mockResolvedValue(null);

    const resultado = await usuarioService.buscarUsuarioPorId(usuario.id);

    expect(repositoryMockado.buscarPorId).toHaveBeenCalledWith(usuario.id);
    expect(resultado).toBeNull();
  });

  it('atualiza o usuário com o id e os novos dados recebidos', async () => {
    const dadosAtualizados = { ...dadosUsuario, ativo: false };
    repositoryMockado.atualizar.mockResolvedValue({ ...usuario, ...dadosAtualizados });

    const resultado = await usuarioService.atualizarUsuario(usuario.id, dadosAtualizados);

    expect(repositoryMockado.atualizar).toHaveBeenCalledWith(usuario.id, dadosAtualizados);
    expect(resultado).toMatchObject({ id: usuario.id, ativo: false });
  });

  it('indica que a atualização não encontrou usuário', async () => {
    repositoryMockado.atualizar.mockResolvedValue(null);

    const resultado = await usuarioService.atualizarUsuario(usuario.id, dadosUsuario);

    expect(repositoryMockado.atualizar).toHaveBeenCalledWith(usuario.id, dadosUsuario);
    expect(resultado).toBeNull();
  });

  it('confirma a exclusão realizada pelo repository', async () => {
    repositoryMockado.excluir.mockResolvedValue(true);

    await expect(usuarioService.excluirUsuario(usuario.id)).resolves.toBe(true);
    expect(repositoryMockado.excluir).toHaveBeenCalledWith(usuario.id);
  });

  it('informa false quando não há usuário para excluir', async () => {
    repositoryMockado.excluir.mockResolvedValue(false);

    const resultado = await usuarioService.excluirUsuario(usuario.id);

    expect(repositoryMockado.excluir).toHaveBeenCalledWith(usuario.id);
    expect(resultado).toBe(false);
  });
});
