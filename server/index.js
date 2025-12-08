import { WebSocketServer } from 'ws';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

// Oda yönetimi
const rooms = new Map();

// Rastgele 4 karakterli oda kodu oluştur
function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Oyun başlangıç durumu
function createInitialGameState() {
    return {
        players: [
            { x: 4, y: 0, walls: 10, targetRow: 8 },
            { x: 4, y: 8, walls: 10, targetRow: 0 }
        ],
        walls: [],
        currentPlayerIndex: 0,
        isGameOver: false,
        winner: null
    };
}

// Mesaj gönderme
function send(ws, data) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Odadaki herkese mesaj gönder
function broadcast(room, data) {
    room.clients.forEach(client => send(client, data));
}

wss.on('connection', (ws) => {
    console.log('Yeni bağlantı');

    ws.roomId = null;
    ws.playerIndex = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Mesaj alındı:', data.type);

            switch (data.type) {
                case 'CREATE_ROOM': {
                    // Benzersiz oda kodu oluştur
                    let roomId;
                    do {
                        roomId = generateRoomId();
                    } while (rooms.has(roomId));

                    const room = {
                        id: roomId,
                        clients: [ws],
                        gameState: null,
                        started: false
                    };
                    rooms.set(roomId, room);

                    ws.roomId = roomId;
                    ws.playerIndex = 0;

                    send(ws, {
                        type: 'ROOM_CREATED',
                        roomId: roomId
                    });
                    console.log(`Oda oluşturuldu: ${roomId}`);
                    break;
                }

                case 'JOIN_ROOM': {
                    const roomId = data.roomId?.toUpperCase();
                    const room = rooms.get(roomId);

                    if (!room) {
                        send(ws, { type: 'ERROR', message: 'Oda bulunamadı' });
                        break;
                    }

                    if (room.clients.length >= 2) {
                        send(ws, { type: 'ERROR', message: 'Oda dolu' });
                        break;
                    }

                    if (room.started) {
                        send(ws, { type: 'ERROR', message: 'Oyun zaten başlamış' });
                        break;
                    }

                    room.clients.push(ws);
                    ws.roomId = roomId;
                    ws.playerIndex = 1;

                    send(ws, {
                        type: 'ROOM_JOINED',
                        roomId: roomId,
                        playerIndex: 1
                    });

                    // Oyunu başlat
                    room.gameState = createInitialGameState();
                    room.started = true;

                    broadcast(room, {
                        type: 'GAME_START',
                        gameState: room.gameState,
                        playerIndex: null // Her client kendi playerIndex'ini bilir
                    });

                    // Her oyuncuya kendi index'ini gönder
                    room.clients.forEach((client, index) => {
                        send(client, {
                            type: 'YOUR_PLAYER_INDEX',
                            playerIndex: index
                        });
                    });

                    console.log(`Oyuncu odaya katıldı: ${roomId}`);
                    break;
                }

                case 'MOVE': {
                    const room = rooms.get(ws.roomId);
                    if (!room || !room.started) break;

                    const { x, y } = data;
                    const gameState = room.gameState;

                    // Sıra kontrolü
                    if (gameState.currentPlayerIndex !== ws.playerIndex) {
                        send(ws, { type: 'ERROR', message: 'Sıra sizde değil' });
                        break;
                    }

                    // Hamle geçerliliği client tarafında kontrol edildi
                    // Burada basit güncelleme yapıyoruz
                    gameState.players[ws.playerIndex].x = x;
                    gameState.players[ws.playerIndex].y = y;

                    // Kazanma kontrolü
                    const player = gameState.players[ws.playerIndex];
                    if (y === player.targetRow) {
                        gameState.isGameOver = true;
                        gameState.winner = ws.playerIndex;
                        broadcast(room, {
                            type: 'GAME_OVER',
                            winner: ws.playerIndex,
                            gameState: gameState
                        });
                    } else {
                        gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
                        broadcast(room, {
                            type: 'GAME_UPDATE',
                            gameState: gameState
                        });
                    }
                    break;
                }

                case 'PLACE_WALL': {
                    const room = rooms.get(ws.roomId);
                    if (!room || !room.started) break;

                    const { x, y, wallType } = data;
                    const gameState = room.gameState;

                    // Sıra kontrolü
                    if (gameState.currentPlayerIndex !== ws.playerIndex) {
                        send(ws, { type: 'ERROR', message: 'Sıra sizde değil' });
                        break;
                    }

                    // Duvar sayısı kontrolü
                    if (gameState.players[ws.playerIndex].walls <= 0) {
                        send(ws, { type: 'ERROR', message: 'Duvar kalmadı' });
                        break;
                    }

                    // Duvarı ekle
                    gameState.walls.push({ x, y, type: wallType });
                    gameState.players[ws.playerIndex].walls--;
                    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;

                    broadcast(room, {
                        type: 'GAME_UPDATE',
                        gameState: gameState
                    });
                    break;
                }

                case 'RESTART': {
                    const room = rooms.get(ws.roomId);
                    if (!room) break;

                    room.gameState = createInitialGameState();
                    broadcast(room, {
                        type: 'GAME_START',
                        gameState: room.gameState
                    });
                    break;
                }

                case 'LEAVE_ROOM': {
                    handleLeave(ws);
                    break;
                }
            }
        } catch (err) {
            console.error('Mesaj işleme hatası:', err);
        }
    });

    ws.on('close', () => {
        console.log('Bağlantı kapandı');
        handleLeave(ws);
    });
});

function handleLeave(ws) {
    if (!ws.roomId) return;

    const room = rooms.get(ws.roomId);
    if (!room) return;

    // Oyuncuyu odadan çıkar
    room.clients = room.clients.filter(c => c !== ws);

    // Diğer oyuncuya bildir
    if (room.clients.length > 0) {
        broadcast(room, { type: 'OPPONENT_DISCONNECTED' });
    }

    // Oda boşsa sil
    if (room.clients.length === 0) {
        rooms.delete(ws.roomId);
        console.log(`Oda silindi: ${ws.roomId}`);
    }

    ws.roomId = null;
    ws.playerIndex = null;
}

console.log(`WebSocket sunucusu port ${PORT}'de çalışıyor`);
console.log(`Bağlantı adresi: ws://localhost:${PORT}`);
