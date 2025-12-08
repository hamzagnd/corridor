import { GameProvider } from './context/GameContext';
import Board from './components/Board';
import StatusBar from './components/StatusBar';
import GameOverModal from './components/GameOverModal';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="game-container">
        <h1 className="title">Koridor</h1>
        <StatusBar />
        <Board />
        <GameOverModal />
      </div>
    </GameProvider>
  );
}

export default App;
