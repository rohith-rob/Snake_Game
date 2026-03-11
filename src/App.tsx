import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Point>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food spawned on snake body
      const onSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + nextDirection.x,
        y: head.y + nextDirection.y,
      };

      // Update current direction to the one we just used
      setDirection(nextDirection);

      // Check collisions
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE ||
        prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
        setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, nextDirection, generateFood]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, moveSnake, speed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const handleControl = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!gameStarted && !gameOver) setGameStarted(true);
    switch (dir) {
      case 'up': if (direction.y === 0) setNextDirection({ x: 0, y: -1 }); break;
      case 'down': if (direction.y === 0) setNextDirection({ x: 0, y: 1 }); break;
      case 'left': if (direction.x === 0) setNextDirection({ x: -1, y: 0 }); break;
      case 'right': if (direction.x === 0) setNextDirection({ x: 1, y: 0 }); break;
    }
  };

  return (
    <div className="game-container font-mono">
      {/* Header */}
      <div className="w-full max-w-[400px] flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Snake</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Classic Edition</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-zinc-400 text-xs mb-1">
            <Trophy size={12} />
            <span>Best: {highScore}</span>
          </div>
          <div className="text-3xl font-bold leading-none">{score.toString().padStart(4, '0')}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative group">
        <div 
          className="grid bg-zinc-900/50 border-4 border-zinc-800 rounded-lg overflow-hidden shadow-2xl shadow-emerald-500/5"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(90vw, 400px)',
            aspectRatio: '1/1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnakeHead = snake[0].x === x && snake[0].y === y;
            const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`relative transition-colors duration-150 ${
                  isSnakeHead 
                    ? 'bg-emerald-400 z-10 rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                    : isSnakeBody 
                    ? 'bg-emerald-600/80 rounded-sm' 
                    : isFood 
                    ? 'bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                    : 'border-[0.5px] border-zinc-800/30'
                }`}
              />
            );
          })}
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {!gameStarted && !gameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg z-20"
            >
              <button
                onClick={() => setGameStarted(true)}
                className="group flex flex-col items-center gap-4 hover:scale-110 transition-transform"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
                  <Play className="text-black fill-current ml-1" size={32} />
                </div>
                <span className="text-sm font-bold tracking-[0.2em] uppercase text-emerald-500">Start Game</span>
              </button>
            </motion.div>
          )}

          {gameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/40 backdrop-blur-md rounded-lg z-20 border-2 border-rose-500/20"
            >
              <h2 className="text-4xl font-black text-rose-500 mb-2 uppercase italic tracking-tighter">Game Over</h2>
              <p className="text-zinc-400 mb-8 uppercase text-[10px] tracking-[0.3em]">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors uppercase text-xs tracking-widest"
              >
                <RotateCcw size={16} />
                Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      <div className="mt-10 grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button 
          onClick={() => handleControl('up')}
          className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-700 active:scale-95 transition-all"
        >
          <ArrowUp size={24} />
        </button>
        <div />
        <button 
          onClick={() => handleControl('left')}
          className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={() => handleControl('down')}
          className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-700 active:scale-95 transition-all"
        >
          <ArrowDown size={24} />
        </button>
        <button 
          onClick={() => handleControl('right')}
          className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-700 active:scale-95 transition-all"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center hidden md:block">
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
          Use <span className="text-zinc-300 font-bold">Arrow Keys</span> to control
        </p>
      </div>
    </div>
  );
}
