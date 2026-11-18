import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { Campo } from '../componentes/Campo';
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { useNotificacoes } from '../contextos/NotificacoesContexto';
import { mensagemDoErro } from '../servicos/api';
import { validarLogin } from '../utilitarios/validacao';

export function Login() {
  const { entrar, sessaoExpirada } = useAutenticacao();
  const notificacoes = useNotificacoes();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ReturnType<typeof validarLogin>>({});
  const [erroServidor, setErroServidor] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroServidor('');

    const errosEncontrados = validarLogin(email, senha);
    setErros(errosEncontrados);
    if (Object.keys(errosEncontrados).length > 0) return;

    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
      // Quem leva para a página certa depois do login é a RotaPublica.
      notificacoes.sucesso('Login realizado com sucesso.');
    } catch (erro) {
      setErroServidor(mensagemDoErro(erro));
      setCarregando(false);
    }
  }

  return (
    <LayoutAutenticacao
      titulo="Entrar"
      subtitulo="Use sua conta para ver e gerenciar as reservas."
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-marca-700 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate className="space-y-4">
        {sessaoExpirada && !erroServidor && (
          <Alerta tipo="aviso">Sua sessão expirou. Entre novamente para continuar.</Alerta>
        )}
        {erroServidor && <Alerta>{erroServidor}</Alerta>}

        <Campo
          rotulo="Email"
          type="email"
          autoComplete="username"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
          autoFocus
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />

        <Botao type="submit" carregando={carregando} className="w-full">
          Entrar
        </Botao>
      </form>
    </LayoutAutenticacao>
  );
}
