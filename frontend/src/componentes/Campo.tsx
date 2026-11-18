import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

const estiloControle =
  'block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-marca-600';

function classes(erro?: string): string {
  return `${estiloControle} ${erro ? 'ring-red-400' : 'ring-slate-300'}`;
}

interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  rotulo: string;
  erro?: string;
}

export function Campo({ rotulo, erro, ...resto }: CampoProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <input
        id={id}
        className={classes(erro)}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        {...resto}
      />
      {erro && (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

interface SelecaoProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  rotulo: string;
}

export function Selecao({ rotulo, children, ...resto }: SelecaoProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <select id={id} className={classes()} {...resto}>
        {children}
      </select>
    </div>
  );
}
