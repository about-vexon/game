// ====== تولید صدا ======
let audioCtx;
function playSound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch (type) {
        case 'click':
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            break;
        case 'win':
            oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.15);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            break;
        case 'lose':
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime + 0.2);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            break;
    }
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// ====== سیستم توقف کامل ======
let currentInterval = null;
let currentTimeout = null;
let currentKeyHandler = null;

function stopAllGames() {
    if (currentInterval) clearInterval(currentInterval);
    if (currentTimeout) clearTimeout(currentTimeout);
    if (currentKeyHandler) document.removeEventListener('keydown', currentKeyHandler);
    
    document.querySelectorAll('.game-card canvas, .game-card .grid, .game-card .area, .game-card .ttt-grid, .game-card .memory-grid, .game-card .g2048-grid, .game-card .whack-grid, .game-card .guess-area, .game-card .color-match-area').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.game-card .play-btn').forEach(btn => {
        btn.style.display = 'block';
    });
    
    currentInterval = null;
    currentTimeout = null;
    currentKeyHandler = null;
}

function closeGame(cardId) {
    stopAllGames();
    
    const card = document.getElementById(cardId);
    if (card) {
        card.querySelectorAll('canvas, .grid, .area, .ttt-grid, .memory-grid, .g2048-grid, .whack-grid, .guess-area, .color-match-area').forEach(el => {
            el.style.display = 'none';
        });
        
        const playBtn = card.querySelector('.play-btn');
        if (playBtn) {
            playBtn.style.display = 'block';
        }
    }
}

function startGame(cardId) {
    stopAllGames();
    document.querySelector(`#${cardId} .play-btn`).style.display = 'none';
}

// ====== ساعت ======
const clockDisplay = document.querySelector('.clock-display');
setInterval(() => {
    const now = new Date();
    clockDisplay.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}, 1000);

// ====== فلاپی برد ======
function playFlappy() {
    startGame('flappy-card');
    const canvas = document.getElementById('flappy-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    let birdY = 125;
    let velocity = 0;
    let gravity = 0.5;
    let pipes = [];
    let score = 0;
    let gameOver = false;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(50, birdY, 20, 20);
        ctx.fillStyle = '#38bdf8';
        pipes.forEach(pipe => {
            ctx.fillRect(pipe.x, 0, 30, pipe.top);
            ctx.fillRect(pipe.x, pipe.bottom, 30, canvas.height - pipe.bottom);
        });
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(score, canvas.width / 2, 30);
    }

    function update() {
        if (gameOver) return;
        velocity += gravity;
        birdY += velocity;
        
        if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 100) {
            const gap = 100;
            const top = Math.random() * (canvas.height - gap);
            pipes.push({ x: canvas.width, top: top, bottom: top + gap });
        }
        
        pipes.forEach(pipe => {
            pipe.x -= 2;
            if (pipe.x < -30) {
                pipes.shift();
                score++;
                playSound('win');
            }
        });
        
        if (birdY < 0 || birdY > canvas.height) {
            gameOver = true;
            playSound('lose');
            setTimeout(() => closeGame('flappy-card'), 2000);
            clearInterval(currentInterval);
        }
        
        pipes.forEach(pipe => {
            if (birdY < pipe.top || birdY > pipe.bottom) {
                if (50 + 20 > pipe.x && 50 < pipe.x + 30) {
                    gameOver = true;
                    playSound('lose');
                    setTimeout(() => closeGame('flappy-card'), 2000);
                    clearInterval(currentInterval);
                }
            }
        });
        
        draw();
    }

    function restartGame() {
        birdY = 125;
        velocity = 0;
        pipes = [];
        score = 0;
        gameOver = false;
        clearInterval(currentInterval);
        currentInterval = setInterval(update, 30);
    }

    function jump() {
        if (gameOver) {
            restartGame();
        }
        velocity = -8;
    }
    
    // حرکت با کلیک و لمس
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    }, { passive: false });
    
    currentKeyHandler = (e) => {
        if (e.key === ' ') jump();
    };
    document.addEventListener('keydown', currentKeyHandler);
    
    if (currentInterval) clearInterval(currentInterval);
    currentInterval = setInterval(update, 30);
}

