import { useState, useEffect } from 'react';
import { useMultiplayer } from '../context/MultiplayerContext';
import './MainMenu.css';

export default function MainMenu({ onStartLocal, onStartMultiplayer }) {
    const {
        connect,
        createRoom,
        joinRoom,
        connectionStatus,
        roomId,
        opponentConnected,
        error,
        clearError,
        leaveRoom,
        disconnect
    } = useMultiplayer();

    const [view, setView] = useState('main'); // main, multiplayer, waiting, joining
    const [joinCode, setJoinCode] = useState('');
    const [serverAddress, setServerAddress] = useState('ws://localhost:3001');

    // Oyun başladığında multiplayer moduna geç
    useEffect(() => {
        if (opponentConnected && roomId) {
            onStartMultiplayer();
        }
    }, [opponentConnected, roomId, onStartMultiplayer]);

    const handleCreateRoom = async () => {
        try {
            await connect(serverAddress);
            await createRoom();
            setView('waiting');
        } catch (err) {
            console.error('Oda oluşturma hatası:', err);
        }
    };

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) return;
        try {
            await connect(serverAddress);
            await joinRoom(joinCode.trim().toUpperCase());
        } catch (err) {
            console.error('Odaya katılma hatası:', err);
        }
    };

    const handleBack = () => {
        if (roomId) {
            leaveRoom();
        }
        if (connectionStatus === 'connected') {
            disconnect();
        }
        setView('main');
        setJoinCode('');
        clearError();
    };

    const renderMainView = () => (
        <div className="menu-buttons">
            <button className="menu-btn local" onClick={onStartLocal}>
                <span className="btn-icon">🎮</span>
                <span className="btn-text">Yerel Oyun</span>
                <span className="btn-subtitle">Aynı bilgisayarda 2 oyuncu</span>
            </button>
            <button className="menu-btn multiplayer" onClick={() => setView('multiplayer')}>
                <span className="btn-icon">🌐</span>
                <span className="btn-text">Çok Oyunculu</span>
                <span className="btn-subtitle">LAN üzerinden oyna</span>
            </button>
        </div>
    );

    const renderMultiplayerView = () => (
        <div className="multiplayer-options">
            <div className="server-input">
                <label>Sunucu Adresi:</label>
                <input
                    type="text"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    placeholder="ws://localhost:3001"
                />
            </div>

            <button className="menu-btn create" onClick={handleCreateRoom}>
                <span className="btn-icon">➕</span>
                <span className="btn-text">Oda Oluştur</span>
            </button>

            <div className="divider">
                <span>veya</span>
            </div>

            <div className="join-section">
                <input
                    type="text"
                    className="room-code-input"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Oda Kodu"
                    maxLength={4}
                />
                <button
                    className="menu-btn join"
                    onClick={handleJoinRoom}
                    disabled={!joinCode.trim()}
                >
                    <span className="btn-icon">🚪</span>
                    <span className="btn-text">Odaya Katıl</span>
                </button>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <button className="back-btn" onClick={handleBack}>
                ← Geri
            </button>
        </div>
    );

    const renderWaitingView = () => (
        <div className="waiting-room">
            <div className="room-code-display">
                <span className="label">Oda Kodu:</span>
                <span className="code">{roomId}</span>
            </div>
            <p className="waiting-text">
                <span className="spinner"></span>
                Rakip bekleniyor...
            </p>
            <p className="share-text">
                Bu kodu arkadaşınla paylaş!
            </p>
            <button className="back-btn" onClick={handleBack}>
                ← İptal
            </button>
        </div>
    );

    return (
        <div className="main-menu">
            <h1 className="menu-title">Koridor</h1>
            <p className="menu-subtitle">Strateji Oyunu</p>

            {view === 'main' && renderMainView()}
            {view === 'multiplayer' && renderMultiplayerView()}
            {view === 'waiting' && renderWaitingView()}

            {connectionStatus === 'connecting' && (
                <div className="connecting-overlay">
                    <span className="spinner"></span>
                    Bağlanıyor...
                </div>
            )}
        </div>
    );
}
