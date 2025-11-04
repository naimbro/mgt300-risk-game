import { resetGameState } from '../lib/gameState';

interface ResetGameButtonProps {
  onReset: () => void;
}

export const ResetGameButton: React.FC<ResetGameButtonProps> = ({ onReset }) => {
  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.')) {
      resetGameState();
      onReset();
    }
  };

  return (
    <button
      onClick={handleReset}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
    >
      Reiniciar Juego
    </button>
  );
};