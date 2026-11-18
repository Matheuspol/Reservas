const mensagemErro = {
  type: 'object',
  properties: { mensagem: { type: 'string', example: 'Dados inválidos' } },
};

const respostaErro = (descricao: string) => ({
  description: descricao,
  content: { 'application/json': { schema: mensagemErro } },
});

const exigeLogin = { security: [{ cookieSessao: [] }] };

const json = (schema: object) => ({ 'application/json': { schema } });

const lista = (schema: object) => ({ type: 'array', items: schema });

const corpo = (schema: object) => ({ required: true, content: json(schema) });

const parametroId = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Identificador do MongoDB (24 caracteres hexadecimais)',
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '66c47aa12ea87f8123456701' },
};

const dadosLogin = {
  type: 'object',
  required: ['email', 'senha'],
  properties: {
    email: { type: 'string', example: 'mariana@email.com' },
    senha: { type: 'string', example: 'senha123' },
  },
};

const dadosCadastro = {
  type: 'object',
  required: ['nome', 'email', 'senha'],
  properties: {
    nome: { type: 'string', example: 'Mariana Costa' },
    email: { type: 'string', example: 'mariana.costa@email.com' },
    senha: { type: 'string', example: 'senha123' },
  },
};

const dadosUsuario = {
  type: 'object',
  required: ['nome', 'email', 'senha', 'perfil', 'ativo'],
  properties: {
    nome: { type: 'string', example: 'Mariana Costa' },
    email: { type: 'string', example: 'mariana.costa@email.com' },
    senha: { type: 'string', example: 'senha123' },
    perfil: { type: 'string', enum: ['CLIENTE', 'ADMIN'], example: 'CLIENTE' },
    ativo: { type: 'boolean', example: true },
  },
};

const usuario = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '66c47aa12ea87f8123456701' },
    nome: dadosUsuario.properties.nome,
    email: dadosUsuario.properties.email,
    perfil: dadosUsuario.properties.perfil,
    ativo: dadosUsuario.properties.ativo,
  },
};

const sessaoUsuario = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '66c47aa12ea87f8123456701' },
    nome: { type: 'string', example: 'Mariana Costa' },
    email: { type: 'string', example: 'mariana.costa@email.com' },
    perfil: { type: 'string', enum: ['CLIENTE', 'ADMIN'], example: 'CLIENTE' },
  },
};

const dadosReserva = {
  type: 'object',
  required: ['espaco', 'data', 'horaInicio', 'horaFim', 'status'],
  properties: {
    espaco: { type: 'string', example: 'Quadra 1' },
    data: { type: 'string', description: 'Formato AAAA-MM-DD', example: '2026-12-10' },
    horaInicio: { type: 'string', description: 'Formato HH:MM', example: '18:00' },
    horaFim: {
      type: 'string',
      description: 'Formato HH:MM, posterior à hora de início',
      example: '19:00',
    },
    status: { type: 'string', enum: ['CONFIRMADA', 'CANCELADA'], example: 'CONFIRMADA' },
    usuarioId: {
      type: 'string',
      description:
        'Somente ao editar e só para administrador: id do usuário que passa a ser o ' +
        'responsável pela reserva.',
      example: '66c47aa12ea87f8123456701',
    },
  },
};

const reserva = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '66c47aa12ea87f8123456702' },
    responsavel: {
      type: 'string',
      description: 'Nome do dono da reserva (definido pelo servidor)',
      example: 'Mariana Costa',
    },
    ...dadosReserva.properties,
  },
};

