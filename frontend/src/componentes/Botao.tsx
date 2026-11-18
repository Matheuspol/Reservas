import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma';

const variantes: Record<Variante, string> = {
  primario: 'bg-marca-700 text-white hover:bg-marca-800',
  secundario: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  perigo: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};

function classesBotao(variante: Variante = 'primario', compacto = false): string {
  const tamanho = compacto ? 'px-3 py-1.5' : 'px-4 py-2.5';
  return `inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tamanho} ${variantes[variante]}`;
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  compacto?: boolean;
  carregando?: boolean;
}

export function Botao({
  variante,
  compacto,
  carregando = false,
  children,
  disabled,
  className = '',
  type = 'button',
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      className={`${classesBotao(variante, compacto)} ${className}`}
      {...resto}
    >
      {carregando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface BotaoLinkProps extends LinkProps {
  variante?: Variante;
  compacto?: boolean;
}

export function BotaoLink({ variante, compacto, className = '', ...resto }: BotaoLinkProps) {
  return <Link className={`${classesBotao(variante, compacto)} ${className}`} {...resto} />;
}
