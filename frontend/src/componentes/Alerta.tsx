import type { ReactNode } from 'react';

const cores = {
  erro: 'border-red-200 bg-red-50 text-red-800',
  aviso: 'border-amber-200 bg-amber-50 text-amber-900',
};

export function Alerta({
  tipo = 'erro',
  children,
}: {
  tipo?: 'erro' | 'aviso';
  children: ReactNode;
}) {
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`rounded-lg border p-3.5 text-sm ${cores[tipo]}`}
    >
      {children}
    </div>
  );
}
