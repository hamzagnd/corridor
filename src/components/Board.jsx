import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BOARD_SIZE } from '../utils/gameLogic';
import './Board.css';

const CELL_SIZE = 50;
const GAP_SIZE = 8;
const PADDING = 20;

export default function Board({ isMultiplayer }) {
    const { players, walls, validMoves, movePlayer, placeWall, isValidWallPlacement, isGameOver, isMyTurn } = useGame();
    const [hoverWall, setHoverWall] = useState(null);

    // Multiplayer modunda sadece kendi sıramda oynayabilirim
    const canPlay = isMultiplayer ? isMyTurn : true;

    const handleCellClick = (x, y) => {
        if (isGameOver) return;
        if (!canPlay) return;
        movePlayer(x, y);
    };

    const handleWallClick = (x, y, type) => {
        if (isGameOver) return;
        if (!canPlay) return;
        placeWall(x, y, type);
    };

    const isValidMove = (x, y) => canPlay && validMoves.some(m => m.x === x && m.y === y);

    // Calculate board total size
    const boardSize = BOARD_SIZE * CELL_SIZE + (BOARD_SIZE - 1) * GAP_SIZE + PADDING * 2;

    return (
        <div
            className={`board ${!canPlay && isMultiplayer ? 'waiting' : ''}`}
            style={{ width: boardSize, height: boardSize }}
        >
            {/* Render Cells */}
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                const x = i % BOARD_SIZE;
                const y = Math.floor(i / BOARD_SIZE);
                const isHighlighted = isValidMove(x, y);
                const hasP1 = players[0].x === x && players[0].y === y;
                const hasP2 = players[1].x === x && players[1].y === y;

                return (
                    <div
                        key={`cell-${x}-${y}`}
                        className={`cell ${isHighlighted ? 'highlight' : ''}`}
                        style={{
                            left: PADDING + x * (CELL_SIZE + GAP_SIZE),
                            top: PADDING + y * (CELL_SIZE + GAP_SIZE),
                            width: CELL_SIZE,
                            height: CELL_SIZE
                        }}
                        onClick={() => handleCellClick(x, y)}
                    >
                        {hasP1 && <div className="pawn p1" />}
                        {hasP2 && <div className="pawn p2" />}
                    </div>
                );
            })}

            {/* Render Placed Walls */}
            {walls.map((wall, i) => {
                const isHorizontal = wall.type === 'h';
                return (
                    <div
                        key={`wall-${i}`}
                        className="wall placed"
                        style={isHorizontal ? {
                            left: PADDING + wall.x * (CELL_SIZE + GAP_SIZE),
                            top: PADDING + (wall.y + 1) * CELL_SIZE + wall.y * GAP_SIZE,
                            width: CELL_SIZE * 2 + GAP_SIZE,
                            height: GAP_SIZE
                        } : {
                            left: PADDING + (wall.x + 1) * CELL_SIZE + wall.x * GAP_SIZE,
                            top: PADDING + wall.y * (CELL_SIZE + GAP_SIZE),
                            width: GAP_SIZE,
                            height: CELL_SIZE * 2 + GAP_SIZE
                        }}
                    />
                );
            })}

            {/* Render Horizontal Wall Slots */}
            {Array.from({ length: (BOARD_SIZE - 1) * (BOARD_SIZE - 1) }).map((_, i) => {
                const x = i % (BOARD_SIZE - 1);
                const y = Math.floor(i / (BOARD_SIZE - 1));
                const isValid = canPlay && isValidWallPlacement(x, y, 'h');
                const isHovered = hoverWall?.x === x && hoverWall?.y === y && hoverWall?.type === 'h';

                return (
                    <div
                        key={`h-slot-${x}-${y}`}
                        className="wall-slot horizontal"
                        style={{
                            left: PADDING + x * (CELL_SIZE + GAP_SIZE),
                            top: PADDING + (y + 1) * CELL_SIZE + y * GAP_SIZE,
                            width: CELL_SIZE * 2 + GAP_SIZE,
                            height: GAP_SIZE
                        }}
                        onClick={() => handleWallClick(x, y, 'h')}
                        onMouseEnter={() => canPlay && setHoverWall({ x, y, type: 'h' })}
                        onMouseLeave={() => setHoverWall(null)}
                    >
                        {isHovered && (
                            <div className={`wall ghost ${isValid ? 'valid' : 'invalid'}`} />
                        )}
                    </div>
                );
            })}

            {/* Render Vertical Wall Slots */}
            {Array.from({ length: (BOARD_SIZE - 1) * (BOARD_SIZE - 1) }).map((_, i) => {
                const x = i % (BOARD_SIZE - 1);
                const y = Math.floor(i / (BOARD_SIZE - 1));
                const isValid = canPlay && isValidWallPlacement(x, y, 'v');
                const isHovered = hoverWall?.x === x && hoverWall?.y === y && hoverWall?.type === 'v';

                return (
                    <div
                        key={`v-slot-${x}-${y}`}
                        className="wall-slot vertical"
                        style={{
                            left: PADDING + (x + 1) * CELL_SIZE + x * GAP_SIZE,
                            top: PADDING + y * (CELL_SIZE + GAP_SIZE),
                            width: GAP_SIZE,
                            height: CELL_SIZE * 2 + GAP_SIZE
                        }}
                        onClick={() => handleWallClick(x, y, 'v')}
                        onMouseEnter={() => canPlay && setHoverWall({ x, y, type: 'v' })}
                        onMouseLeave={() => setHoverWall(null)}
                    >
                        {isHovered && (
                            <div className={`wall ghost ${isValid ? 'valid' : 'invalid'}`} />
                        )}
                    </div>
                );
            })}

            {/* Waiting overlay */}
            {!canPlay && isMultiplayer && !isGameOver && (
                <div className="waiting-overlay">
                    Rakip oynuyor...
                </div>
            )}
        </div>
    );
}
