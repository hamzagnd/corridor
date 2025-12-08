import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BOARD_SIZE, WALL_COUNT, isValidMove, isValidWallPlacement, getValidMoves } from '../utils/gameLogic';
import { useMultiplayer } from './MultiplayerContext';

const GameContext = createContext(null);

export function GameProvider({ children, isMultiplayer = false }) {
    const multiplayer = useMultiplayer();

    const initialPlayers = [
        { x: 4, y: 0, color: 'p1', walls: WALL_COUNT, targetRow: 8 },
        { x: 4, y: 8, color: 'p2', walls: WALL_COUNT, targetRow: 0 }
    ];

    const [players, setPlayers] = useState(initialPlayers);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [walls, setWalls] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);

    // Multiplayer modunda uzaktan gelen güncellemeleri dinle
    useEffect(() => {
        if (!isMultiplayer) return;

        multiplayer.setHandlers({
            onGameStart: (gameState) => {
                applyGameState(gameState);
            },
            onGameUpdate: (gameState) => {
                applyGameState(gameState);
            },
            onGameOver: (winnerIndex) => {
                setIsGameOver(true);
                setWinner(winnerIndex);
            }
        });
    }, [isMultiplayer, multiplayer]);

    // Multiplayer game state güncelleme
    useEffect(() => {
        if (isMultiplayer && multiplayer.gameState) {
            applyGameState(multiplayer.gameState);
        }
    }, [isMultiplayer, multiplayer.gameState]);

    const applyGameState = useCallback((gameState) => {
        if (!gameState) return;

        setPlayers(prev => gameState.players.map((p, i) => ({
            ...prev[i],
            x: p.x,
            y: p.y,
            walls: p.walls
        })));
        setWalls(gameState.walls || []);
        setCurrentPlayerIndex(gameState.currentPlayerIndex);
        setIsGameOver(gameState.isGameOver || false);
        setWinner(gameState.winner ?? null);
    }, []);

    const currentPlayer = players[currentPlayerIndex];
    const opponent = players[1 - currentPlayerIndex];
    const validMoves = getValidMoves(currentPlayer, opponent, walls);

    // Multiplayer modunda sıra kontrolü
    const isMyTurn = isMultiplayer ? multiplayer.playerIndex === currentPlayerIndex : true;
    const myPlayerIndex = isMultiplayer ? multiplayer.playerIndex : null;

    const movePlayer = useCallback((x, y) => {
        if (isGameOver) return false;
        if (isMultiplayer && !isMyTurn) return false;
        if (!isValidMove(currentPlayer, x, y, opponent, walls)) return false;

        if (isMultiplayer) {
            // Multiplayer: Sunucuya gönder, sunucu cevabını bekle
            multiplayer.sendMove(x, y);
            return true;
        }

        // Yerel oyun
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
    }, [currentPlayer, opponent, walls, players, currentPlayerIndex, isGameOver, isMultiplayer, isMyTurn, multiplayer]);

    const placeWall = useCallback((x, y, type) => {
        if (isGameOver) return false;
        if (isMultiplayer && !isMyTurn) return false;
        if (currentPlayer.walls <= 0) return false;
        if (!isValidWallPlacement(walls, x, y, type, players)) return false;

        if (isMultiplayer) {
            // Multiplayer: Sunucuya gönder
            multiplayer.sendWall(x, y, type);
            return true;
        }

        // Yerel oyun
        setWalls([...walls, { x, y, type }]);
        const newPlayers = [...players];
        newPlayers[currentPlayerIndex] = { ...currentPlayer, walls: currentPlayer.walls - 1 };
        setPlayers(newPlayers);
        setCurrentPlayerIndex(1 - currentPlayerIndex);
        return true;
    }, [currentPlayer, walls, players, currentPlayerIndex, isGameOver, isMultiplayer, isMyTurn, multiplayer]);

    const restartGame = useCallback(() => {
        if (isMultiplayer) {
            multiplayer.requestRestart();
            return;
        }

        setPlayers(initialPlayers);
        setCurrentPlayerIndex(0);
        setWalls([]);
        setIsGameOver(false);
        setWinner(null);
    }, [isMultiplayer, multiplayer]);

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
        isValidWallPlacement: (x, y, type) => isValidWallPlacement(walls, x, y, type, players),
        // Multiplayer özellikler
        isMultiplayer,
        isMyTurn,
        myPlayerIndex
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
