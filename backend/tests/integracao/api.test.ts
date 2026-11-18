import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../../src/app';
import { ReservaModelo } from '../../src/models/reservaModel';
import { UsuarioModelo } from '../../src/models/usuarioModel';
import { limparSessoes } from '../../src/services/sessaoService';

jest.setTimeout(120_000);

let mongo: MongoMemoryServer;

const cliente = {
  nome: 'Mariana Costa',
  email: 'mariana.costa@email.com',
  senha: 'senha123',
  perfil: 'CLIENTE',
  ativo: true,
};

const outroCliente = {
  nome: 'Carlos Souza',
  email: 'carlos.souza@email.com',
  senha: 'senha456',
  perfil: 'CLIENTE',
  ativo: true,
};

const administrador = {
  nome: 'Administrador',
  email: 'admin@email.com',
  senha: 'admin123',
  perfil: 'ADMIN',
  ativo: true,
};

const reserva = {
  espaco: 'Quadra 1',
  data: '2999-12-10',
  horaInicio: '18:00',
  horaFim: '19:00',
  status: 'CONFIRMADA',
};

async function entrarComo(usuario: { email: string; senha: string }) {
  const agente = request.agent(app);
  await agente.post('/login').send({ email: usuario.email, senha: usuario.senha }).expect(200);
  return agente;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('reservas_teste'));
  await UsuarioModelo.init();
  await ReservaModelo.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await UsuarioModelo.create([cliente, outroCliente, administrador]);
});

afterEach(async () => {
  await UsuarioModelo.deleteMany({});
  await ReservaModelo.deleteMany({});
  limparSessoes();
});

describe('login, sessão e logout (cookie)', () => {
  it('faz login, grava o cookie HttpOnly e devolve o usuário sem a senha', async () => {
    const resposta = await request(app)
      .post('/login')
      .send({ email: cliente.email, senha: cliente.senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      mensagem: 'Login realizado.',
      usuario: { nome: cliente.nome, email: cliente.email, perfil: 'CLIENTE' },
    });
    expect(resposta.body).not.toHaveProperty('usuario.senha');

    const cookies = resposta.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toMatch(/^sessao=[a-f0-9]{64}/);
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).toContain('Path=/');
  });

  it('recusa login com senha errada, email desconhecido e usuário inativo', async () => {
    await UsuarioModelo.create({ ...cliente, email: 'inativo@email.com', ativo: false });

    await request(app).post('/login').send({ email: cliente.email, senha: 'errada' }).expect(401);
    await request(app).post('/login').send({ email: 'x@email.com', senha: 'senha123' }).expect(401);
    await request(app)
      .post('/login')
      .send({ email: 'inativo@email.com', senha: cliente.senha })
      .expect(401);
  });

  it('recusa login sem email ou senha com 400', async () => {
    await request(app).post('/login').send({ email: cliente.email }).expect(400);
  });

  it('consulta a sessão pelo cookie e responde 401 sem ele', async () => {
    await request(app).get('/sessao').expect(401);

    const agente = await entrarComo(cliente);
    const resposta = await agente.get('/sessao');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ usuario: { email: cliente.email } });
  });

  it('encerra a sessão no logout: o mesmo cookie deixa de funcionar', async () => {
    const login = await request(app)
      .post('/login')
      .send({ email: cliente.email, senha: cliente.senha });
    const cookie = (login.headers['set-cookie'] as unknown as string[])[0];

    await request(app).get('/sessao').set('Cookie', cookie).expect(200);
    await request(app).post('/logout').set('Cookie', cookie).expect(204);
    await request(app).get('/sessao').set('Cookie', cookie).expect(401);
  });

  it('recusa escrita vinda de uma origem que não é a do frontend', async () => {
    const resposta = await request(app)
      .post('/login')
      .set('Origin', 'http://site-malicioso.com')
      .send({ email: cliente.email, senha: cliente.senha });

    expect(resposta.status).toBe(403);
    expect(resposta.headers['set-cookie']).toBeUndefined();
  });

  it('aceita escrita vinda da origem do frontend', async () => {
    await request(app)
      .post('/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email: cliente.email, senha: cliente.senha })
      .expect(200);
  });
});

