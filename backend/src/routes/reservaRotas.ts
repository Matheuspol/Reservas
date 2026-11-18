import { Router } from 'express';
import * as controller from '../controllers/reservaController';
import { validarDadosReserva, validarIdReserva } from '../middlewares/validarDadosReserva';

export const reservaRotas = Router();

reservaRotas.post('/', validarDadosReserva, controller.criar);
reservaRotas.get('/', controller.listar);
reservaRotas.get('/:id', validarIdReserva, controller.buscarPorId);
reservaRotas.put('/:id', validarIdReserva, validarDadosReserva, controller.atualizar);
reservaRotas.delete('/:id', validarIdReserva, controller.excluir);
