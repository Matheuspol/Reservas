import { BotaoLink } from '../componentes/Botao';
import { EstadoVazio } from '../componentes/EstadoVazio';

export function NaoEncontrada() {
  return (
    <EstadoVazio
      titulo="Página não encontrada"
      descricao="O endereço que você tentou abrir não existe."
      acao={<BotaoLink to="/">Ir para as reservas</BotaoLink>}
    />
  );
}
