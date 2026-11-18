import type { ReactNode } from 'react';

interface EstadoVazioProps {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}

// Tela para lista vazia, nenhum resultado ou erro.
export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
