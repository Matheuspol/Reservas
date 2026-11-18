import { useEffect, useState } from 'react';
import { Botao, BotaoLink } from '../componentes/Botao';
import { Campo, Selecao } from '../componentes/Campo';
import { Carregando } from '../componentes/Carregando';
import { EstadoVazio } from '../componentes/EstadoVazio';
import { ItemReserva } from '../componentes/ItemReserva';
import { ModalConfirmacao } from '../componentes/ModalConfirmacao';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { useNotificacoes } from '../contextos/NotificacoesContexto';
import { mensagemDoErro } from '../servicos/api';
import { atualizarReserva, excluirReserva, listarReservas } from '../servicos/reservasServico';
import type { Reserva, StatusReserva } from '../tipos';
import { hojeISO, tituloDoDia } from '../utilitarios/datas';
import {
  agruparPorData,
  contarIndicadores,
  filtrar,
  filtrosIniciais,
  type Filtros,
} from '../utilitarios/filtrosReservas';

function Indicador({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <p className="text-2xl font-bold text-slate-900">{valor}</p>
      <p className="text-xs text-slate-500 sm:text-sm">{rotulo}</p>
    </div>
  );
}

export function ListaReservas() {
  const { usuario } = useAutenticacao();
  const notificacoes = useNotificacoes();
  const hoje = hojeISO();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Reserva | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Busca as reservas ao abrir a tela (e de novo quando clicam em "Tentar novamente").
  useEffect(() => {
    listarReservas()
      .then(setReservas)
      .catch((e: unknown) => setErro(mensagemDoErro(e)))
      .finally(() => setCarregando(false));
  }, [tentativa]);

  function tentarNovamente() {
    setErro('');
    setCarregando(true);
    setTentativa((atual) => atual + 1);
  }

  const indicadores = contarIndicadores(reservas, hoje);
  const dias = agruparPorData(filtrar(reservas, filtros, hoje));

  // Cliente gerencia só as próprias reservas; administrador gerencia todas.
  function podeGerenciar(reserva: Reserva): boolean {
    return usuario?.perfil === 'ADMIN' || reserva.usuarioId === usuario?.id;
  }

  // Cancela a reserva (libera o horário) ou a reativa.
  async function alterarStatus(reserva: Reserva) {
    const { id, espaco, data, horaInicio, horaFim } = reserva;
    const novoStatus: StatusReserva = reserva.status === 'CANCELADA' ? 'CONFIRMADA' : 'CANCELADA';

    setAlterandoId(id);
    try {
      const dados = { espaco, data, horaInicio, horaFim, status: novoStatus };
      const atualizada = await atualizarReserva(id, dados);
      setReservas((atuais) => atuais.map((r) => (r.id === id ? atualizada : r)));
      notificacoes.sucesso(
        novoStatus === 'CANCELADA' ? 'Reserva cancelada.' : 'Reserva reativada.',
      );
    } catch (e) {
      notificacoes.erro(mensagemDoErro(e));
    } finally {
      setAlterandoId(null);
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;

    setExcluindo(true);
    try {
      await excluirReserva(paraExcluir.id);
      setReservas((atuais) => atuais.filter((r) => r.id !== paraExcluir.id));
      notificacoes.sucesso('Reserva excluída.');
      setParaExcluir(null);
    } catch (e) {
      notificacoes.erro(mensagemDoErro(e));
    } finally {
      setExcluindo(false);
    }
  }

  function renderizarLista() {
    if (carregando) return <Carregando />;

    if (erro) {
      return (
        <EstadoVazio
          titulo="Não foi possível carregar as reservas"
          descricao={erro}
          acao={<Botao onClick={tentarNovamente}>Tentar novamente</Botao>}
        />
      );
    }

    if (dias.length === 0) {
      return (
        <EstadoVazio
          titulo="Nenhuma reserva encontrada"
          descricao="Não há reservas para os filtros escolhidos. Que tal criar uma?"
        />
      );
    }

    return (
      <div className="space-y-6">
        {dias.map(([data, itens]) => (
          <section key={data}>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">{tituloDoDia(data, hoje)}</h2>
            <ul className="space-y-2">
              {itens.map((reserva) => (
                <ItemReserva
                  key={reserva.id}
                  reserva={reserva}
                  podeGerenciar={podeGerenciar(reserva)}
                  ocupada={alterandoId === reserva.id}
                  aoAlterarStatus={alterarStatus}
                  aoExcluir={setParaExcluir}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
        <BotaoLink to="/reservas/nova">Nova reserva</BotaoLink>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Indicador valor={indicadores.hoje} rotulo="Hoje" />
        <Indicador valor={indicadores.proximas} rotulo="Próximas" />
        <Indicador valor={indicadores.canceladas} rotulo="Canceladas" />
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Campo
          rotulo="Buscar"
          type="search"
          placeholder="Espaço ou responsável"
          value={filtros.busca}
          onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
        />
        <Selecao
          rotulo="Situação"
          value={filtros.status}
          onChange={(e) => setFiltros({ ...filtros, status: e.target.value as Filtros['status'] })}
        >
          <option value="TODAS">Todas</option>
          <option value="CONFIRMADA">Confirmadas</option>
          <option value="CANCELADA">Canceladas</option>
        </Selecao>
      </div>

      {renderizarLista()}

      <ModalConfirmacao
        aberto={paraExcluir !== null}
        titulo="Excluir reserva?"
        descricao={
          paraExcluir
            ? `A reserva de ${paraExcluir.espaco} (${paraExcluir.responsavel}) será removida de vez.`
            : ''
        }
        carregando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  );
}
