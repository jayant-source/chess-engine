const PIECE_UNICODE = {
    'w_king': '♔',
    'w_queen': '♕',
    'w_rook': '♖',
    'w_bishop': '♗',
    'w_knight': '♘',
    'w_pawn': '♙',
    'b_king': '♚',
    'b_queen': '♛',
    'b_rook': '♜',
    'b_bishop': '♝',
    'b_knight': '♞',
    'b_pawn': '♟'
};

let board = [];
let selectedPiece = null;
let validMoves = [];
let currentPlayer = 'w';
let gameOver = false;

class Piece {
    constructor(color, type, row, col) {
        this.color = color;
        this.type = type;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
    }

    // NOTE: This function gets "pseudo-legal" moves.
    // The logic to check for "check" is handled outside this class.
    getValidMoves() {
        const moves = [];
        
        if (this.type === 'pawn') {
            const direction = this.color === 'w' ? -1 : 1;
            // Move forward
            if (this.row + direction >= 0 && this.row + direction < 8 && !board[this.row + direction][this.col]) {
                moves.push([this.row + direction, this.col]);
                // Double move
                if (!this.hasMoved && !board[this.row + 2*direction][this.col]) {
                    moves.push([this.row + 2*direction, this.col]);
                }
            }
            // Capture
            for (let dc of [-1, 1]) {
                const newRow = this.row + direction;
                const newCol = this.col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = board[newRow][newCol];
                    if (target && target.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        } else if (this.type === 'knight') {
            const knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
            for (let [dr, dc] of knightMoves) {
                const newRow = this.row + dr;
                const newCol = this.col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = board[newRow][newCol];
                    if (!target || target.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        } else if (this.type === 'bishop') {
            this.addSlidingMoves(moves, [[-1,-1], [-1,1], [1,-1], [1,1]]);
        } else if (this.type === 'rook') {
            this.addSlidingMoves(moves, [[-1,0], [1,0], [0,-1], [0,1]]);
        } else if (this.type === 'queen') {
            this.addSlidingMoves(moves, [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]);
        } else if (this.type === 'king') {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newRow = this.row + dr;
                    const newCol = this.col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = board[newRow][newCol];
                        if (!target || target.color !== this.color) {
                            moves.push([newRow, newCol]);
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    addSlidingMoves(moves, directions) {
        for (let [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = this.row + dr * i;
                const newCol = this.col + dc * i;
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push([newRow, newCol]);
                } else {
                    if (target.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
    }
}

function initBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = new Piece('b', 'pawn', 1, col);
        board[6][col] = new Piece('w', 'pawn', 6, col);
    }
    
    // Other pieces
    const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
        board[0][col] = new Piece('b', pieceOrder[col], 0, col);
        board[7][col] = new Piece('w', pieceOrder[col], 7, col);
    }
}

function drawBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                square.classList.add('selected');
            }
            
            if (validMoves.some(([r, c]) => r === row && c === col)) {
                square.classList.add('valid-move');
            }
            
            const piece = board[row][col];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece';
                pieceDiv.textContent = PIECE_UNICODE[piece.color + '_' + piece.type];
                square.appendChild(pieceDiv);
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            chessboard.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (gameOver || currentPlayer !== 'w') return;
    
    // If clicking on a valid move
    // NOTE: This logic does NOT check if the move is legal (i.e., puts player in check)
    // We will add that logic next.
    if (selectedPiece && validMoves.some(([r, c]) => r === row && c === col)) {
        movePiece(selectedPiece, row, col);
        selectedPiece = null;
        validMoves = [];
        currentPlayer = 'b';
        updateTurnIndicator();
        drawBoard();
        
        setTimeout(() => {
            if (!gameOver) aiMove();
        }, 500);
        return;
    }
    
    // Select a piece
    const piece = board[row][col];
    if (piece && piece.color === currentPlayer) {
        selectedPiece = piece;
        validMoves = piece.getValidMoves(); // Gets pseudo-legal moves
        drawBoard();
    } else {
        selectedPiece = null;
        validMoves = [];
        drawBoard();
    }
}

// ==========================================================
// UPDATED/NEW HELPER FUNCTIONS FOR CHECK DETECTION
// ==========================================================

/**
 * Updated movePiece to return the captured piece for undo purposes.
 */
function movePiece(piece, newRow, newCol) {
    const oldRow = piece.row;
    const oldCol = piece.col;
    const capturedPiece = board[newRow][newCol];

    board[oldRow][oldCol] = null;
    
    if (capturedPiece && capturedPiece.type === 'king') {
        gameOver = true;
        document.getElementById('status').textContent = 
            `Game Over! ${piece.color === 'w' ? 'White' : 'Black'} wins!`;
    }
    
    board[newRow][newCol] = piece;
    piece.row = newRow;
    piece.col = newCol;
    piece.hasMoved = true;

    // Return what was captured so we can undo it
    return capturedPiece;
}

/**
 * New function to undo a move for AI simulation.
 * This relates to "Stacks" from Unit 1 (pop operation).
 */
function undoMove(piece, oldRow, oldCol, capturedPiece) {
    board[piece.row][piece.col] = capturedPiece; // Put captured piece back (or null)
    board[oldRow][oldCol] = piece;
    piece.row = oldRow;
    piece.col = oldCol;
    
    // Note: We are not resetting 'hasMoved' for this simple simulation.
}

/**
 * Helper function to find the king's current position.
 * Uses a "Searching" algorithm (Unit 5).
 */
function findKing(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'king' && piece.color === color) {
                return piece;
            }
        }
    }
    return null;
}

/**
 * Core "Threat Detection" logic (Unit 5: Searching).
 * Checks if a square is attacked by 'attackerColor'.
 */
function isSquareAttacked(row, col, attackerColor) {
    // Check for sliding pieces (Rook, Bishop, Queen) - (Unit 1: Arrays)
    const directions = {
        'bishop': [[-1,-1], [-1,1], [1,-1], [1,1]],
        'rook': [[-1,0], [1,0], [0,-1], [0,1]],
        'queen': [[-1,-1], [-1,1], [1,-1], [1,1], [-1,0], [1,0], [0,-1], [0,1]]
    };

    for (let type of ['rook', 'bishop', 'queen']) {
        for (let [dr, dc] of directions[type]) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                const target = board[newRow][newCol];
                if (target) {
                    if (target.color === attackerColor && (target.type === type || target.type === 'queen')) {
                        return true;
                    }
                    break; // Path is blocked
                }
            }
        }
    }
    