describe('cadastro público', () => {
  const novo = { nome: 'Carlos Souza', email: 'Carlos@Email.com', senha: 'segredo1' };

  it('cria sempre um CLIENTE ativo, mesmo que o corpo peça ADMIN', async () => {
    const resposta = await request(app)
      .post('/cadastro')
      .send({ ...novo, perfil: 'ADMIN', ativo: false });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Carlos Souza',
      email: 'carlos@email.com',
      perfil: 'CLIENTE',
      ativo: true,
    });
    expect(resposta.body).not.toHaveProperty('senha');

    await request(app)
      .post('/login')
      .send({ email: 'carlos@email.com', senha: 'segredo1' })
      .expect(200);
  });

  it('rejeita email repetido com 409 e dados incompletos com 400', async () => {
    await request(app)
      .post('/cadastro')
      .send({ ...novo, email: cliente.email })
      .expect(409);
    await request(app).post('/cadastro').send({ nome: 'Sem senha', email: 'a@b.com' }).expect(400);
  });
});

describe('proteção das rotas', () => {
  it('responde 401 em reservas e usuários sem login', async () => {
    await request(app).get('/reservas').expect(401);
    await request(app).post('/reservas').send(reserva).expect(401);
    await request(app).delete('/reservas/66c47aa12ea87f8123456799').expect(401);
    await request(app).get('/usuarios').expect(401);
  });

  it('bloqueia clientes (403) na gestão de usuários', async () => {
    const agente = await entrarComo(cliente);

    await agente.get('/usuarios').expect(403);
    await agente.post('/usuarios').send(cliente).expect(403);
  });

  it('permite que o administrador gerencie usuários, sem expor a senha', async () => {
    const agente = await entrarComo(administrador);

    const lista = await agente.get('/usuarios');
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(3);
    expect(JSON.stringify(lista.body)).not.toContain('senha');

    const criado = await agente
      .post('/usuarios')
      .send({ ...cliente, nome: 'Outro Admin', email: 'outro@email.com', perfil: 'ADMIN' });
    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({ perfil: 'ADMIN' });

    const { id } = criado.body as { id: string };
    await agente
      .put(`/usuarios/${id}`)
      .send({ ...cliente, email: 'outro@email.com', ativo: false })
      .expect(200);
    await agente.delete(`/usuarios/${id}`).expect(204);
  });

  it('rejeita email repetido com 409, mesmo em maiúsculas', async () => {
    const agente = await entrarComo(administrador);

    const resposta = await agente
      .post('/usuarios')
      .send({ ...cliente, email: 'MARIANA.COSTA@email.com' });

    expect(resposta.status).toBe(409);
    expect(await UsuarioModelo.countDocuments()).toBe(3);
  });
});

