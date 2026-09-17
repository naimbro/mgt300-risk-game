import { Navigate, Route, Routes } from 'react-router-dom';
import Entrar from './pages/Entrar';
import CrearPartida from './pages/CrearPartida';
import Anfitrion from './pages/Anfitrion';
import Jugador from './pages/Jugador';
import ComoFunciona from './pages/ComoFunciona';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Entrar />} />
      <Route path="/profe" element={<CrearPartida />} />
      <Route path="/profe/:codigo" element={<Anfitrion />} />
      <Route path="/jugar/:codigo" element={<Jugador />} />
      <Route path="/como-funciona" element={<ComoFunciona />} />
      {/* Enlace del año pasado, que circula entre docentes. */}
      <Route path="/join" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