    // Check for Knights
    const knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
    for (let [dr, dc] of knightMoves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const target = board[newRow][newCol];
            if (target && target.color === attackerColor && target.type === 'knight') {
                return true;
            }
        }
    }

    // Check for Pawns
    const pawnDirection = (attackerColor === 'w') ? 1 : -1;
    const pawnAttackCols = [col - 1, col + 1];
    for (let attackCol of pawnAttackCols) {
        const newRow = row + pawnDirection;
        if (newRow >= 0 && newRow < 8 && attackCol >= 0 && attackCol < 8) {
            const target = board[newRow][attackCol];
            if (target && target.color === attackerColor && target.type === 'pawn') {
                return true;
            }
        }
    }

    // Check for King
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                if (target && target.color === attackerColor && target.type === 'king') {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Checks if the king of the specified color is currently in check.
 */
function isKingInCheck(color) {
    const king = findKing(color);
    if (!king) return false;
    
    const opponentColor = (color === 'w') ? 'b' : 'w';
    return isSquareAttacked(king.row, king.col, opponentColor);
}

// ==========================================================
// UPDATED AI FUNCTION (WITH CHECK DETECTION)
// This is an "Application of Trees" (Unit 3) - simulating 1-ply deep.
// ==========================================================
function aiMove() {
    const allPseudoMoves = [];
    
    // 1. Get all *possible* moves (pseudo-legal)
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === 'b') {
                const moves = piece.getValidMoves();
                for (let move of moves) {
                    allPseudoMoves.push({ piece, move });
                }
            }
        }
    }

    // 2. Filter for *legal* moves (ones that save the king)
    const legalMoves = [];
    for (let pseudoMove of allPseudoMoves) {
        const { piece, move: [newRow, newCol] } = pseudoMove;
        const [oldRow, oldCol] = [piece.row, piece.col];

        // Simulate the move
        const capturedPiece = movePiece(piece, newRow, newCol);
        
        // Check if the king is safe after this move
        if (!isKingInCheck('b')) {
            legalMoves.push(pseudoMove);
        }

        // Undo the move
        undoMove(piece, oldRow, oldCol, capturedPiece);
    }

    // 3. Now, choose the best move from the *legal* list
    // This is a simple version of a "Priority Queue" (Unit 1)
    const captureMoves = [];
    const allOtherMoves = [];
    
    for (let legalMove of legalMoves) {
        const [newRow, newCol] = legalMove.move;
        const targetPiece = board[newRow][newCol];
        if (targetPiece && targetPiece.color === 'w') {
            captureMoves.push(legalMove);
        } else {
            allOtherMoves.push(legalMove);
        }
    }

    let chosenMove = null;
    if (captureMoves.length > 0) {
        // Prioritize captures
        chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else if (allOtherMoves.length > 0) {
        // Otherwise, pick any other legal move
        chosenMove = allOtherMoves[Math.floor(Math.random() * allOtherMoves.length)];
    }

    // 4. Make the chosen move (for real this time)
    if (chosenMove) {
        const { piece, move } = chosenMove;
        movePiece(piece, move[0], move[1]);
    } else {
        // This means there are no legal moves!
        // We need to check if it's Checkmate or Stalemate
        if (isKingInCheck('b')) {
            gameOver = true;
            document.getElementById('status').textContent = "Checkmate! White wins!";
            updateTurnIndicator();
        } else {
            gameOver = true;
            document.getElementById('status').textContent = "Stalemate! It's a draw.";
            updateTurnIndicator();
        }
    }
    
    if (!gameOver) {
        currentPlayer = 'w';
        updateTurnIndicator();
        drawBoard();
    }
}
// ==========================================================
// END OF AI FUNCTION
// ==========================================================

function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    if (gameOver) {
        // Status text is set by the game-ending function
    } else {
        indicator.textContent = currentPlayer === 'w' ? 'Your Turn (White)' : 'AI Thinking (Black)...';
    }
}

function resetGame() {
    initBoard();
    selectedPiece = null;
    validMoves = [];
    currentPlayer = 'w';
    gameOver = false;
    document.getElementById('status').textContent = '';
    updateTurnIndicator();
    drawBoard();
}

// Initialize game
initBoard();
drawBoard();
updateTurnIndicator();