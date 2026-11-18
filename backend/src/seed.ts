import 'dotenv/config';
import mongoose from 'mongoose';
import { conectarBanco } from './configuracoes/banco';
import { ReservaModelo } from './models/reservaModel';
import { UsuarioModelo } from './models/usuarioModel';
import type { DadosReserva } from './types/reserva';
import type { DadosUsuario } from './types/usuario';

const usuarios: DadosUsuario[] = [
  {
    nome: 'Administrador',
    email: 'admin@reservas.com',
    senha: 'admin123',
    perfil: 'ADMIN',
    ativo: true,
  },
  {
    nome: 'Mariana Costa',
    email: 'mariana@email.com',
    senha: 'senha123',
    perfil: 'CLIENTE',
    ativo: true,
  },
];

function dataEmDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toLocaleDateString('sv-SE');
}

function reservasDeExemplo(): (DadosReserva & { responsavel: string })[] {
  return [
    {
      espaco: 'Quadra 1',
      responsavel: 'Mariana Costa',
      data: dataEmDias(0),
      horaInicio: '18:00',
      horaFim: '19:00',
      status: 'CONFIRMADA',
    },
    {
      espaco: 'Quadra 1',
      responsavel: 'Carlos Souza',
      data: dataEmDias(0),
      horaInicio: '19:00',
      horaFim: '20:30',
      status: 'CONFIRMADA',
    },
    {
      espaco: 'Sala de Reunião A',
      responsavel: 'Ana Ribeiro',
      data: dataEmDias(1),
      horaInicio: '09:00',
      horaFim: '10:30',
      status: 'CONFIRMADA',
    },
    {
      espaco: 'Quadra 2',
      responsavel: 'Pedro Lima',
      data: dataEmDias(2),
      horaInicio: '20:00',
      horaFim: '21:00',
      status: 'CANCELADA',
    },
    {
      espaco: 'Salão de Festas',
      responsavel: 'Juliana Prado',
      data: dataEmDias(5),
      horaInicio: '14:00',
      horaFim: '18:00',
      status: 'CONFIRMADA',
    },
    {
      espaco: 'Sala de Reunião A',
      responsavel: 'Mariana Costa',
      data: dataEmDias(7),
      horaInicio: '15:00',
      horaFim: '16:00',
      status: 'CONFIRMADA',
    },
  ];
}

async function popular(): Promise<void> {
  await conectarBanco();

  for (const usuario of usuarios) {
    await UsuarioModelo.updateOne(
      { email: usuario.email },
      { $setOnInsert: usuario },
      { upsert: true },
    );
  }

  if ((await ReservaModelo.countDocuments()) === 0) {
    await ReservaModelo.insertMany(reservasDeExemplo());
  }

  // Reserva sem dono passa a ser do usuário com o mesmo nome do responsável ou, se não houver,
  // do administrador.
  const todosUsuarios = await UsuarioModelo.find();
  const administrador = todosUsuarios.find((u) => u.perfil === 'ADMIN');

  for (const reserva of await ReservaModelo.find({ usuarioId: { $exists: false } })) {
    const dono = todosUsuarios.find((u) => u.nome === reserva.responsavel) ?? administrador;
    reserva.usuarioId = String(dono?._id);
    await reserva.save();
  }

  console.info('Dados de exemplo prontos.');
  console.info('  admin   -> admin@reservas.com / admin123');
  console.info('  cliente -> mariana@email.com / senha123');
}

popular()
  .catch((erro: unknown) => {
    console.error('Não foi possível popular o banco', erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
