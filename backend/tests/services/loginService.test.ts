import * as loginRepository from '../../src/repositories/loginRepository';
import * as loginService from '../../src/services/loginService';

jest.mock('../../src/repositories/loginRepository');

const repositoryMockado = jest.mocked(loginRepository);

type UsuarioEncontrado = Awaited<ReturnType<typeof loginRepository.buscarUsuarioAtivoPorEmail>>;

const usuarioDoBanco = {
  _id: '66c47aa12ea87f8123456701',
  nome: 'Mariana Costa',
  email: 'mariana@email.com',
  senha: '123456',
  perfil: 'CLIENTE',
} as unknown as UsuarioEncontrado;

describe('loginService.autenticar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('devolve os dados da sessão, sem a senha, quando email e senha conferem', async () => {
    repositoryMockado.buscarUsuarioAtivoPorEmail.mockResolvedValue(usuarioDoBanco);

    const resultado = await loginService.autenticar('mariana@email.com', '123456');

    expect(repositoryMockado.buscarUsuarioAtivoPorEmail).toHaveBeenCalledWith('mariana@email.com');
    expect(resultado).toEqual({
      id: '66c47aa12ea87f8123456701',
      nome: 'Mariana Costa',
      email: 'mariana@email.com',
      perfil: 'CLIENTE',
    });
  });

  it('ignora maiúsculas e espaços extras no email informado', async () => {
    repositoryMockado.buscarUsuarioAtivoPorEmail.mockResolvedValue(usuarioDoBanco);

    const resultado = await loginService.autenticar(' Mariana@Email.com ', '123456');

    expect(repositoryMockado.buscarUsuarioAtivoPorEmail).toHaveBeenCalledWith('mariana@email.com');
    expect(resultado).not.toBeNull();
  });

  it('devolve null quando não existe usuário ativo com o email informado', async () => {
    repositoryMockado.buscarUsuarioAtivoPorEmail.mockResolvedValue(null);

    const resultado = await loginService.autenticar('inexistente@email.com', '123456');

    expect(resultado).toBeNull();
  });

  it('devolve null quando a senha não confere', async () => {
    repositoryMockado.buscarUsuarioAtivoPorEmail.mockResolvedValue(usuarioDoBanco);

    const resultado = await loginService.autenticar('mariana@email.com', 'outraSenha');

    expect(resultado).toBeNull();
  });
});
