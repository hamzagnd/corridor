import { createContext, useContext, useState, useCallback } from 'react';
import { BOARD_SIZE, WALL_COUNT, isValidMove, isValidWallPlacement, getValidMoves } from '../utils/gameLogic';

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const initialPlayers = [
        { x: 4, y: 0, color: 'p1', walls: WALL_COUNT, targetRow: 8 },
        { x: 4, y: 8, color: 'p2', walls: WALL_COUNT, targetRow: 0 }
    ];

    const [players, setPlayers] = useState(initialPlayers);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [walls, setWalls] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);

    const currentPlayer = players[currentPlayerIndex];
    const opponent = players[1 - currentPlayerIndex];
    const validMoves = getValidMoves(currentPlayer, opponent, walls);

    const movePlayer = useCallback((x, y) => {
        if (isGameOver) return false;
        if (!isValidMove(currentPlayer, x, y, opponent, walls)) return false;

        const newPlayers = [...players];
        newPlayers[currentPlayerIndex] = { ...currentPlayer, x, y };
        setPlayers(newPlayers);

        // Check win
        if (y === currentPlayer.targetRow) {
            setIsGameOver(true);
            setWinner(currentPlayerIndex);
        } else {
            setCurrentPlayerIndex(1 - currentPlayerIndex);
        }
        return true;
    }, [currentPlayer, opponent, walls, players, currentPlayerIndex, isGameOver]);

    const placeWall = useCallback((x, y, type) => {
        if (isGameOver) return false;
        if (currentPlayer.walls <= 0) return false;
        if (!isValidWallPlacement(walls, x, y, type, players)) return false;

        setWalls([...walls, { x, y, type }]);
        const newPlayers = [...players];
        newPlayers[currentPlayerIndex] = { ...currentPlayer, walls: currentPlayer.walls - 1 };
        setPlayers(newPlayers);
        setCurrentPlayerIndex(1 - currentPlayerIndex);
        return true;
    }, [currentPlayer, walls, players, currentPlayerIndex, isGameOver]);

    const restartGame = useCallback(() => {
        setPlayers(initialPlayers);
        setCurrentPlayerIndex(0);
        setWalls([]);
        setIsGameOver(false);
        setWinner(null);
    }, []);

    const value = {
        players,
        currentPlayerIndex,
        currentPlayer,
        opponent,
        walls,
        isGameOver,
        winner,
        validMoves,
        movePlayer,
        placeWall,
        restartGame,
        isValidWallPlacement: (x, y, type) => isValidWallPlacement(walls, x, y, type, players)
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
