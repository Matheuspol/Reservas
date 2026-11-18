import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentacaoSwagger } from './configuracoes/swagger';
import { ErroDeNegocio } from './erros/erroDeNegocio';
import { rotas } from './routes/router';

const mensagensPorStatus = {
  400: 'Requisição inválida',
  413: 'Corpo da requisição excede o tamanho permitido',
  500: 'Erro interno do servidor',
} as const;

function obterStatusErro(erro: unknown): keyof typeof mensagensPorStatus {
  if (typeof erro !== 'object' || erro === null || !('status' in erro)) {
    return 500;
  }

  return erro.status === 400 || erro.status === 413 ? erro.status : 500;
}

const tratarErro: ErrorRequestHandler = (erro: unknown, _requisicao, resposta, proximo): void => {
  void proximo;

  if (erro instanceof ErroDeNegocio) {
    resposta.status(erro.status).json({ mensagem: erro.message });
    return;
  }

  const status = obterStatusErro(erro);

  console.error('Erro ao processar requisição', erro);
  resposta.status(status).json({ mensagem: mensagensPorStatus[status] });
};

function responderRotaNaoEncontrada(_requisicao: Request, resposta: Response): void {
  resposta.status(404).json({ mensagem: 'Rota não encontrada' });
}

export const app = express();

app.use(express.json());
app.use('/documentacao', swaggerUi.serve, swaggerUi.setup(documentacaoSwagger));
app.use(rotas);
app.use(responderRotaNaoEncontrada);
app.use(tratarErro);
