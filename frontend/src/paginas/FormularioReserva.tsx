import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Alerta } from '../componentes/Alerta';
import { Botao, BotaoLink } from '../componentes/Botao';
import { Campo, Selecao } from '../componentes/Campo';
import { Carregando } from '../componentes/Carregando';
import { EstadoVazio } from '../componentes/EstadoVazio';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { useNotificacoes } from '../contextos/NotificacoesContexto';
import { mensagemDoErro } from '../servicos/api';
import { atualizarReserva, buscarReserva, criarReserva } from '../servicos/reservasServico';
import { listarUsuarios } from '../servicos/usuariosServico';
import type { DadosReserva, UsuarioSessao } from '../tipos';
import { hojeISO } from '../utilitarios/datas';
import { validarReserva, type Erros } from '../utilitarios/validacao';

// Serve para criar (/reservas/nova) e para editar (/reservas/:id/editar).
export function FormularioReserva() {
  const { id } = useParams();
  const editando = Boolean(id);
  const { usuario } = useAutenticacao();
  const notificacoes = useNotificacoes();
  const navegar = useNavigate();
  const hoje = hojeISO();
  // Ao editar, o administrador pode mudar quem é o responsável pela reserva.
  const escolheResponsavel = editando && usuario?.perfil === 'ADMIN';

  const [dados, setDados] = useState<DadosReserva>({
    espaco: '',
    data: hoje,
    horaInicio: '',
    horaFim: '',
    status: 'CONFIRMADA',
  });
  const [usuarios, setUsuarios] = useState<UsuarioSessao[]>([]);
  const [responsavelId, setResponsavelId] = useState('');
  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState('');
  const [erros, setErros] = useState<Erros<DadosReserva>>({});
  const [erroServidor, setErroServidor] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!escolheResponsavel) return;

    listarUsuarios()
      .then(setUsuarios)
      .catch((e: unknown) => setErroServidor(mensagemDoErro(e)));
  }, [escolheResponsavel]);

  // Ao editar, carrega a reserva para preencher o formulário.
  useEffect(() => {
    if (!id) return;

    buscarReserva(id)
      .then((reserva) => {
        const { espaco, data, horaInicio, horaFim, status } = reserva;
        const podeEditar = usuario?.perfil === 'ADMIN' || reserva.usuarioId === usuario?.id;

        if (podeEditar) {
          setDados({ espaco, data, horaInicio, horaFim, status });
          setResponsavelId(reserva.usuarioId ?? '');
        } else {
          setErroCarga('Você só pode editar as suas próprias reservas.');
        }
      })
      .catch((e: unknown) => setErroCarga(mensagemDoErro(e)))
      .finally(() => setCarregando(false));
  }, [id, usuario]);

  function alterar<K extends keyof DadosReserva>(campo: K, valor: DadosReserva[K]) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroServidor('');

    // A data não pode ser passada só ao criar (o backend segue a mesma regra).
    const errosEncontrados = validarReserva(dados, hoje, !editando);
    setErros(errosEncontrados);
    if (Object.keys(errosEncontrados).length > 0) return;

    setSalvando(true);
    try {
      if (id) {
        const corpo = escolheResponsavel ? { ...dados, usuarioId: responsavelId } : dados;
        await atualizarReserva(id, corpo);
        notificacoes.sucesso('Reserva atualizada.');
      } else {
        await criarReserva(dados);
        notificacoes.sucesso('Reserva criada.');
      }
      navegar('/');
    } catch (e) {
      // Erros que só a API conhece, como horário ocupado (409), aparecem aqui.
      setErroServidor(mensagemDoErro(e));
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando mensagem="Carregando reserva…" />;

  if (erroCarga) {
    return (
      <EstadoVazio
        titulo="Não foi possível abrir a reserva"
        descricao={erroCarga}
        acao={<BotaoLink to="/">Voltar às reservas</BotaoLink>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Voltar às reservas
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {editando ? 'Editar reserva' : 'Nova reserva'}
        </h1>

        <form onSubmit={aoEnviar} noValidate className="mt-6 space-y-4">
          {erroServidor && <Alerta>{erroServidor}</Alerta>}

          <Campo
            rotulo="Espaço"
            placeholder="Ex.: Quadra 1"
            value={dados.espaco}
            onChange={(e) => alterar('espaco', e.target.value)}
            erro={erros.espaco}
          />
          {escolheResponsavel && (
            <Selecao
              rotulo="Responsável"
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.email})
                </option>
              ))}
            </Selecao>
          )}
          <Campo
            rotulo="Data"
            type="date"
            value={dados.data}
            onChange={(e) => alterar('data', e.target.value)}
            erro={erros.data}
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              rotulo="Início"
              type="time"
              value={dados.horaInicio}
              onChange={(e) => alterar('horaInicio', e.target.value)}
              erro={erros.horaInicio}
            />
            <Campo
              rotulo="Término"
              type="time"
              value={dados.horaFim}
              onChange={(e) => alterar('horaFim', e.target.value)}
              erro={erros.horaFim}
            />
          </div>

          {editando && (
            <Selecao
              rotulo="Situação"
              value={dados.status}
              onChange={(e) => alterar('status', e.target.value as DadosReserva['status'])}
            >
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
            </Selecao>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <BotaoLink to="/" variante="secundario">
              Cancelar
            </BotaoLink>
            <Botao type="submit" carregando={salvando}>
              {editando ? 'Salvar alterações' : 'Criar reserva'}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  );
}
