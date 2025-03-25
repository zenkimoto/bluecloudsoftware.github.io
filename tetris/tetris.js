// Tetris game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
];

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('start-button');
        this.gameContainer = document.getElementById('game-container');
        this.controlsElement = document.getElementById('controls');
        
        // Initialize audio
        this.backgroundMusic = new Audio('tetris-theme.mp3');
        this.backgroundMusic.loop = true;
        
        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameStarted = false;
        
        // Add start button listener
        this.startButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        this.startButton.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        this.scoreElement.style.display = 'block';
        this.controlsElement.style.display = 'block';
        
        this.init();
        
        // Start background music after user interaction
        this.backgroundMusic.play().catch(error => {
            console.log("Audio playback failed:", error);
        });
    }

    init() {
        // Set canvas size
        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;
        this.nextCanvas.width = 4 * BLOCK_SIZE;
        this.nextCanvas.height = 4 * BLOCK_SIZE;
        
        // Scale blocks
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
        this.nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);
        
        // Create first piece
        this.createNewPiece();
        
        // Start game loop
        this.gameLoop();
        
        // Add keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    createNewPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        this.currentPiece = {
            shape: SHAPES[shapeIndex],
            color: COLORS[shapeIndex],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
            y: 0
        };
        
        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }

    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = previousShape;
        }
    }

    moveDown() {
        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.clearLines();
            this.createNewPiece();
        }
    }

    moveLeft() {
        this.currentPiece.x--;
        if (this.checkCollision()) {
            this.currentPiece.x++;
        }
    }

    moveRight() {
        this.currentPiece.x++;
        if (this.checkCollision()) {
            this.currentPiece.x--;
        }
    }

    drop() {
        while (!this.checkCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
    }

    checkCollision() {
        return this.currentPiece.shape.some((row, dy) =>
            row.some((value, dx) => {
                if (!value) return false;
                const newX = this.currentPiece.x + dx;
                const newY = this.currentPiece.y + dy;
                return (
                    newX < 0 ||
                    newX >= COLS ||
                    newY >= ROWS ||
                    (newY >= 0 && this.grid[newY][newX])
                );
            })
        );
    }

    mergePiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.grid[y + this.currentPiece.y][x + this.currentPiece.x] = this.currentPiece.color;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, 1, 1);
                }
            });
        });
        
        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.ctx.fillRect(
                            x + this.currentPiece.x,
                            y + this.currentPiece.y,
                            1,
                            1
                        );
                    }
                });
            });
        }
    }

    handleKeyPress(event) {
        if (this.gameOver) return;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                this.moveLeft();
                break;
            case 39: // Right arrow
                this.moveRight();
                break;
            case 40: // Down arrow
                this.moveDown();
                break;
            case 38: // Up arrow
                this.rotate();
                break;
            case 32: // Space
                this.drop();
                break;
        }
        this.draw();
    }

    gameLoop() {
        if (!this.gameOver) {
            this.moveDown();
            this.draw();
            setTimeout(() => this.gameLoop(), 1000);
        } else {
            // Pause music when game is over
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            
            alert('Game Over! Score: ' + this.score);
            this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            this.score = 0;
            this.scoreElement.textContent = 'Score: 0';
            this.gameOver = false;
            
            // Show start button again
            this.startButton.style.display = 'block';
            this.gameStarted = false;
            this.gameContainer.style.display = 'none';
            this.scoreElement.style.display = 'none';
            this.controlsElement.style.display = 'none';
        }
    }
}

// Start the game when the page loads
window.onload = () => {
    new Tetris();
}; 