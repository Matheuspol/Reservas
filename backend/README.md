# API de Reservas de Espaços

Backend do [Sistema de Reservas](../README.md).

## O que a API faz

API REST para reservar espaços compartilhados (quadras, salas). Cada reserva tem espaço, responsável, data, horário de início e fim, e status (`CONFIRMADA` ou `CANCELADA`). Há também cadastro de usuários e login por cookie.

Regras:

- A data da reserva não pode ser passada e o horário de fim precisa ser depois do início.
- Um espaço não pode ter duas reservas confirmadas que se sobreponham no mesmo dia. Reservas canceladas liberam o horário.
- O email do usuário é único.
- O responsável e o dono da reserva são o usuário logado (definidos pelo servidor). Cliente só altera e exclui as próprias reservas; caso contrário, responde 403.
- O administrador altera todas e, ao editar, pode passar a reserva para outro usuário enviando `usuarioId`. Ao criar, e para cliente, esse campo é ignorado.

## Tecnologias

Node.js, Express 5, TypeScript, MongoDB com Mongoose (Docker, com volume), Swagger, Jest.

## Como executar

```bash
docker compose up -d      # MongoDB, com volume mongo-data
npm install
cp .env.example .env
npm run seed              # usuários e reservas de exemplo
npm run dev               # http://localhost:3000
```

Para parar o banco: `docker compose down` (os dados ficam no volume).

## Variáveis de ambiente

| Variável | Para que serve | Exemplo |
| --- | --- | --- |
| `MONGODB_URL` | Conexão com o MongoDB | `mongodb://localhost:27017/reservas` |
| `PORTA` | Porta da API | `3000` |
| `ORIGENS_PERMITIDAS` | Origens do frontend aceitas em POST, PUT e DELETE | `http://localhost:5173,http://localhost:3000` |

## Rotas

| Rota | Acesso |
| --- | --- |
| `POST /login`, `POST /logout` | Público |
| `POST /cadastro` | Público (cria um usuário CLIENTE) |
| `GET /sessao` | Exige login |
| `/reservas` (CRUD) | Exige login. PUT e DELETE só do dono ou de um ADMIN |
| `/usuarios` (CRUD) | Exige login e perfil ADMIN |

O login cria uma sessão no servidor e devolve o cookie `sessao` (HttpOnly, SameSite=Lax). A sessão fica na memória e expira após 30 minutos sem uso. Escritas vindas de uma origem fora de `ORIGENS_PERMITIDAS` recebem 403.

## Swagger

Documentação em **http://localhost:3000/documentacao**. Faça primeiro o `POST /login` por lá, para o navegador guardar o cookie.

| Perfil | Email | Senha |
| --- | --- | --- |
| Cliente | `mariana@email.com` | `senha123` |
| Administrador | `admin@reservas.com` | `admin123` |

## Testes

```bash
npm test                 # unitários, sem banco
npm run test:integracao  # API inteira contra um MongoDB descartável
npm run test:tudo        # os dois
```
