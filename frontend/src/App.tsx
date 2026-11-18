import { BrowserRouter, Route, Routes } from 'react-router';
import { LayoutPrincipal } from './componentes/LayoutPrincipal';
import { RotaProtegida, RotaPublica } from './componentes/Rotas';
import { AutenticacaoProvider } from './contextos/AutenticacaoContexto';
import { NotificacoesProvider } from './contextos/NotificacoesContexto';
import { Cadastro } from './paginas/Cadastro';
import { FormularioReserva } from './paginas/FormularioReserva';
import { ListaReservas } from './paginas/ListaReservas';
import { Login } from './paginas/Login';
import { NaoEncontrada } from './paginas/NaoEncontrada';

export default function App() {
  return (
    <BrowserRouter>
      <NotificacoesProvider>
        <AutenticacaoProvider>
          <Routes>
            <Route element={<RotaPublica />}>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
            </Route>

            <Route element={<RotaProtegida />}>
              <Route element={<LayoutPrincipal />}>
                <Route index element={<ListaReservas />} />
                <Route path="/reservas/nova" element={<FormularioReserva />} />
                <Route path="/reservas/:id/editar" element={<FormularioReserva />} />
                <Route path="*" element={<NaoEncontrada />} />
              </Route>
            </Route>
          </Routes>
        </AutenticacaoProvider>
      </NotificacoesProvider>
    </BrowserRouter>
  );
}
