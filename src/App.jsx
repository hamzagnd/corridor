import { useState, useCallback } from 'react';
import { GameProvider } from './context/GameContext';
import { MultiplayerProvider } from './context/MultiplayerContext';
import MainMenu from './components/MainMenu';
import Board from './components/Board';
import StatusBar from './components/StatusBar';
import GameOverModal from './components/GameOverModal';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState('menu'); // menu, local, multiplayer

  const handleStartLocal = useCallback(() => {
    setGameMode('local');
  }, []);

  const handleStartMultiplayer = useCallback(() => {
    setGameMode('multiplayer');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setGameMode('menu');
  }, []);

  return (
    <MultiplayerProvider>
      <div className="game-container">
        {gameMode === 'menu' && (
          <MainMenu
            onStartLocal={handleStartLocal}
            onStartMultiplayer={handleStartMultiplayer}
          />
        )}

        {(gameMode === 'local' || gameMode === 'multiplayer') && (
          <GameProvider isMultiplayer={gameMode === 'multiplayer'}>
            <h1 className="title">Koridor</h1>
            <StatusBar
              isMultiplayer={gameMode === 'multiplayer'}
              onBackToMenu={handleBackToMenu}
            />
            <Board isMultiplayer={gameMode === 'multiplayer'} />
            <GameOverModal
              isMultiplayer={gameMode === 'multiplayer'}
              onBackToMenu={handleBackToMenu}
            />
          </GameProvider>
        )}
      </div>
    </MultiplayerProvider>
  );
}

export default App;
