import type { StatusReserva } from '../tipos';

export function EmblemaStatus({ status }: { status: StatusReserva }) {
  const confirmada = status === 'CONFIRMADA';

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        confirmada ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {confirmada ? 'Confirmada' : 'Cancelada'}
    </span>
  );
}
