// Game utility functions for Quoridor logic

export const BOARD_SIZE = 9;
export const WALL_COUNT = 10;

// Check if coordinates are within the board
export function isInBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

// Check if there's a wall at given position
export function isWallAt(walls, x, y, type) {
    return walls.some(w => w.x === x && w.y === y && w.type === type);
}

// Check if a step from (x1,y1) to (x2,y2) is blocked by a wall
export function canStep(walls, x1, y1, x2, y2) {
    if (x1 === x2) {
        // Vertical movement
        const gapY = Math.min(y1, y2);
        if (isWallAt(walls, x1 - 1, gapY, 'h')) return false;
        if (isWallAt(walls, x1, gapY, 'h')) return false;
    } else {
        // Horizontal movement
        const gapX = Math.min(x1, x2);
        if (isWallAt(walls, gapX, y1 - 1, 'v')) return false;
        if (isWallAt(walls, gapX, y1, 'v')) return false;
    }
    return true;
}

// Check if a move is valid
export function isValidMove(player, targetX, targetY, opponent, walls) {
    if (!isInBounds(targetX, targetY)) return false;

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist === 0) return false;

    // Basic adjacent move
    if (dist === 1) {
        if (!canStep(walls, player.x, player.y, targetX, targetY)) return false;
        if (targetX === opponent.x && targetY === opponent.y) return false;
        return true;
    }

    // Jumping opponent
    if (dist === 2) {
        // Straight jump
        if ((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0)) {
            const midX = (player.x + targetX) / 2;
            const midY = (player.y + targetY) / 2;

            if (midX !== opponent.x || midY !== opponent.y) return false;
            if (!canStep(walls, player.x, player.y, midX, midY)) return false;
            if (!canStep(walls, midX, midY, targetX, targetY)) return false;
            return true;
        }

        // Diagonal jump
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
            // Case A: Opponent horizontal
            if (opponent.x === player.x + dx && opponent.y === player.y) {
                const straightX = player.x + 2 * dx;
                const blocked = !isInBounds(straightX, player.y) || !canStep(walls, opponent.x, opponent.y, straightX, player.y);
                if (blocked && canStep(walls, player.x, player.y, opponent.x, opponent.y) && canStep(walls, opponent.x, opponent.y, targetX, targetY)) {
                    return true;
                }
            }
            // Case B: Opponent vertical
            if (opponent.x === player.x && opponent.y === player.y + dy) {
                const straightY = player.y + 2 * dy;
                const blocked = !isInBounds(player.x, straightY) || !canStep(walls, opponent.x, opponent.y, player.x, straightY);
                if (blocked && canStep(walls, player.x, player.y, opponent.x, opponent.y) && canStep(walls, opponent.x, opponent.y, targetX, targetY)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Check if wall placement is valid
export function isValidWallPlacement(walls, x, y, type, players) {
    // Boundary check
    if (x < 0 || x >= BOARD_SIZE - 1 || y < 0 || y >= BOARD_SIZE - 1) return false;

    // Overlap check
    if (isWallAt(walls, x, y, 'h') || isWallAt(walls, x, y, 'v')) return false;

    // Adjacent overlap check
    if (type === 'h') {
        if (isWallAt(walls, x - 1, y, 'h') || isWallAt(walls, x + 1, y, 'h')) return false;
    } else {
        if (isWallAt(walls, x, y - 1, 'v') || isWallAt(walls, x, y + 1, 'v')) return false;
    }

    // Pathfinding check
    const tempWalls = [...walls, { x, y, type }];
    const p1Path = hasPath(tempWalls, players[0], players[0].targetRow);
    const p2Path = hasPath(tempWalls, players[1], players[1].targetRow);

    return p1Path && p2Path;
}

// BFS pathfinding
export function hasPath(walls, player, targetRow) {
    const queue = [{ x: player.x, y: player.y }];
    const visited = new Set();
    visited.add(`${player.x},${player.y}`);

    while (queue.length > 0) {
        const curr = queue.shift();
        if (curr.y === targetRow) return true;

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;

            if (isInBounds(nx, ny) && !visited.has(`${nx},${ny}`)) {
                if (canStep(walls, curr.x, curr.y, nx, ny)) {
                    visited.add(`${nx},${ny}`);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
    return false;
}

// Get all valid moves for a player
export function getValidMoves(player, opponent, walls) {
    const moves = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (isValidMove(player, x, y, opponent, walls)) {
                moves.push({ x, y });
            }
        }
    }
    return moves;
}