describe('permissões nas reservas', () => {
  it('grava o usuário logado como dono, ignorando o dono enviado no corpo', async () => {
    const agente = await entrarComo(cliente);
    const dono = await agente.get('/sessao');
    const idDoCliente = (dono.body as { usuario: { id: string } }).usuario.id;

    const criada = await agente
      .post('/reservas')
      .send({ ...reserva, usuarioId: 'id-de-outra-pessoa' });

    expect(criada.status).toBe(201);
    expect((criada.body as { usuarioId: string }).usuarioId).toBe(idDoCliente);
  });

  it('impede que um cliente edite ou exclua a reserva de outro (403)', async () => {
    const donoDaReserva = await entrarComo(cliente);
    const { id } = (await donoDaReserva.post('/reservas').send(reserva).expect(201)).body as {
      id: string;
    };
    const intruso = await entrarComo(outroCliente);

    const edicao = await intruso.put(`/reservas/${id}`).send({ ...reserva, horaFim: '20:00' });
    expect(edicao.status).toBe(403);
    await intruso.delete(`/reservas/${id}`).expect(403);

    const intacta = await donoDaReserva.get(`/reservas/${id}`);
    expect(intacta.body).toMatchObject({ horaFim: reserva.horaFim, responsavel: cliente.nome });
  });

  it('todos continuam vendo as reservas dos outros', async () => {
    const donoDaReserva = await entrarComo(cliente);
    await donoDaReserva.post('/reservas').send(reserva).expect(201);
    const outro = await entrarComo(outroCliente);

    const lista = await outro.get('/reservas');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
  });

  it('permite que o administrador edite e exclua a reserva de qualquer cliente', async () => {
    const donoDaReserva = await entrarComo(cliente);
    const { id, usuarioId } = (await donoDaReserva.post('/reservas').send(reserva).expect(201))
      .body as { id: string; usuarioId: string };
    const admin = await entrarComo(administrador);

    const edicao = await admin.put(`/reservas/${id}`).send({ ...reserva, horaFim: '20:00' });
    expect(edicao.status).toBe(200);
    expect(edicao.body).toMatchObject({ horaFim: '20:00', usuarioId });

    await admin.delete(`/reservas/${id}`).expect(204);
  });

  it('não deixa trocar o dono ao editar', async () => {
    const agente = await entrarComo(cliente);
    const { id, usuarioId } = (await agente.post('/reservas').send(reserva).expect(201)).body as {
      id: string;
      usuarioId: string;
    };

    const edicao = await agente
      .put(`/reservas/${id}`)
      .send({ ...reserva, usuarioId: 'id-de-outra-pessoa' });

    expect(edicao.status).toBe(200);
    expect((edicao.body as { usuarioId: string }).usuarioId).toBe(usuarioId);
  });

  it('define o responsável pelo nome do usuário logado, ignorando o enviado', async () => {
    const agente = await entrarComo(cliente);

    const criada = await agente.post('/reservas').send({ ...reserva, responsavel: 'Outra Pessoa' });

    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ responsavel: cliente.nome });
  });

  it('ignora o usuarioId enviado por um cliente (só o administrador escolhe o dono)', async () => {
    const agenteDoOutro = await entrarComo(outroCliente);
    const idDoOutro = ((await agenteDoOutro.get('/sessao')).body as { usuario: { id: string } })
      .usuario.id;
    const agente = await entrarComo(cliente);

    const criada = await agente.post('/reservas').send({ ...reserva, usuarioId: idDoOutro });

    expect(criada.body).toMatchObject({ responsavel: cliente.nome });
    expect((criada.body as { usuarioId: string }).usuarioId).not.toBe(idDoOutro);
  });

  it('mesmo para o administrador, quem cria é o dono (o usuarioId enviado é ignorado)', async () => {
    const agenteDoCliente = await entrarComo(cliente);
    const idDoCliente = ((await agenteDoCliente.get('/sessao')).body as { usuario: { id: string } })
      .usuario.id;
    const admin = await entrarComo(administrador);

    const criada = await admin.post('/reservas').send({ ...reserva, usuarioId: idDoCliente });

    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ responsavel: administrador.nome });
    expect((criada.body as { usuarioId: string }).usuarioId).not.toBe(idDoCliente);
  });

  it('permite que o administrador passe uma reserva para outra pessoa ao editar', async () => {
    const agenteDoCliente = await entrarComo(cliente);
    const { id } = (await agenteDoCliente.post('/reservas').send(reserva).expect(201)).body as {
      id: string;
    };
    const agenteDoOutro = await entrarComo(outroCliente);
    const idDoOutro = ((await agenteDoOutro.get('/sessao')).body as { usuario: { id: string } })
      .usuario.id;
    const admin = await entrarComo(administrador);

    const editada = await admin.put(`/reservas/${id}`).send({ ...reserva, usuarioId: idDoOutro });

    expect(editada.status).toBe(200);
    expect(editada.body).toMatchObject({ usuarioId: idDoOutro, responsavel: outroCliente.nome });
    await agenteDoCliente.delete(`/reservas/${id}`).expect(403);
    await agenteDoOutro.delete(`/reservas/${id}`).expect(204);
  });

  it('rejeita com 400 quando o administrador escolhe um usuário inexistente ou id inválido', async () => {
    const agenteDoCliente = await entrarComo(cliente);
    const { id } = (await agenteDoCliente.post('/reservas').send(reserva).expect(201)).body as {
      id: string;
    };
    const admin = await entrarComo(administrador);

    await admin
      .put(`/reservas/${id}`)
      .send({ ...reserva, usuarioId: '66c47aa12ea87f8123456799' })
      .expect(400);
    await admin
      .put(`/reservas/${id}`)
      .send({ ...reserva, usuarioId: 'nao-e-um-id' })
      .expect(400);
    await agenteDoCliente.get(`/reservas/${id}`).expect(200);
  });

  it('responde 404 (e não 403) para reserva inexistente', async () => {
    const agente = await entrarComo(cliente);

    await agente.put('/reservas/66c47aa12ea87f8123456799').send(reserva).expect(404);
    await agente.delete('/reservas/66c47aa12ea87f8123456799').expect(404);
  });
});

