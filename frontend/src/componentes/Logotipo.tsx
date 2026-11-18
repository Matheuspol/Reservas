import { CalendarCheck } from 'lucide-react';

export function Logotipo() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
      <CalendarCheck className="size-6 text-marca-700" aria-hidden />
      Reservas
    </span>
  );
}
