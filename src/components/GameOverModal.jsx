import { useGame } from '../context/GameContext';
import { useMultiplayer } from '../context/MultiplayerContext';
import './GameOverModal.css';

export default function GameOverModal({ isMultiplayer, onBackToMenu }) {
    const { isGameOver, winner, restartGame, myPlayerIndex } = useGame();
    const { leaveRoom, disconnect } = useMultiplayer();

    if (!isGameOver) return null;

    const isWinner = isMultiplayer ? winner === myPlayerIndex : false;

    const getWinnerText = () => {
        if (isMultiplayer) {
            return isWinner ? '🎉 Kazandın!' : '😔 Kaybettin';
        }
        return `Oyuncu ${winner + 1} Kazandı!`;
    };

    const handleBackToMenu = () => {
        if (isMultiplayer) {
            leaveRoom();
            disconnect();
        }
        onBackToMenu();
    };

    return (
        <div className="game-over-overlay">
            <div className="game-over-modal">
                <h2 className={`winner-text ${winner === 0 ? 'p1' : 'p2'} ${isMultiplayer && isWinner ? 'winner' : ''}`}>
                    {getWinnerText()}
                </h2>
                <div className="modal-buttons">
                    <button className="btn primary" onClick={restartGame}>
                        Tekrar Oyna
                    </button>
                    <button className="btn secondary" onClick={handleBackToMenu}>
                        Ana Menü
                    </button>
                </div>
            </div>
        </div>
    );
}
