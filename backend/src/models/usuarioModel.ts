import { Schema, model } from 'mongoose';
import type { DadosUsuario } from '../types/usuario';

const usuarioSchema = new Schema<DadosUsuario>(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    perfil: {
      type: String,
      required: true,
      enum: ['CLIENTE', 'ADMIN'],
    },
    ativo: { type: Boolean, required: true },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_documento, retorno: Record<string, unknown>) => {
        retorno.id = String(retorno._id);
        delete retorno._id;
        delete retorno.senha;
        return retorno;
      },
    },
  },
);

export const UsuarioModelo = model<DadosUsuario>('Usuario', usuarioSchema, 'usuarios');