// ====== Space Invaders (اتوماتیک با Random Spawn) ======
function playSpaceInvaders() {
    startGame('space-card');
    const canvas = document.getElementById('space-invaders-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('space-score');
    
    let playerX = 90;
    let playerBullets = [];
    let enemyBullets = [];
    let enemies = [];
    let score = 0;
    let gameOver = false;
    
    // تولید دشمن‌های تصادفی
    function spawnEnemy() {
        enemies.push({
            x: Math.random() * 160 + 10,
            y: 10,
            alive: true,
            speed: 0.3 + Math.random() * 0.3
        });
    }
    
    // تولید 3 دشمن اولیه
    for (let i = 0; i < 5; i++) {
        spawnEnemy();
    }
    
    // سفینه به صورت خودکار شلیک می‌کند
    currentInterval = setInterval(() => {
        if (gameOver) return;
        playerBullets.push({ x: playerX + 13, y: 270 });
    }, 500); // هر 0.5 ثانیه شلیک خودکار
    
    // دشمن‌ها به صورت تصادفی ظاهر می‌شوند و شلیک می‌کنند
    currentTimeout = setInterval(() => {
        if (gameOver) return;
        spawnEnemy();
        
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({
                x: randomEnemy.x + 10,
                y: randomEnemy.y + 20
            });
        }
    }, 1500); // هر 1.5 ثانیه دشمن جدید و شلیک
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(playerX + 15, 270);
        ctx.lineTo(playerX, 285);
        ctx.lineTo(playerX + 30, 285);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        playerBullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, 4, 10);
        });
        ctx.fillStyle = '#ef4444';
        enemyBullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, 4, 10);
        });
        enemies.forEach(enemy => {
            if (enemy.alive) {
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.moveTo(enemy.x + 10, enemy.y + 20);
                ctx.lineTo(enemy.x, enemy.y);
                ctx.lineTo(enemy.x + 20, enemy.y);
                ctx.closePath();
                ctx.fill();
            }
        });
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 10, 15);
        scoreEl.textContent = 'Score: ' + score;
    }
    
    function update() {
        if (gameOver) return;
        playerBullets.forEach(bullet => { bullet.y -= 10; });
        playerBullets = playerBullets.filter(b => b.y > 0);
        enemyBullets.forEach(bullet => { bullet.y += 5; });
        enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
        enemies.forEach(enemy => {
            if (enemy.alive) {
                playerBullets.forEach(bullet => {
                    if (bullet.x > enemy.x && bullet.x < enemy.x + 20 && bullet.y > enemy.y && bullet.y < enemy.y + 20) {
                        enemy.alive = false;
                        playerBullets = playerBullets.filter(b => b !== bullet);
                        score++;
                        playSound('win');
                    }
                });
            }
        });
        enemyBullets.forEach(bullet => {
            if (bullet.x > playerX && bullet.x < playerX + 30 && bullet.y > 270 && bullet.y < 285) {
                gameOver = true;
                playSound('lose');
                ctx.fillStyle = '#ef4444';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
                setTimeout(() => closeGame('space-card'), 2000);
                clearInterval(currentInterval);
                clearInterval(currentTimeout);
            }
        });
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += enemy.speed;
                if (enemy.y > 240) {
                    gameOver = true;
                    playSound('lose');
                    ctx.fillStyle = '#ef4444';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
                    setTimeout(() => closeGame('space-card'), 2000);
                    clearInterval(currentInterval);
                    clearInterval(currentTimeout);
                }
            }
        });
        if (enemies.every(e => !e.alive)) {
            gameOver = true;
            playSound('win');
            ctx.fillStyle = '#38bdf8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 You Won!', canvas.width / 2, canvas.height / 2);
            setTimeout(() => closeGame('space-card'), 2000);
            clearInterval(currentInterval);
            clearInterval(currentTimeout);
            return;
        }
        draw();
    }
    
    // حرکت با لمس (موبایل)
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        playerX = Math.max(0, Math.min(170, touchX - 15));
    }, { passive: false });
    
    // حرکت با موس (کامپیوتر)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        playerX = e.clientX - rect.left - 15;
    });
    
    draw();
    currentInterval = setInterval(update, 30);
}

