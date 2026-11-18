import { Router } from 'express';
import * as loginController from '../controllers/loginController';
import * as usuariosController from '../controllers/usuariosController';
import { definirPerfilCliente } from '../middlewares/definirPerfilCliente';
import { exigirAdmin, exigirSessao } from '../middlewares/exigirSessao';
import { validarDadosUsuario } from '../middlewares/validarDadosUsuario';
import { verificarOrigem } from '../middlewares/verificarOrigem';
import { reservaRotas } from './reservaRotas';
import { usuarioRotas } from './usuarioRotas';

export const rotas = Router();

rotas.use(verificarOrigem);

rotas.post('/login', loginController.entrar);
rotas.post('/logout', loginController.sair);
rotas.post('/cadastro', definirPerfilCliente, validarDadosUsuario, usuariosController.criar);

rotas.get('/sessao', exigirSessao, loginController.consultar);
rotas.use('/reservas', exigirSessao, reservaRotas);
rotas.use('/usuarios', exigirSessao, exigirAdmin, usuarioRotas);
