import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const MultiplayerContext = createContext(null);

export function MultiplayerProvider({ children }) {
    const wsRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [roomId, setRoomId] = useState(null);
    const [playerIndex, setPlayerIndex] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);
    const [opponentConnected, setOpponentConnected] = useState(false);

    // Event handlers stored in ref to avoid stale closures
    const handlersRef = useRef({
        onGameStart: null,
        onGameUpdate: null,
        onGameOver: null,
        onOpponentDisconnected: null
    });

    const connect = useCallback((serverUrl = 'ws://localhost:3001') => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            setConnectionStatus('connecting');
            setError(null);

            try {
                const ws = new WebSocket(serverUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('WebSocket bağlantısı kuruldu');
                    setConnectionStatus('connected');
                    resolve();
                };

                ws.onclose = () => {
                    console.log('WebSocket bağlantısı kapandı');
                    setConnectionStatus('disconnected');
                    setRoomId(null);
                    setPlayerIndex(null);
                    setOpponentConnected(false);
                };

                ws.onerror = (err) => {
                    console.error('WebSocket hatası:', err);
                    setError('Sunucuya bağlanılamadı');
                    setConnectionStatus('disconnected');
                    reject(err);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Mesaj alındı:', data.type);

                        switch (data.type) {
                            case 'ROOM_CREATED':
                                setRoomId(data.roomId);
                                setPlayerIndex(0);
                                break;

                            case 'ROOM_JOINED':
                                setRoomId(data.roomId);
                                setPlayerIndex(data.playerIndex);
                                break;

                            case 'YOUR_PLAYER_INDEX':
                                setPlayerIndex(data.playerIndex);
                                break;

                            case 'GAME_START':
                                setGameState(data.gameState);
                                setOpponentConnected(true);
                                handlersRef.current.onGameStart?.(data.gameState);
                                break;

                            case 'GAME_UPDATE':
                                setGameState(data.gameState);
                                handlersRef.current.onGameUpdate?.(data.gameState);
                                break;

                            case 'GAME_OVER':
                                setGameState(data.gameState);
                                handlersRef.current.onGameOver?.(data.winner);
                                break;

                            case 'OPPONENT_DISCONNECTED':
                                setOpponentConnected(false);
                                handlersRef.current.onOpponentDisconnected?.();
                                break;

                            case 'ERROR':
                                setError(data.message);
                                break;
                        }
                    } catch (err) {
                        console.error('Mesaj parse hatası:', err);
                    }
                };
            } catch (err) {
                setError('Bağlantı hatası');
                setConnectionStatus('disconnected');
                reject(err);
            }
        });
    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnectionStatus('disconnected');
        setRoomId(null);
        setPlayerIndex(null);
        setGameState(null);
        setOpponentConnected(false);
    }, []);

    const send = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    const createRoom = useCallback(async () => {
        setError(null);
        send({ type: 'CREATE_ROOM' });
    }, [send]);

    const joinRoom = useCallback(async (code) => {
        setError(null);
        send({ type: 'JOIN_ROOM', roomId: code });
    }, [send]);

    const sendMove = useCallback((x, y) => {
        send({ type: 'MOVE', x, y });
    }, [send]);

    const sendWall = useCallback((x, y, wallType) => {
        send({ type: 'PLACE_WALL', x, y, wallType });
    }, [send]);

    const requestRestart = useCallback(() => {
        send({ type: 'RESTART' });
    }, [send]);

    const leaveRoom = useCallback(() => {
        send({ type: 'LEAVE_ROOM' });
        setRoomId(null);
        setPlayerIndex(null);
        setGameState(null);
        setOpponentConnected(false);
    }, [send]);

    const setHandlers = useCallback((handlers) => {
        handlersRef.current = { ...handlersRef.current, ...handlers };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const value = {
        // State
        connectionStatus,
        roomId,
        playerIndex,
        gameState,
        error,
        opponentConnected,
        isConnected: connectionStatus === 'connected',
        isMyTurn: gameState?.currentPlayerIndex === playerIndex,

        // Actions
        connect,
        disconnect,
        createRoom,
        joinRoom,
        sendMove,
        sendWall,
        requestRestart,
        leaveRoom,
        setHandlers,
        clearError: () => setError(null)
    };

    return (
        <MultiplayerContext.Provider value={value}>
            {children}
        </MultiplayerContext.Provider>
    );
}

export function useMultiplayer() {
    const context = useContext(MultiplayerContext);
    if (!context) {
        throw new Error('useMultiplayer must be used within a MultiplayerProvider');
    }
    return context;
}