// ====== مینی‌گیم حافظه ======
function playMemory() {
    startGame('memory-card');
    const memoryGrid = document.getElementById('memory-grid');
    memoryGrid.style.display = 'grid';
    const icons = ['🎮', '👾', '🕹️', '💾', '🚀', '⭐', '🎮', '👾', '🕹️', '💾', '🚀', '⭐'];
    icons.sort(() => Math.random() - 0.5);
    
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let startTime = Date.now();
    
    const maxMoves = 25;
    const maxTime = 60;
    
    const previousInfos = memoryGrid.parentElement.querySelectorAll('.memory-score');
    previousInfos.forEach(el => el.remove());
    
    const infoEl = document.createElement('p');
    infoEl.classList.add('memory-score');
    infoEl.style.cssText = 'font-size:10px; color:#38bdf8; text-align:center; margin-top:10px;';
    infoEl.textContent = 'Moves: 0/25 | Time: 0/60s';
    memoryGrid.parentElement.appendChild(infoEl);
    
    currentInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        infoEl.textContent = `Moves: ${moves}/${maxMoves} | Time: ${elapsed}/${maxTime}s`;
        if (elapsed >= maxTime) {
            clearInterval(currentInterval);
            infoEl.textContent = '⏰ Time is up! Game Over!';
            playSound('lose');
            setTimeout(() => closeGame('memory-card'), 2000);
            return;
        }
    }, 1000);
    
    memoryGrid.innerHTML = '';
    icons.forEach((icon) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.icon = icon;
        card.addEventListener('click', () => {
            if (card.classList.contains('flipped') || flippedCards.length === 2) return;
            card.classList.add('flipped');
            card.textContent = icon;
            playSound('click');
            flippedCards.push(card);
            moves++;
            if (flippedCards.length === 2) {
                setTimeout(() => {
                    const [first, second] = flippedCards;
                    if (first.dataset.icon === second.dataset.icon) {
                        matchedPairs++;
                        playSound('win');
                        if (matchedPairs === 6) {
                            clearInterval(currentInterval);
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            infoEl.textContent = `🏆 You Won! Moves: ${moves} | Time: ${elapsed}s`;
                            setTimeout(() => closeGame('memory-card'), 2000);
                        }
                    } else {
                        first.classList.remove('flipped');
                        first.textContent = '';
                        second.classList.remove('flipped');
                        second.textContent = '';
                    }
                    flippedCards = [];
                }, 500);
            }
            if (moves >= maxMoves && matchedPairs < 6) {
                clearInterval(currentInterval);
                infoEl.textContent = '❌ No moves left! Game Over!';
                playSound('lose');
                setTimeout(() => closeGame('memory-card'), 2000);
            }
        });
        memoryGrid.appendChild(card);
    });
}

// ====== مینی‌گیم دوز ======
function playTicTacToe() {
    startGame('tictactoe-card');
    const tttGrid = document.getElementById('ttt-grid');
    tttGrid.style.display = 'grid';
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameOver = false;
    let isAiThinking = false;
    let aiTimeout;
    
    function aiMove() {
        if (Math.random() < 0.3) {
            const empty = board.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);
            if (empty.length > 0) {
                const randomIndex = empty[Math.floor(Math.random() * empty.length)];
                board[randomIndex] = 'O';
                return;
            }
        }
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                if (checkWinner(board, 'O')) return;
                board[i] = '';
            }
        }
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                if (checkWinner(board, 'X')) {
                    board[i] = 'O';
                    return;
                }
                board[i] = '';
            }
        }
        if (board[4] === '') {
            board[4] = 'O';
            return;
        }
        const corners = [0, 2, 6, 8];
        for (let i = 0; i < corners.length; i++) {
            if (board[corners[i]] === '') {
                board[corners[i]] = 'O';
                return;
            }
        }
        const empty = board.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);
        if (empty.length > 0) {
            const randomIndex = empty[Math.floor(Math.random() * empty.length)];
            board[randomIndex] = 'O';
        }
    }

    function checkWinner(b, player) {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return lines.some(line => b[line[0]] === player && b[line[1]] === player && b[line[2]] === player);
    }

    function updateBoard() {
        tttGrid.innerHTML = '';
        board.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('ttt-cell');
            cellDiv.textContent = cell;
            cellDiv.addEventListener('click', () => {
                if (isAiThinking || gameOver || board[index] !== '') return;
                board[index] = currentPlayer;
                cellDiv.textContent = currentPlayer;
                playSound('click');
                if (checkWinner(board, 'X')) {
                    tttGrid.innerHTML = `<div style="text-align:center; color:#38bdf8; font-size:12px; grid-column: span 3;">🏆 You Won!</div>`;
                    gameOver = true;
                    playSound('win');
                    setTimeout(() => closeGame('tictactoe-card'), 2000);
                    return;
                }
                if (!gameOver && board.every(c => c !== '')) {
                    tttGrid.innerHTML = `<div style="text-align:center; color:#38bdf8; font-size:12px; grid-column: span 3;">🤝 Draw!</div>`;
                    gameOver = true;
                    playSound('lose');
                    setTimeout(() => closeGame('tictactoe-card'), 2000);
                    return;
                }
                isAiThinking = true;
                if (aiTimeout) clearTimeout(aiTimeout);
                aiTimeout = setTimeout(() => {
                    aiMove();
                    updateBoard();
                    isAiThinking = false;
                    if (checkWinner(board, 'O')) {
                        tttGrid.innerHTML = `<div style="text-align:center; color:#ef4444; font-size:12px; grid-column: span 3;">🤖 AI Won!</div>`;
                        gameOver = true;
                        playSound('lose');
                        setTimeout(() => closeGame('tictactoe-card'), 2000);
                        return;
                    }
                    if (board.every(c => c !== '')) {
                        tttGrid.innerHTML = `<div style="text-align:center; color:#38bdf8; font-size:12px; grid-column: span 3;">🤝 Draw!</div>`;
                        gameOver = true;
                        playSound('lose');
                        setTimeout(() => closeGame('tictactoe-card'), 2000);
                    }
                }, 700);
            });
            tttGrid.appendChild(cellDiv);
        });
    }

    updateBoard();
}

