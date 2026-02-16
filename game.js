// Snake-Konfiguration
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BASE_TICK_MS = 160;
const SPEED_STEP_MS = 12;
const SPEEDUP_EVERY_POINTS = 5;
const MIN_TICK_MS = 70;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let tickMs = BASE_TICK_MS;
let isRunning = false;
let isPaused = false;
let gameLoopId = null;

// Initialisiert/Resettet das komplette Spiel.
function initGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  tickMs = BASE_TICK_MS;
  isRunning = true;
  isPaused = false;

  scoreEl.textContent = String(score);
  setStatus("Läuft");

  spawnFood();
  draw();

  if (gameLoopId !== null) {
    clearInterval(gameLoopId);
  }
  gameLoopId = setInterval(update, tickMs);
}

// Spawnt Food zufällig auf einem freien Feld (nicht auf der Schlange).
function spawnFood() {
  const freeCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const occupied = snake.some((segment) => segment.x === x && segment.y === y);
      if (!occupied) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * freeCells.length);
  food = freeCells[randomIndex];
}

// Haupt-Update: Bewegung, Fressen, Kollisionen, Speed-Anpassung.
function update() {
  if (!isRunning || isPaused) {
    return;
  }

  direction = { ...nextDirection };

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  snake.unshift(newHead);

  const ateFood = newHead.x === food.x && newHead.y === food.y;
  if (ateFood) {
    score += 1;
    scoreEl.textContent = String(score);
    spawnFood();
    adjustSpeed();
  } else {
    snake.pop();
  }

  if (checkCollisions()) {
    gameOver();
    return;
  }

  draw();
}

// Zeichnet Spielfeld, Snake und Food in Canvas.
function draw() {
  // Hintergrund
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Optionales Grid
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }

  // Food
  ctx.fillStyle = "#ff4d4d";
  drawCell(food.x, food.y, 2);

  // Snake (Kopf leicht anders)
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#3adb76" : "#2ac766";
    drawCell(segment.x, segment.y, 2);
  });
}

// Prüft Wand- und Selbstkollision.
function checkCollisions() {
  const head = snake[0];

  const hitWall =
    head.x < 0 ||
    head.y < 0 ||
    head.x >= GRID_SIZE ||
    head.y >= GRID_SIZE;

  if (hitWall) {
    return true;
  }

  const hitSelf = snake
    .slice(1)
    .some((segment) => segment.x === head.x && segment.y === head.y);

  return hitSelf;
}

// Eingaben: Pfeile + WASD + Pause per Space.
function handleInput(event) {
  const key = event.key;

  if (key === " ") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (!isRunning || isPaused) {
    return;
  }

  const goingUp = direction.y === -1;
  const goingDown = direction.y === 1;
  const goingLeft = direction.x === -1;
  const goingRight = direction.x === 1;

  if ((key === "ArrowUp" || key === "w" || key === "W") && !goingDown) {
    nextDirection = { x: 0, y: -1 };
  } else if (
    (key === "ArrowDown" || key === "s" || key === "S") &&
    !goingUp
  ) {
    nextDirection = { x: 0, y: 1 };
  } else if (
    (key === "ArrowLeft" || key === "a" || key === "A") &&
    !goingRight
  ) {
    nextDirection = { x: -1, y: 0 };
  } else if (
    (key === "ArrowRight" || key === "d" || key === "D") &&
    !goingLeft
  ) {
    nextDirection = { x: 1, y: 0 };
  }
}

function drawCell(x, y, padding = 0) {
  ctx.fillRect(
    x * CELL_SIZE + padding,
    y * CELL_SIZE + padding,
    CELL_SIZE - padding * 2,
    CELL_SIZE - padding * 2
  );
}

function adjustSpeed() {
  if (score > 0 && score % SPEEDUP_EVERY_POINTS === 0) {
    tickMs = Math.max(MIN_TICK_MS, tickMs - SPEED_STEP_MS);
    clearInterval(gameLoopId);
    gameLoopId = setInterval(update, tickMs);
  }
}

function togglePause() {
  if (!isRunning) {
    return;
  }
  isPaused = !isPaused;
  setStatus(isPaused ? "Pausiert" : "Läuft");
}

function gameOver() {
  isRunning = false;
  isPaused = false;
  setStatus("Game Over");
  clearInterval(gameLoopId);
  gameLoopId = null;
}

function setStatus(text) {
  statusEl.textContent = text;
}

startBtn.addEventListener("click", initGame);
document.addEventListener("keydown", handleInput);

// Initiales leeres Rendering vor dem ersten Start.
draw();
