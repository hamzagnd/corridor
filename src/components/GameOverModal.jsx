import { useGame } from '../context/GameContext';
import './GameOverModal.css';

export default function GameOverModal() {
    const { isGameOver, winner, restartGame } = useGame();

    if (!isGameOver) return null;

    return (
        <div className="game-over-overlay">
            <div className="game-over-modal">
                <h2 className={`winner-text ${winner === 0 ? 'p1' : 'p2'}`}>
                    Oyuncu {winner + 1} Kazandı!
                </h2>
                <button className="btn primary" onClick={restartGame}>
                    Tekrar Oyna
                </button>
            </div>
        </div>
    );
}