// ====== تطبیق رنگ ======
function playColorMatch() {
    startGame('color-match-card');
    const area = document.getElementById('color-match-area');
    area.style.display = 'block';
    const wordEl = document.getElementById('color-word');
    const buttonsEl = document.getElementById('color-buttons');
    const resultEl = document.getElementById('color-result');
    const colors = ['red', 'blue', 'green', 'yellow'];
    const colorMap = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' };
    let score = 0;
    let round = 0;
    const maxRounds = 10;
    
    function newRound() {
        round++;
        if (round > maxRounds) {
            resultEl.textContent = `🏆 Final Score: ${score}`;
            playSound('win');
            setTimeout(() => closeGame('color-match-card'), 2000);
            return;
        }
        const colorName = colors[Math.floor(Math.random() * colors.length)];
        const fontColor = colors[Math.floor(Math.random() * colors.length)];
        wordEl.textContent = colorName;
        wordEl.style.color = colorMap[fontColor];
        buttonsEl.innerHTML = '';
        const shuffled = [...colors].sort(() => Math.random() - 0.5);
        shuffled.forEach(c => {
            const btn = document.createElement('button');
            btn.classList.add('color-btn');
            btn.style.backgroundColor = colorMap[c];
            btn.addEventListener('click', () => {
                if (c === colorName) {
                    score++;
                    resultEl.textContent = `Score: ${score}`;
                    playSound('win');
                    newRound();
                } else {
                    score -= 2;
                    resultEl.textContent = `Wrong! Score: ${score}`;
                    playSound('lose');
                    newRound();
                }
            });
            buttonsEl.appendChild(btn);
        });
    }
    newRound();
}

