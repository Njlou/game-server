class GameClient {
    constructor() {
        this.socket = null;
        this.token = null;
        this.currentGame = null;
        this.gameState = null;
        this.playerNumber = null; // For multiplayer games

        // Canvas elements
        this.line98Canvas = document.getElementById('line98Canvas');
        this.caroCanvas = document.getElementById('caroCanvas');
        this.line98Ctx = this.line98Canvas.getContext('2d');
        this.caroCtx = this.caroCanvas.getContext('2d');

        // Game constants
        this.LINE98_CELL_SIZE = 50;
        this.CARO_CELL_SIZE = 30;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Line98 canvas click
        this.line98Canvas.addEventListener('click', (e) => {
            if (this.currentGame === 'line98' && this.gameState) {
                this.handleLine98Click(e);
            }
        });

        // Caro canvas click
        this.caroCanvas.addEventListener('click', (e) => {
            if (this.currentGame === 'caro' && this.gameState) {
                this.handleCaroClick(e);
            }
        });
    }

    async register() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.access_token;
                this.showAuthStatus('Register success!', 'success');
                this.showGameSelection();
            } else {
                this.showAuthStatus('Error: ' + data.message, 'error');
            }
        } catch (error) {
            this.showAuthStatus('Connection error', 'error');
        }
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.access_token;
                this.showAuthStatus('Login success!', 'success');
                this.showGameSelection();
                this.connectWebSocket();
            } else {
                this.showAuthStatus('Error: ' + data.message, 'error');
            }
        } catch (error) {
            this.showAuthStatus('Connection error', 'error');
        }
    }

    connectWebSocket() {
        this.socket = io('http://localhost:3000', {
            auth: {
                token: this.token
            }
        });

        this.socket.on('connect', () => {
            this.showGameStatus('Connected to server', 'connected');
        });

        this.socket.on('disconnect', () => {
            this.showGameStatus('Disconnected from server', 'disconnected');
        });

        // Line98 game events
        this.socket.on('matchFound', (data) => {
            this.showGameStatus('Match found! Starting game...', 'connected');
            this.initializeGame(this.currentGame);
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;
            this.renderGame();
        });

        this.socket.on('opponentMove', (move) => {
            this.handleOpponentMove(move);
        });

        // Caro game events
        this.socket.on('queueStatus', (data) => {
            this.showGameStatus(data.message, 'connected');
        });

        this.socket.on('caroMatchFound', (data) => {
            this.playerNumber = data.playerNumber;
            this.gameState = data.gameState;
            this.showGameStatus(`Match found! You are Player ${data.playerNumber} (${data.playerNumber === 1 ? 'X' : 'O'})`, 'connected');
            this.renderCaro();
        });

        this.socket.on('caroMoveMade', (data) => {
            this.gameState = data.gameState;
            this.renderCaro();

            if (this.gameState.gameOver) {
                if (this.gameState.winner === 0) {
                    this.showGameStatus('Game ended in draw!', 'connected');
                } else {
                    this.showGameStatus(`Player ${this.gameState.winner} (${this.gameState.winner === 1 ? 'X' : 'O'}) wins!`, 'connected');
                }
            } else {
                const currentPlayer = this.gameState.currentPlayer === 1 ? 'X' : 'O';
                this.showGameStatus(`Player ${currentPlayer}'s turn`, 'connected');
            }
        });

        this.socket.on('moveResult', (data) => {
            if (!data.success) {
                this.showGameStatus(data.message, 'disconnected');
            }
        });

        this.socket.on('opponentDisconnected', (data) => {
            this.showGameStatus('Opponent disconnected. Returning to menu.', 'disconnected');
            setTimeout(() => {
                this.backToMenu();
            }, 3000);
        });
    }

    showAuthStatus(message, type) {
        const statusDiv = document.getElementById('authStatus');
        statusDiv.textContent = message;
        statusDiv.className = type === 'success' ? 'status connected' : 'status disconnected';
    }

    showGameStatus(message, type) {
        const statusId = this.currentGame + 'Status';
        const statusDiv = document.getElementById(statusId);
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
        }
    }

    showGameSelection() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('gameSelection').style.display = 'flex';
    }

    selectGame(gameType) {
        this.currentGame = gameType;
        this.playerNumber = null; // Reset player number

        // Hide all game areas
        document.querySelectorAll('.game-area').forEach(area => {
            area.classList.remove('active');
        });

        // Show selected game
        document.getElementById(gameType + 'Game').classList.add('active');

        // Initialize game for single player practice
        this.initializeGame(gameType);
    }

    initializeGame(gameType) {
        if (gameType === 'line98') {
            this.initializeLine98();
        } else if (gameType === 'caro') {
            this.initializeCaro();
        }
    }

    initializeLine98() {
        // Create initial game state for single player
        this.gameState = {
            grid: Array(9).fill().map(() => Array(9).fill(-1)), // -1 means empty
            score: 0,
            selectedBall: null,
            gameOver: false
        };

        // Add initial balls
        for (let i = 0; i < 5; i++) {
            this.addRandomBall();
        }

        this.renderLine98();
    }

    initializeCaro() {
        // Create initial game state for single player practice
        this.gameState = {
            board: Array(15).fill().map(() => Array(15).fill(0)), // 0 means empty
            currentPlayer: 1, // 1 = X, 2 = O
            winner: 0,
            gameOver: false,
            lastMove: null
        };
        this.renderCaro();
        this.showGameStatus('Click "Find Opponent" to play multiplayer, or practice by clicking the board', 'connected');
    }

    handleLine98Click(e) {
        const rect = this.line98Canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / this.LINE98_CELL_SIZE);
        const row = Math.floor(y / this.LINE98_CELL_SIZE);

        if (this.gameState.selectedBall) {
            // Try to move selected ball
            this.moveBall(row, col);
        } else {
            // Select a ball
            this.selectBall(row, col);
        }
    }

    handleCaroClick(e) {
        const rect = this.caroCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / this.CARO_CELL_SIZE);
        const row = Math.floor(y / this.CARO_CELL_SIZE);

        this.makeMove(row, col);
    }

    selectBall(row, col) {
        if (this.gameState.grid[row][col] !== -1) {
            this.gameState.selectedBall = { row, col };
            this.renderLine98();
        }
    }

    moveBall(toRow, toCol) {
        const fromRow = this.gameState.selectedBall.row;
        const fromCol = this.gameState.selectedBall.col;

        // Check if target cell is empty
        if (this.gameState.grid[toRow][toCol] !== -1) {
            this.showGameStatus('Target cell is not empty!', 'disconnected');
            return;
        }

        // Check if move is horizontal or vertical only (no diagonal)
        if (fromRow !== toRow && fromCol !== toCol) {
            this.showGameStatus('Can only move horizontally or vertically!', 'disconnected');
            return;
        }

        // Check if path is clear
        if (!this.isPathClear(fromRow, fromCol, toRow, toCol)) {
            this.showGameStatus('Path is blocked!', 'disconnected');
            return;
        }

        // Move the ball
        this.gameState.grid[toRow][toCol] = this.gameState.grid[fromRow][fromCol];
        this.gameState.grid[fromRow][fromCol] = -1;
        this.gameState.selectedBall = null;

        // Check for matches and clear them
        const matchesCleared = this.checkAndClearMatches();
        if (matchesCleared > 0) {
            this.gameState.score += matchesCleared * 10;
            this.showGameStatus(`Cleared ${matchesCleared} balls! +${matchesCleared * 10} points`, 'connected');
        }

        // Add new balls
        for (let i = 0; i < 3; i++) {
            if (!this.addRandomBall()) {
                break; // Stop if no more empty cells
            }
        }

        this.renderLine98();

        // Send move to server for multiplayer
        if (this.socket && this.playerNumber) {
            this.socket.emit('moveBall', { fromRow, fromCol, toRow, toCol });
        }
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        if (fromRow === toRow) {
            // Horizontal move
            const start = Math.min(fromCol, toCol);
            const end = Math.max(fromCol, toCol);
            for (let col = start + 1; col < end; col++) {
                if (this.gameState.grid[fromRow][col] !== -1) {
                    return false;
                }
            }
        } else {
            // Vertical move
            const start = Math.min(fromRow, toRow);
            const end = Math.max(fromRow, toRow);
            for (let row = start + 1; row < end; row++) {
                if (this.gameState.grid[row][fromCol] !== -1) {
                    return false;
                }
            }
        }
        return true;
    }

    checkAndClearMatches() {
        let totalCleared = 0;
        const positionsToClear = [];

        // Check horizontal matches
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col <= 4; col++) { // Only need to check until column 4
                const color = this.gameState.grid[row][col];
                if (color === -1) continue;

                let matchLength = 1;
                while (col + matchLength < 9 && this.gameState.grid[row][col + matchLength] === color) {
                    matchLength++;
                }

                if (matchLength >= 5) {
                    for (let i = 0; i < matchLength; i++) {
                        positionsToClear.push({ row, col: col + i });
                    }
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < 9; col++) {
            for (let row = 0; row <= 4; row++) {
                const color = this.gameState.grid[row][col];
                if (color === -1) continue;

                let matchLength = 1;
                while (row + matchLength < 9 && this.gameState.grid[row + matchLength][col] === color) {
                    matchLength++;
                }

                if (matchLength >= 5) {
                    for (let i = 0; i < matchLength; i++) {
                        positionsToClear.push({ row: row + i, col });
                    }
                }
            }
        }

        // Clear all matched positions
        positionsToClear.forEach(pos => {
            if (this.gameState.grid[pos.row][pos.col] !== -1) {
                this.gameState.grid[pos.row][pos.col] = -1;
                totalCleared++;
            }
        });

        return totalCleared;
    }

    makeMove(row, col) {
        // For multiplayer Caro, use WebSocket
        if (this.currentGame === 'caro' && this.socket && this.playerNumber) {
            this.socket.emit('makeCaroMove', {
                row: row,
                col: col,
                player: this.playerNumber
            });
            return;
        }

        // Single player Caro logic
        if (this.gameState.gameOver) {
            return;
        }

        if (this.gameState.board[row][col] !== 0) {
            this.showGameStatus('Cell already occupied!', 'disconnected');
            return;
        }

        // Place piece
        this.gameState.board[row][col] = this.gameState.currentPlayer;
        this.gameState.lastMove = { row, col };

        // Check for win
        if (this.checkWin(row, col, this.gameState.currentPlayer)) {
            this.gameState.winner = this.gameState.currentPlayer;
            this.gameState.gameOver = true;
            this.showGameStatus(`Player ${this.gameState.currentPlayer === 1 ? 'X' : 'O'} wins!`, 'connected');
        } else if (this.isBoardFull()) {
            this.gameState.gameOver = true;
            this.showGameStatus('Game draw!', 'connected');
        } else {
            // Switch player
            this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
            this.showGameStatus(`Player ${this.gameState.currentPlayer === 1 ? 'X' : 'O'}'s turn`, 'connected');
        }

        this.renderCaro();
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) break;
                if (this.gameState.board[newRow][newCol] !== player) break;
                count++;
            }

            // Check negative direction
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) break;
                if (this.gameState.board[newRow][newCol] !== player) break;
                count++;
            }

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    isBoardFull() {
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (this.gameState.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    addRandomBall() {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.gameState.grid[i][j] === -1) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length === 0) {
            return false;
        }

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.gameState.grid[randomCell.row][randomCell.col] = Math.floor(Math.random() * 5);
        return true;
    }

    renderGame() {
        if (this.currentGame === 'line98') {
            this.renderLine98();
        } else if (this.currentGame === 'caro') {
            this.renderCaro();
        }
    }

    renderLine98() {
        this.line98Ctx.clearRect(0, 0, this.line98Canvas.width, this.line98Canvas.height);

        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const x = col * this.LINE98_CELL_SIZE;
                const y = row * this.LINE98_CELL_SIZE;

                // Draw cell background
                this.line98Ctx.fillStyle = (row + col) % 2 === 0 ? '#F0F0F0' : '#E0E0E0';
                this.line98Ctx.fillRect(x, y, this.LINE98_CELL_SIZE, this.LINE98_CELL_SIZE);

                // Draw ball if exists
                if (this.gameState.grid[row][col] !== -1) {
                    const colorIndex = this.gameState.grid[row][col];
                    this.line98Ctx.fillStyle = colors[colorIndex];

                    // Highlight selected ball
                    if (this.gameState.selectedBall &&
                        this.gameState.selectedBall.row === row &&
                        this.gameState.selectedBall.col === col) {
                        this.line98Ctx.shadowColor = 'yellow';
                        this.line98Ctx.shadowBlur = 10;
                    }

                    this.line98Ctx.beginPath();
                    this.line98Ctx.arc(
                        x + this.LINE98_CELL_SIZE / 2,
                        y + this.LINE98_CELL_SIZE / 2,
                        this.LINE98_CELL_SIZE / 2 - 2,
                        0,
                        Math.PI * 2
                    );
                    this.line98Ctx.fill();

                    // Reset shadow
                    this.line98Ctx.shadowColor = 'transparent';
                    this.line98Ctx.shadowBlur = 0;
                }

                // Draw grid lines
                this.line98Ctx.strokeStyle = '#CCC';
                this.line98Ctx.strokeRect(x, y, this.LINE98_CELL_SIZE, this.LINE98_CELL_SIZE);
            }
        }

        // Draw score
        this.line98Ctx.fillStyle = '#333';
        this.line98Ctx.font = '16px Arial';
        this.line98Ctx.fillText(`Score: ${this.gameState.score}`, 10, 20);
    }

    renderCaro() {
        this.caroCtx.clearRect(0, 0, this.caroCanvas.width, this.caroCanvas.height);

        // Draw grid
        for (let i = 0; i <= 15; i++) {
            // Vertical lines
            this.caroCtx.beginPath();
            this.caroCtx.moveTo(i * this.CARO_CELL_SIZE, 0);
            this.caroCtx.lineTo(i * this.CARO_CELL_SIZE, this.caroCanvas.height);
            this.caroCtx.stroke();

            // Horizontal lines
            this.caroCtx.beginPath();
            this.caroCtx.moveTo(0, i * this.CARO_CELL_SIZE);
            this.caroCtx.lineTo(this.caroCanvas.width, i * this.CARO_CELL_SIZE);
            this.caroCtx.stroke();
        }

        // Draw pieces
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (this.gameState.board[row][col] !== 0) {
                    const x = col * this.CARO_CELL_SIZE + this.CARO_CELL_SIZE / 2;
                    const y = row * this.CARO_CELL_SIZE + this.CARO_CELL_SIZE / 2;

                    if (this.gameState.board[row][col] === 1) {
                        // Draw X
                        this.caroCtx.strokeStyle = '#FF6B6B';
                        this.caroCtx.lineWidth = 2;
                        this.caroCtx.beginPath();
                        this.caroCtx.moveTo(x - 10, y - 10);
                        this.caroCtx.lineTo(x + 10, y + 10);
                        this.caroCtx.moveTo(x + 10, y - 10);
                        this.caroCtx.lineTo(x - 10, y + 10);
                        this.caroCtx.stroke();
                    } else {
                        // Draw O
                        this.caroCtx.strokeStyle = '#4ECDC4';
                        this.caroCtx.lineWidth = 2;
                        this.caroCtx.beginPath();
                        this.caroCtx.arc(x, y, 10, 0, Math.PI * 2);
                        this.caroCtx.stroke();
                    }
                }
            }
        }

        // Draw game info
        this.caroCtx.fillStyle = '#333';
        this.caroCtx.font = '16px Arial';

        if (this.playerNumber) {
            this.caroCtx.fillText(`You are: ${this.playerNumber === 1 ? 'X' : 'O'}`, 10, 20);
        }

        if (!this.gameState.gameOver) {
            this.caroCtx.fillText(`Turn: ${this.gameState.currentPlayer === 1 ? 'X' : 'O'}`, 10, 40);
        } else if (this.gameState.winner > 0) {
            this.caroCtx.fillText(`Winner: ${this.gameState.winner === 1 ? 'X' : 'O'}`, 10, 40);
        } else {
            this.caroCtx.fillText('Game Draw!', 10, 40);
        }
    }

    joinQueue(gameType) {
        if (this.socket) {
            if (gameType === 'caro') {
                this.socket.emit('joinCaroQueue');
                this.showGameStatus('Joining Caro queue...', 'connected');
            } else {
                this.socket.emit('joinQueue', { gameType });
                this.showGameStatus('Finding opponent...', 'connected');
            }
        } else {
            this.showGameStatus('Not connected to server', 'disconnected');
        }
    }

    getHint() {
        // Simple hint for Line98
        if (this.currentGame === 'line98') {
            this.showGameStatus('Hint: Try to create rows of 5 same-colored balls', 'connected');
        } else if (this.currentGame === 'caro') {
            this.showGameStatus('Hint: Try to block your opponent while building your own line', 'connected');
        }
    }

    handleOpponentMove(move) {
        if (this.currentGame === 'line98') {
            // Handle opponent move in Line98
        } else if (this.currentGame === 'caro') {
            // Handle opponent move in Caro - server will handle this via caroMoveMade event
        }
    }

    backToMenu() {
        // Leave current game if in multiplayer
        if (this.socket && this.playerNumber) {
            this.socket.emit('leaveCaroGame');
        }

        document.querySelectorAll('.game-area').forEach(area => {
            area.classList.remove('active');
        });
        document.getElementById('gameSelection').style.display = 'flex';
        this.currentGame = null;
        this.playerNumber = null;
    }
}

// Global functions for HTML buttons
const client = new GameClient();

function register() {
    client.register();
}

function login() {
    client.login();
}

function selectGame(gameType) {
    client.selectGame(gameType);
}

function joinQueue(gameType) {
    client.joinQueue(gameType);
}

function getHint() {
    client.getHint();
}

function backToMenu() {
    client.backToMenu();
}