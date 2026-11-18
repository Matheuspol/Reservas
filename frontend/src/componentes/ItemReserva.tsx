import type { Reserva } from '../tipos';
import { Botao, BotaoLink } from './Botao';
import { EmblemaStatus } from './EmblemaStatus';

interface ItemReservaProps {
  reserva: Reserva;
  podeGerenciar: boolean;
  ocupada: boolean;
  aoAlterarStatus: (reserva: Reserva) => void;
  aoExcluir: (reserva: Reserva) => void;
}

// Uma linha da lista: horário, espaço, responsável, situação e as ações.
// As ações só aparecem para o dono da reserva e para o administrador.
export function ItemReserva({
  reserva,
  podeGerenciar,
  ocupada,
  aoAlterarStatus,
  aoExcluir,
}: ItemReservaProps) {
  const cancelada = reserva.status === 'CANCELADA';
  const acaoStatus = cancelada ? 'Reativar' : 'Cancelar';

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center ${
        cancelada ? 'bg-slate-50' : 'bg-white'
      }`}
    >
      <p className="font-semibold tabular-nums text-slate-900 sm:w-36">
        {reserva.horaInicio} – {reserva.horaFim}
      </p>

      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold ${cancelada ? 'text-slate-500 line-through' : 'text-slate-900'}`}
        >
          {reserva.espaco}
        </p>
        <p className="text-sm text-slate-500">{reserva.responsavel}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <EmblemaStatus status={reserva.status} />
        {podeGerenciar && (
          <>
            <BotaoLink
              to={`/reservas/${reserva.id}/editar`}
              variante="fantasma"
              compacto
              aria-label={`Editar reserva de ${reserva.espaco}`}
            >
              Editar
            </BotaoLink>
            <Botao
              variante="fantasma"
              compacto
              carregando={ocupada}
              onClick={() => aoAlterarStatus(reserva)}
              aria-label={`${acaoStatus} reserva de ${reserva.espaco}`}
            >
              {acaoStatus}
            </Botao>
            <Botao
              variante="fantasma"
              compacto
              className="text-red-600 hover:bg-red-50"
              onClick={() => aoExcluir(reserva)}
              aria-label={`Excluir reserva de ${reserva.espaco}`}
            >
              Excluir
            </Botao>
          </>
        )}
      </div>
    </li>
  );
}
