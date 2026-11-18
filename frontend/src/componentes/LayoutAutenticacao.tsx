import type { ReactNode } from 'react';
import { Logotipo } from './Logotipo';

interface LayoutAutenticacaoProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape: ReactNode;
}

// Cartão centralizado usado pelas telas de login e cadastro.
export function LayoutAutenticacao({
  titulo,
  subtitulo,
  children,
  rodape,
}: LayoutAutenticacaoProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logotipo />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">{rodape}</p>
      </div>
    </main>
  );
}