export const documentacaoSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'API de Reservas de Espaços',
    version: '1.0.0',
    description:
      'Cadastro de usuários, login e reservas de espaços (quadras, salas). ' +
      'Um espaço não pode ter duas reservas confirmadas no mesmo horário. ' +
      'Cliente só altera ou exclui as próprias reservas; administrador altera todas.\n\n' +
      'A autenticação usa **cookie de sessão** (`sessao`, HttpOnly). Faça `POST /login` aqui mesmo ' +
      'no Swagger: o navegador guarda o cookie e passa a enviá-lo nas demais rotas. ' +
      'Usuários de exemplo (após `npm run seed`): `admin@reservas.com` / `admin123` e ' +
      '`mariana@email.com` / `senha123`.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      cookieSessao: { type: 'apiKey', in: 'cookie', name: 'sessao' },
    },
  },
  paths: {
    '/login': {
      post: {
        summary: 'Autentica um usuário ativo e abre a sessão (cookie)',
        description:
          'Em caso de sucesso, a resposta traz o cookie `sessao` (HttpOnly, SameSite=Lax).',
        requestBody: corpo(dadosLogin),
        responses: {
          '200': {
            description: 'Login realizado; cookie de sessão definido',
            content: json({
              type: 'object',
              properties: {
                mensagem: { type: 'string', example: 'Login realizado.' },
                usuario: sessaoUsuario,
              },
            }),
          },
          '400': respostaErro('Email ou senha não informados'),
          '401': respostaErro('Email ou senha inválidos'),
          '403': respostaErro('Origem não permitida'),
        },
      },
    },
    '/logout': {
      post: {
        summary: 'Encerra a sessão e remove o cookie',
        responses: { '204': { description: 'Sessão encerrada' } },
      },
    },
    '/sessao': {
      get: {
        summary: 'Retorna o usuário da sessão atual',
        security: [{ cookieSessao: [] }],
        responses: {
          '200': {
            description: 'Sessão válida',
            content: json({ type: 'object', properties: { usuario: sessaoUsuario } }),
          },
          '401': respostaErro('Sem sessão ou sessão expirada'),
        },
      },
    },
    '/cadastro': {
      post: {
        summary: 'Cadastro público: cria um usuário com perfil CLIENTE',
        description: 'O perfil e a situação são definidos pelo servidor (CLIENTE, ativo).',
        requestBody: corpo(dadosCadastro),
        responses: {
          '201': { description: 'Conta criada', content: json(usuario) },
          '400': respostaErro('Dados inválidos'),
          '409': respostaErro('Já existe um usuário com este email'),
        },
      },
    },
    '/usuarios': {
      post: {
        summary: 'Cadastra um usuário com qualquer perfil (somente administrador)',
        ...exigeLogin,
        requestBody: corpo(dadosUsuario),
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '403': respostaErro('Apenas administradores'),
          '201': { description: 'Usuário cadastrado', content: json(usuario) },
          '400': respostaErro('Dados inválidos'),
          '409': respostaErro('Já existe um usuário com este email'),
        },
      },
      get: {
        summary: 'Lista os usuários',
        ...exigeLogin,
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '403': respostaErro('Apenas administradores'),
          '200': { description: 'Lista de usuários', content: json(lista(usuario)) },
        },
      },
    },
    '/usuarios/{id}': {
      get: {
        summary: 'Consulta um usuário pelo identificador',
        ...exigeLogin,
        parameters: [parametroId],
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '403': respostaErro('Apenas administradores'),
          '200': { description: 'Usuário encontrado', content: json(usuario) },
          '400': respostaErro('Identificador inválido'),
          '404': respostaErro('Usuário não encontrado'),
        },
      },
      put: {
        summary: 'Atualiza um usuário',
        ...exigeLogin,
        parameters: [parametroId],
        requestBody: corpo(dadosUsuario),
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '403': respostaErro('Apenas administradores'),
          '200': { description: 'Usuário atualizado', content: json(usuario) },
          '400': respostaErro('Identificador ou dados inválidos'),
          '404': respostaErro('Usuário não encontrado'),
          '409': respostaErro('Já existe outro usuário com este email'),
        },
      },
      delete: {
        summary: 'Exclui um usuário',
        ...exigeLogin,
        parameters: [parametroId],
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '403': respostaErro('Apenas administradores'),
          '204': { description: 'Usuário excluído' },
          '400': respostaErro('Identificador inválido'),
          '404': respostaErro('Usuário não encontrado'),
        },
      },
    },
    '/reservas': {
      post: {
        summary: 'Cadastra uma reserva',
        ...exigeLogin,
        description:
          'A data não pode ser passada e o espaço não pode ter outra reserva confirmada ' +
          'que se sobreponha ao horário informado.',
        requestBody: corpo(dadosReserva),
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '201': { description: 'Reserva cadastrada', content: json(reserva) },
          '400': respostaErro('Dados inválidos ou data passada'),
          '409': respostaErro('Horário já reservado para este espaço'),
        },
      },
      get: {
        summary: 'Lista as reservas, ordenadas por data e horário',
        ...exigeLogin,
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '200': { description: 'Lista de reservas', content: json(lista(reserva)) },
        },
      },
    },
    '/reservas/{id}': {
      get: {
        summary: 'Consulta uma reserva pelo identificador',
        ...exigeLogin,
        parameters: [parametroId],
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '200': { description: 'Reserva encontrada', content: json(reserva) },
          '400': respostaErro('Identificador inválido'),
          '404': respostaErro('Reserva não encontrada'),
        },
      },
      put: {
        summary: 'Atualiza uma reserva (também usada para cancelar)',
        ...exigeLogin,
        parameters: [parametroId],
        requestBody: corpo(dadosReserva),
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '200': { description: 'Reserva atualizada', content: json(reserva) },
          '400': respostaErro('Identificador ou dados inválidos'),
          '403': respostaErro('A reserva é de outro usuário'),
          '404': respostaErro('Reserva não encontrada'),
          '409': respostaErro('Horário já reservado para este espaço'),
        },
      },
      delete: {
        summary: 'Exclui uma reserva',
        ...exigeLogin,
        parameters: [parametroId],
        responses: {
          '401': respostaErro('Sem sessão ou sessão expirada'),
          '204': { description: 'Reserva excluída' },
          '400': respostaErro('Identificador inválido'),
          '403': respostaErro('A reserva é de outro usuário'),
          '404': respostaErro('Reserva não encontrada'),
        },
      },
    },
  },
};
