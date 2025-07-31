import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";

export default function MleoRunner() {
  const canvasRef = useRef(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHighScore = localStorage.getItem("mleoHighScore") || 0;
      setHighScore(Number(savedHighScore));
    }
  }, []);

  useEffect(() => {
    if (!gameRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const leoSprite = new Image();
    leoSprite.src = "/images/dog-spritesheet.png";

    const coinImg = new Image();
    coinImg.src = "/images/leo-logo.png";

    const obstacleImg = new Image();
    obstacleImg.src = "/images/obstacle.png";

    const bgImg = new Image();
    bgImg.src = "/images/background.png";

    let leo, gravity, coins, obstacles, frame = 0, frameCount = 0;
    let bgX = 0;
    let running = true;
    let currentScore = 0;

    function initGame() {
      leo = { x: 50, y: 200, width: 70, height: 70, dy: 0, jumping: false };
      gravity = 0.5;
      coins = [];
      obstacles = [];
      frame = 0;
      frameCount = 0;
      currentScore = 0;
      setScore(0);
      setGameOver(false);
    }

    function drawBackground() {
      bgX -= 1.5;
      if (bgX <= -canvas.width) bgX = 0;
      ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    }

    function drawLeo() {
      const sw = leoSprite.width / 4;
      const sh = leoSprite.height;
      ctx.drawImage(leoSprite, frame * sw, 0, sw, sh, leo.x, leo.y, leo.width, leo.height);
      frameCount++;
      if (frameCount % 6 === 0) frame = (frame + 1) % 4;
    }

    function drawCoins() {
      coins.forEach((c) => {
        c.x -= 3;
        ctx.drawImage(coinImg, c.x, c.y, c.size, c.size);
      });
    }

    function drawObstacles() {
      obstacles.forEach((o) => {
        o.x -= 4;
        ctx.drawImage(obstacleImg, o.x, o.y - o.height, o.width, o.height);
      });
    }

    function checkCollision(r1, r2) {
      return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
      );
    }

    function update() {
      if (!running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();

      const ground = canvas.height - 80;

      leo.y += leo.dy;
      if (leo.y + leo.height < ground) leo.dy += gravity;
      else {
        leo.dy = 0;
        leo.jumping = false;
        leo.y = ground - leo.height;
      }

      drawLeo();
      drawCoins();
      drawObstacles();

      if (Math.random() < 0.03)
        coins.push({ x: canvas.width, y: Math.random() * 120 + 120, size: 38 });
      if (Math.random() < 0.012)
        obstacles.push({ x: canvas.width, y: ground, width: 60, height: 60 });

      coins.forEach((c, i) => {
        if (checkCollision(leo, { x: c.x, y: c.y, width: c.size, height: c.size })) {
          coins.splice(i, 1);
          currentScore++;
          setScore(currentScore);
        }
        if (c.x + c.size < 0) coins.splice(i, 1);
      });

      obstacles.forEach((o, i) => {
        const obstacleRect = { x: o.x, y: o.y - o.height, width: o.width, height: o.height };
        if (checkCollision(leo, obstacleRect)) {
          if (leo.y + leo.height - 10 <= obstacleRect.y) {
            leo.dy = -10;
            leo.jumping = true;
          } else {
            running = false;
            setGameRunning(false);
            setGameOver(true);
            if (currentScore > highScore) {
              setHighScore(currentScore);
              localStorage.setItem("mleoHighScore", currentScore);
            }
          }
        }
        if (o.x + o.width < 0) obstacles.splice(i, 1);
      });

      requestAnimationFrame(update);
    }

    function startGame() {
      initGame();
      running = true;
      update();
    }

    function jump() {
      const canvas = canvasRef.current;
      if (leo && !leo.jumping) {
        leo.dy = -10;
        leo.jumping = true;
      }
    }

    function handleKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    }

    document.addEventListener("keydown", handleKey);
    startGame();

    return () => {
      document.removeEventListener("keydown", handleKey);
      running = false;
    };
  }, [gameRunning]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="relative w-full max-w-[95vw] sm:max-w-[960px]">
          <canvas
            ref={canvasRef}
            width={960}
            height={480}
            className="border-4 border-yellow-400 rounded-lg w-full h-auto"
          />

          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/60 px-3 py-1 rounded text-base sm:text-lg font-bold">
            Score: {score} | High Score: {highScore}
          </div>

          {!gameRunning && !gameOver && (
            <button
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-5 py-3 bg-yellow-400 text-black font-bold rounded text-base sm:text-lg"
              onClick={() => setGameRunning(true)}
            >
              Start Game
            </button>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <h2 className="text-4xl sm:text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <button
                className="px-6 py-3 bg-yellow-400 text-black font-bold rounded text-base sm:text-lg"
                onClick={() => setGameRunning(true)}
              >
                Start Again
              </button>
            </div>
          )}

          {gameRunning && (
            <button
              onClick={() => {
                const e = new KeyboardEvent("keydown", { code: "Space" });
                document.dispatchEvent(e);
              }}
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-yellow-400 text-black font-bold rounded sm:hidden"
            >
              Jump
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
