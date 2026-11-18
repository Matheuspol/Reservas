import { Router } from 'express';
import * as controller from '../controllers/usuariosController';
import { validarDadosUsuario, validarIdUsuario } from '../middlewares/validarDadosUsuario';

export const usuarioRotas = Router();

usuarioRotas.post('/', validarDadosUsuario, controller.criar);
usuarioRotas.get('/', controller.listar);
usuarioRotas.get('/:id', validarIdUsuario, controller.buscarPorId);
usuarioRotas.put('/:id', validarIdUsuario, validarDadosUsuario, controller.atualizar);
usuarioRotas.delete('/:id', validarIdUsuario, controller.excluir);
