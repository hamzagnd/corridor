import { useGame } from '../context/GameContext';
import { useMultiplayer } from '../context/MultiplayerContext';
import './StatusBar.css';

export default function StatusBar({ isMultiplayer, onBackToMenu }) {
    const { players, currentPlayerIndex, isMyTurn, myPlayerIndex } = useGame();
    const { roomId, opponentConnected, leaveRoom, disconnect } = useMultiplayer();

    const handleLeave = () => {
        if (isMultiplayer) {
            leaveRoom();
            disconnect();
        }
        onBackToMenu();
    };

    return (
        <div className="status-bar">
            <div className={`player-info ${currentPlayerIndex === 0 ? 'active' : ''} ${isMultiplayer && myPlayerIndex === 0 ? 'you' : ''}`}>
                <div className="player-marker p1"></div>
                <span>
                    {isMultiplayer && myPlayerIndex === 0 ? 'Sen' : 'Oyuncu 1'}
                </span>
                <div className="wall-count">Duvar: {players[0].walls}</div>
            </div>

            <div className="center-info">
                <div className="turn-indicator">
                    {isMultiplayer ? (
                        isMyTurn ? '🎯 Senin sıran!' : '⏳ Rakip oynuyor...'
                    ) : (
                        `Sıra: Oyuncu ${currentPlayerIndex + 1}`
                    )}
                </div>
                {isMultiplayer && roomId && (
                    <div className="room-info">
                        <span className="room-label">Oda:</span>
                        <span className="room-code">{roomId}</span>
                        {!opponentConnected && (
                            <span className="disconnected">⚠️ Rakip bağlantısı kesildi</span>
                        )}
                    </div>
                )}
            </div>

            <div className={`player-info ${currentPlayerIndex === 1 ? 'active' : ''} ${isMultiplayer && myPlayerIndex === 1 ? 'you' : ''}`}>
                <div className="player-marker p2"></div>
                <span>
                    {isMultiplayer && myPlayerIndex === 1 ? 'Sen' : 'Oyuncu 2'}
                </span>
                <div className="wall-count">Duvar: {players[1].walls}</div>
            </div>

            <button className="leave-btn" onClick={handleLeave} title="Oyundan Çık">
                ✕
            </button>
        </div>
    );
}
