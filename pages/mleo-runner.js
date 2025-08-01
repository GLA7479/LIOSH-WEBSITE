import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import Image from "next/image";

export default function MleoRunner() {
  const canvasRef = useRef(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHighScore = localStorage.getItem("mleoHighScore") || 0;
      setHighScore(Number(savedHighScore));

      const stored = JSON.parse(localStorage.getItem("leaderboard") || "[]");
      setLeaderboard(stored);
    }
  }, []);

  useEffect(() => {
    if (!gameRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const leoSprite = new window.Image();
    leoSprite.src = "/images/dog-spritesheet.png";

    const coinImg = new window.Image();
    coinImg.src = "/images/leo-logo.png";

    const obstacleImg = new window.Image();
    obstacleImg.src = "/images/obstacle.png";

    const bgImg = new window.Image();
    bgImg.src = "/images/game.png";

    let leo, gravity, coins, obstacles, frame = 0, frameCount = 0;
    let bgX = 0;
    let running = true;
    let currentScore = 0;

    function initGame() {
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 1.8 : 1.5;

      leo = { x: 50, y: 200, width: 70 * scale, height: 70 * scale, dy: 0, jumping: false };
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
      if (!bgImg.complete || bgImg.naturalWidth === 0) return;
      bgX -= 1.5;
      if (bgX <= -canvas.width) bgX = 0;
      ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    }

    function drawLeo() {
      if (!leoSprite.complete || leoSprite.naturalWidth === 0) return;
      const sw = leoSprite.width / 4;
      const sh = leoSprite.height;
      ctx.drawImage(leoSprite, frame * sw, 0, sw, sh, leo.x, leo.y, leo.width, leo.height);
      frameCount++;
      if (frameCount % 6 === 0) frame = (frame + 1) % 4;
    }

    function drawCoins() {
      if (!coinImg.complete || coinImg.naturalWidth === 0) return;
      coins.forEach((c) => {
        c.x -= 3;
        ctx.drawImage(coinImg, c.x, c.y, c.size, c.size);
      });
    }

    function drawObstacles() {
      if (!obstacleImg.complete || obstacleImg.naturalWidth === 0) return;
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

      if (Math.random() < 0.012) {
        const isMobile = window.innerWidth < 768;
        const scale = isMobile ? 1.8 : 1.5;

        obstacles.push({
          x: canvas.width,
          y: ground + 30,
          width: 60 * scale * 0.75,
          height: 60 * scale,
        });
      }

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

            const stored = JSON.parse(localStorage.getItem("leaderboard") || "[]");
            let updated = [...stored];

            const playerIndex = updated.findIndex((p) => p.name === playerName);
            if (playerIndex >= 0) {
              if (currentScore > updated[playerIndex].score) {
                updated[playerIndex].score = currentScore;
              }
            } else {
              updated.push({ name: playerName, score: currentScore });
            }

            updated = updated.sort((a, b) => b.score - a.score).slice(0, 20);
            localStorage.setItem("leaderboard", JSON.stringify(updated));
            setLeaderboard(updated);
          }
        }
        if (o.x + o.width < 0) obstacles.splice(i, 1);
      });

      requestAnimationFrame(update);
    }

    function startGame() {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const wrapper = document.getElementById("game-wrapper");

      if (isMobile && wrapper?.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {});
      } else if (isMobile && wrapper?.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      }

      initGame();
      running = true;
      update();
    }

    function jump() {
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
      <div id="game-wrapper" className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative">

        {showIntro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-[999] text-center p-6">
            <Image src="/images/leo-intro.png" alt="Leo" width={220} height={220} className="mb-6 animate-bounce" />
            <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-2">🚀 LIO Runner</h1>
            <p className="text-base sm:text-lg text-gray-200 mb-4">Help Leo collect coins and reach the moon!</p>

            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mb-4 px-4 py-2 rounded text-black w-64 text-center"
            />

            <button
              onClick={() => {
                if (!playerName.trim()) return;
                const stored = JSON.parse(localStorage.getItem("leaderboard") || "[]");
                if (!stored.find((p) => p.name === playerName)) {
                  stored.push({ name: playerName, score: 0 });
                  localStorage.setItem("leaderboard", JSON.stringify(stored.slice(-20)));
                }
                setShowIntro(false);
                setGameRunning(true);
              }}
              disabled={!playerName.trim()}
              className={`px-8 py-4 font-bold rounded-lg text-xl shadow-lg transform transition animate-pulse ${
                playerName.trim()
                  ? "bg-yellow-400 text-black hover:scale-105"
                  : "bg-gray-500 text-gray-300 cursor-not-allowed"
              }`}
            >
              ▶ Start Game
            </button>

            {/* טבלת שיאים */}
            <div className="absolute top-12 right-20 bg-black/50 p-4 rounded-lg w-72 shadow-lg hidden sm:block">
              <h2 className="text-lg font-bold mb-2 text-yellow-300">🏆 Leaderboard</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">#</th>
                    <th className="text-left">Player</th>
                    <th className="text-right">High Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr key={i} className="border-t border-gray-600">
                      <td className="text-left py-1">{i + 1}</td>
                      <td className="text-left py-1">{p.name}</td>
                      <td className="text-right py-1">{p.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-black/50 p-4 rounded-lg w-72 shadow-lg mt-4 block sm:hidden">
              <h2 className="text-lg font-bold mb-2 text-yellow-300">🏆 Leaderboard</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">#</th>
                    <th className="text-left">Player</th>
                    <th className="text-right">High Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr key={i} className="border-t border-gray-600">
                      <td className="text-left py-1">{i + 1}</td>
                      <td className="text-left py-1">{p.name}</td>
                      <td className="text-right py-1">{p.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!showIntro && (
          <>
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/60 px-3 py-1 rounded text-base sm:text-lg font-bold z-[999]">
              Score: {score} | High Score: {highScore}
            </div>

            <div className="relative w-full max-w-[95vw] sm:max-w-[960px]">
              <canvas
                ref={canvasRef}
                width={960}
                height={480}
                className="relative z-0 border-4 border-yellow-400 rounded-lg w-full aspect-[2/1] max-h-[80vh]"
              />

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-[999]">
                  <h2 className="text-4xl sm:text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
                  <button
                    className="px-6 py-3 bg-yellow-400 text-black font-bold rounded text-base sm:text-lg"
                    onClick={() => setGameRunning(true)}
                  >
                    Start Again
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => window.history.back()}
              className="fixed top-4 left-4 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded z-[999]"
            >
              ⬅ Back
            </button>

            {gameRunning && (
              <button
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { code: "Space" });
                  document.dispatchEvent(e);
                }}
                className="fixed bottom-4 right-4 px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg text-lg sm:text-xl z-[999]"
              >
                Jump
              </button>
            )}

            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                } else if (document.webkitFullscreenElement) {
                  document.webkitExitFullscreen();
                }
                setGameRunning(false);
                setGameOver(false);
                setShowIntro(true);
              }}
              className="fixed top-24 right-4 px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg text-lg sm:text-xl z-[999]"
            >
              Exit
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
