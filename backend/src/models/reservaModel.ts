import { Schema, model } from 'mongoose';
import type { DadosReserva } from '../types/reserva';

type DocumentoReserva = DadosReserva & { responsavel: string };

const reservaSchema = new Schema<DocumentoReserva>(
  {
    usuarioId: { type: String },
    espaco: { type: String, required: true, trim: true },
    responsavel: { type: String, required: true, trim: true },
    data: { type: String, required: true },
    horaInicio: { type: String, required: true },
    horaFim: { type: String, required: true },
    status: { type: String, required: true, enum: ['CONFIRMADA', 'CANCELADA'] },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_documento, retorno: Record<string, unknown>) => {
        retorno.id = String(retorno._id);
        delete retorno._id;
        return retorno;
      },
    },
  },
);

export const ReservaModelo = model<DocumentoReserva>('Reserva', reservaSchema, 'reservas');
