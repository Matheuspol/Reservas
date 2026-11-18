import 'dotenv/config';
import { conectarBanco } from './configuracoes/banco';
import { app } from './app';

const porta = Number(process.env.PORTA ?? 3000);

conectarBanco()
  .then(() => {
    app.listen(porta, (erro?: Error) => {
      if (erro) {
        console.error(
          `Não foi possível iniciar na porta ${porta}. Ela já está em uso?`,
          erro.message,
        );
        process.exit(1);
      }

      console.info(`servidor rodando em http://localhost:${porta}`);
      console.info(`documentação em http://localhost:${porta}/documentacao`);
    });
  })
  .catch((erro: unknown) => {
    console.error('Não foi possível conectar ao MongoDB', erro);
    process.exit(1);
  });