describe('reservas (banco real, com login)', () => {
  it('executa o CRUD completo', async () => {
    const agente = await entrarComo(cliente);

    const criada = await agente.post('/reservas').send(reserva);
    expect(criada.status).toBe(201);
    const { id } = criada.body as { id: string };

    const consultada = await agente.get(`/reservas/${id}`);
    expect(consultada.status).toBe(200);
    expect(consultada.body).toMatchObject(reserva);

    const atualizada = await agente.put(`/reservas/${id}`).send({ ...reserva, horaFim: '20:00' });
    expect(atualizada.status).toBe(200);
    expect((atualizada.body as { horaFim: string }).horaFim).toBe('20:00');

    const lista = await agente.get('/reservas');
    expect(lista.body).toHaveLength(1);

    await agente.delete(`/reservas/${id}`).expect(204);
    await agente.get(`/reservas/${id}`).expect(404);
  });

  it('bloqueia reservas que se sobrepõem no mesmo espaço e data', async () => {
    const agente = await entrarComo(cliente);
    await agente.post('/reservas').send(reserva).expect(201);

    const sobreposta = await agente
      .post('/reservas')
      .send({ ...reserva, horaInicio: '18:30', horaFim: '19:30' });

    expect(sobreposta.status).toBe(409);
    expect(await ReservaModelo.countDocuments()).toBe(1);
  });

  it('permite horários colados, outro espaço ou outra data', async () => {
    const agente = await entrarComo(cliente);
    await agente.post('/reservas').send(reserva).expect(201);

    await agente
      .post('/reservas')
      .send({ ...reserva, horaInicio: '19:00', horaFim: '20:00' })
      .expect(201);
    await agente
      .post('/reservas')
      .send({ ...reserva, espaco: 'Quadra 2' })
      .expect(201);
    await agente
      .post('/reservas')
      .send({ ...reserva, data: '2999-12-11' })
      .expect(201);
  });

  it('libera o horário depois que a reserva é cancelada', async () => {
    const agente = await entrarComo(cliente);
    const criada = await agente.post('/reservas').send(reserva).expect(201);

    await agente
      .put(`/reservas/${(criada.body as { id: string }).id}`)
      .send({ ...reserva, status: 'CANCELADA' })
      .expect(200);

    await agente.post('/reservas').send(reserva).expect(201);
  });

  it('não acusa conflito de uma reserva com ela mesma ao editá-la', async () => {
    const agente = await entrarComo(cliente);
    const criada = await agente.post('/reservas').send(reserva).expect(201);

    await agente
      .put(`/reservas/${(criada.body as { id: string }).id}`)
      .send({ ...reserva, horaFim: '18:30' })
      .expect(200);
  });

  it('rejeita data passada com 400', async () => {
    const agente = await entrarComo(cliente);

    const resposta = await agente.post('/reservas').send({ ...reserva, data: '2000-01-01' });

    expect(resposta.status).toBe(400);
  });

  it('rejeita dados inválidos e ids malformados com 400, e inexistentes com 404', async () => {
    const agente = await entrarComo(cliente);

    await agente
      .post('/reservas')
      .send({ ...reserva, horaFim: '17:00' })
      .expect(400);
    await agente.get('/reservas/nao-e-um-id').expect(400);
    await agente.get('/reservas/66c47aa12ea87f8123456799').expect(404);
    await agente.delete('/reservas/66c47aa12ea87f8123456799').expect(404);
  });

  it('lista ordenado por data e horário', async () => {
    const agente = await entrarComo(cliente);
    await agente.post('/reservas').send({ ...reserva, horaInicio: '20:00', horaFim: '21:00' });
    await agente.post('/reservas').send(reserva);

    const lista = await agente.get('/reservas');

    expect((lista.body as { horaInicio: string }[]).map((item) => item.horaInicio)).toEqual([
      '18:00',
      '20:00',
    ]);
  });
});
