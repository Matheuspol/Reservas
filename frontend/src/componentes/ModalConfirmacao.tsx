import { useEffect, useRef } from 'react';
import { Botao } from './Botao';

interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Usa o <dialog> do HTML, que já cuida do foco, do fundo escuro e da tecla Esc.
export function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  carregando = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 shadow-2xl backdrop:bg-slate-900/50"
    >
      <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mt-1.5 text-sm text-slate-600">{descricao}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Botao variante="secundario" onClick={onCancelar} disabled={carregando}>
          Voltar
        </Botao>
        <Botao variante="perigo" onClick={onConfirmar} carregando={carregando}>
          Excluir
        </Botao>
      </div>
    </dialog>
  );
}
