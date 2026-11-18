import { LoaderCircle } from 'lucide-react';

export function Carregando({ mensagem = 'Carregando…' }: { mensagem?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-slate-500">
      <LoaderCircle className="size-7 animate-spin text-marca-700" aria-hidden />
      <p className="text-sm">{mensagem}</p>
    </div>
  );
}
