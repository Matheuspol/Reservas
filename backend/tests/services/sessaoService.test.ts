import * as sessaoService from '../../src/services/sessaoService';
import type { UsuarioSessao } from '../../src/types/sessao';

const usuario: UsuarioSessao = {
  id: '66c47aa12ea87f8123456701',
  nome: 'Mariana Costa',
  email: 'mariana@email.com',
  perfil: 'CLIENTE',
};

describe('sessaoService', () => {
  beforeEach(() => {
    sessaoService.limparSessoes();
    jest.useRealTimers();
  });

  it('cria um token aleatório e permite consultar o usuário com ele', () => {
    const token = sessaoService.criarSessao(usuario);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(sessaoService.consultarSessao(token)).toEqual(usuario);
  });

  it('gera tokens diferentes a cada login', () => {
    expect(sessaoService.criarSessao(usuario)).not.toBe(sessaoService.criarSessao(usuario));
  });

  it('não reconhece token inexistente ou ausente', () => {
    expect(sessaoService.consultarSessao('token-inventado')).toBeNull();
    expect(sessaoService.consultarSessao(undefined)).toBeNull();
  });

  it('invalida o token ao encerrar a sessão', () => {
    const token = sessaoService.criarSessao(usuario);

    sessaoService.encerrarSessao(token);

    expect(sessaoService.consultarSessao(token)).toBeNull();
  });

  it('expira após 30 minutos sem uso', () => {
    jest.useFakeTimers();
    const token = sessaoService.criarSessao(usuario);

    jest.advanceTimersByTime(sessaoService.duracaoSessaoMs + 1);

    expect(sessaoService.consultarSessao(token)).toBeNull();
  });

  it('renova o prazo a cada uso', () => {
    jest.useFakeTimers();
    const token = sessaoService.criarSessao(usuario);

    jest.advanceTimersByTime(sessaoService.duracaoSessaoMs - 1000);
    expect(sessaoService.consultarSessao(token)).toEqual(usuario);

    jest.advanceTimersByTime(sessaoService.duracaoSessaoMs - 1000);
    expect(sessaoService.consultarSessao(token)).toEqual(usuario);
  });
});
