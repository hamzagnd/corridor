import { useGame } from '../context/GameContext';
import './StatusBar.css';

export default function StatusBar() {
    const { players, currentPlayerIndex } = useGame();

    return (
        <div className="status-bar">
            <div className={`player-info ${currentPlayerIndex === 0 ? 'active' : ''}`}>
                <div className="player-marker p1"></div>
                <span>Oyuncu 1</span>
                <div className="wall-count">Duvar: {players[0].walls}</div>
            </div>
            <div className="turn-indicator">
                Sıra: Oyuncu {currentPlayerIndex + 1}
            </div>
            <div className={`player-info ${currentPlayerIndex === 1 ? 'active' : ''}`}>
                <div className="player-marker p2"></div>
                <span>Oyuncu 2</span>
                <div className="wall-count">Duvar: {players[1].walls}</div>
            </div>
        </div>
    );
}
