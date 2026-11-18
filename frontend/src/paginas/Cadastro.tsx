import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { Campo } from '../componentes/Campo';
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao';
import { useNotificacoes } from '../contextos/NotificacoesContexto';
import { mensagemDoErro } from '../servicos/api';
import { cadastrar } from '../servicos/autenticacaoServico';
import { validarCadastro } from '../utilitarios/validacao';

export function Cadastro() {
  const notificacoes = useNotificacoes();
  const navegar = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<ReturnType<typeof validarCadastro>>({});
  const [erroServidor, setErroServidor] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroServidor('');

    const errosEncontrados = validarCadastro(nome, email, senha, confirmacao);
    setErros(errosEncontrados);
    if (Object.keys(errosEncontrados).length > 0) return;

    setCarregando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), senha });
      notificacoes.sucesso('Conta criada! Agora é só entrar.');
      navegar('/login', { replace: true });
    } catch (erro) {
      setErroServidor(mensagemDoErro(erro));
      setCarregando(false);
    }
  }

  return (
    <LayoutAutenticacao
      titulo="Criar conta"
      subtitulo="Cadastre-se para começar a reservar."
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-marca-700 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate className="space-y-4">
        {erroServidor && <Alerta>{erroServidor}</Alerta>}

        <Campo
          rotulo="Nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros.nome}
          autoFocus
        />
        <Campo
          rotulo="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <Campo
          rotulo="Confirme a senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          erro={erros.confirmacao}
        />

        <Botao type="submit" carregando={carregando} className="w-full">
          Criar conta
        </Botao>
      </form>
    </LayoutAutenticacao>
  );
}
