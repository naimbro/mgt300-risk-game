import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Join } from './pages/Join';
import { Lobby } from './pages/Lobby-Multiplayer';
import { Round } from './pages/Round-Multiplayer';
import { Leaderboard } from './pages/Leaderboard-Multiplayer';
import { Admin } from './pages/Admin';

export default function App() {
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/join" replace />} />
        <Route path="/join" element={<Join />} />
        <Route path="/game/:gameId/lobby" element={<Lobby />} />
        <Route path="/game/:gameId/round" element={<Round />} />
        <Route path="/game/:gameId/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