// ====== بریک بریکر ======
function playBrickBreaker() {
    startGame('brick-breaker-card');
    const canvas = document.getElementById('brick-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    let ballX = 100, ballY = 150;
    let angle = (Math.random() * 60 - 30) * (Math.PI / 180);
    let ballSpeed = 4;
    let ballSpeedX = ballSpeed * Math.sin(angle);
    let ballSpeedY = -ballSpeed * Math.cos(angle);
    let paddleX = 80;
    let paddleWidth = 60;
    let bricks = [];
    let score = 0;
    let gameOver = false;
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            bricks.push({ x: col * 25, y: row * 20, width: 20, height: 15, active: true, color: `hsl(${row * 20}, 70%, 50%)` });
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(paddleX, 180, paddleWidth, 10);
        bricks.forEach(brick => {
            if (brick.active) {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            }
        });
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 10, 20);
    }
    
    function update() {
        if (gameOver) return;
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        if (ballX < 0 || ballX > canvas.width) ballSpeedX *= -1;
        if (ballY < 0) ballSpeedY *= -1;
        if (ballY > 180 && ballY < 190 && ballX > paddleX && ballX < paddleX + paddleWidth) {
            let hitPos = (ballX - paddleX) / paddleWidth;
            let angle = (hitPos - 0.5) * 60 * (Math.PI / 180);
            ballSpeedX = ballSpeed * Math.sin(angle);
            ballSpeedY = -ballSpeed * Math.cos(angle);
            playSound('click');
        }
        bricks.forEach(brick => {
            if (brick.active && ballX > brick.x && ballX < brick.x + brick.width && ballY > brick.y && ballY < brick.y + brick.height) {
                brick.active = false;
                score++;
                playSound('win');
                ballSpeedY *= -1;
            }
        });
        if (bricks.every(b => !b.active)) {
            gameOver = true;
            playSound('win');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 You Won!', canvas.width / 2, canvas.height / 2);
            setTimeout(() => closeGame('brick-breaker-card'), 2000);
            clearInterval(currentInterval);
            return;
        }
        if (ballY > canvas.height) {
            gameOver = true;
            playSound('lose');
            setTimeout(() => closeGame('brick-breaker-card'), 2000);
        }
        draw();
    }
    
    // حرکت با لمس (موبایل)
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, touchX - paddleWidth / 2));
    }, { passive: false });
    
    // حرکت با موس (کامپیوتر)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        paddleX = e.clientX - rect.left - paddleWidth / 2;
    });
    
    // وصل کردن تایمر به currentInterval تا با دکمه Back بسته شود
    if (currentInterval) clearInterval(currentInterval);
    currentInterval = setInterval(update, 30);

    
    // حرکت با لمس (موبایل)
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, touchX - paddleWidth / 2));
    }, { passive: false });
    
    // حرکت با موس (کامپیوتر)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        paddleX = e.clientX - rect.left - paddleWidth / 2;
    });
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 30);
}

// ====== کوبیدن موش ======
function playWhack() {
    startGame('whack-card');
    const whackGrid = document.getElementById('whack-grid');
    whackGrid.style.display = 'grid';
    let score = 0;
    let gameInterval;
    
    whackGrid.innerHTML = '';
    const holes = [];
    const scoreEl = document.createElement('p');
    scoreEl.classList.add('whack-score');
    scoreEl.textContent = 'Score: 0';
    whackGrid.parentElement.appendChild(scoreEl);
    
    for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.classList.add('whack-hole');
        hole.addEventListener('click', () => {
            if (hole.classList.contains('active')) {
                score++;
                scoreEl.textContent = 'Score: ' + score;
                playSound('win');
                hole.classList.remove('active');
            } else if (hole.classList.contains('danger')) {
                playSound('lose');
                scoreEl.textContent = '💀 Game Over! Score: ' + score;
                clearInterval(gameInterval);
                setTimeout(() => closeGame('whack-card'), 2000);
            } else {
                playSound('lose');
            }
        });
        whackGrid.appendChild(hole);
        holes.push(hole);
    }
    
    function showMole() {
        holes.forEach(h => h.classList.remove('active', 'danger'));
        const randomHole = holes[Math.floor(Math.random() * holes.length)];
        if (Math.random() < 0.8) {
            randomHole.classList.add('active');
        } else {
            randomHole.classList.add('danger');
        }
    }
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(showMole, 800);
    setTimeout(() => {
        clearInterval(gameInterval);
        closeGame('whack-card');
    }, 20000);
}

// ====== مینی‌گیم حدس عدد ======
let targetNumber;
function playGuess() {
    startGame('guess-card');
    const guessArea = document.getElementById('guess-area');
    guessArea.style.display = 'flex';
    targetNumber = Math.floor(Math.random() * 100) + 1;
    document.getElementById('guess-result').textContent = '';
}

function checkGuess() {
    const input = document.getElementById('guess-input');
    const result = document.getElementById('guess-result');
    const guess = parseInt(input.value);
    if (isNaN(guess)) { result.textContent = 'Enter a number!'; return; }
    if (guess === targetNumber) {
        result.textContent = '🎉 Correct!';
        playSound('win');
        setTimeout(() => closeGame('guess-card'), 2000);
    } else if (guess < targetNumber) {
        result.textContent = 'Higher!';
        playSound('lose');
    } else {
        result.textContent = 'Lower!';
        playSound('lose');
    }
}

// ====== مینی‌گیم نقاشی (با پشتیبانی کامل لمس) ======
function playPaint() {
    startGame('paint-card');
    const canvas = document.getElementById('paint-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let drawing = false;
    
    // رویدادهای لمس (موبایل)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        drawing = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (drawing) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            ctx.stroke();
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        drawing = false;
    }, { passive: false });
    
    // رویدادهای موس (کامپیوتر)
    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
    });
    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });
}
