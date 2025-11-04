import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState({
    health: 100,
    maxHealth: 100,
    level: 1,
    score: 0,
    gold: 0,
    keys: 0,
    currentFloor: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas, ctx, (state) => {
      setGameState(state);
    });

    gameEngineRef.current.start();

    return () => {
      gameEngineRef.current?.stop();
    };
  }, []);

  const handleRestart = () => {
    gameEngineRef.current?.restart();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      fontFamily: "'Press Start 2P', cursive",
      padding: '20px',
    }}>
      <h1 style={{
        fontSize: '24px',
        marginBottom: '20px',
        textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
        color: '#ffd700',
      }}>
        🗡️ DUNGEON CRAWLER 🗡️
      </h1>
      
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
        fontSize: '12px',
      }}>
        <div>❤️ HP: {gameState.health}/{gameState.maxHealth}</div>
        <div>⭐ Level: {gameState.level}</div>
        <div>🏆 Score: {gameState.score}</div>
        <div>💰 Gold: {gameState.gold}</div>
        <div>🔑 Keys: {gameState.keys}</div>
        <div>🏰 Floor: {gameState.currentFloor}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '4px solid #ffd700',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
          imageRendering: 'pixelated',
          backgroundColor: '#000',
        }}
      />

      <div style={{
        marginTop: '20px',
        fontSize: '10px',
        textAlign: 'center',
        maxWidth: '800px',
        lineHeight: '1.6',
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Controls:</strong> WASD/Arrows - Move | SPACE - Attack | E - Interact | R - Restart
        </div>
        <div style={{ opacity: 0.7 }}>
          Explore dungeons, fight enemies, collect treasures! Find the stairs to descend deeper! 🎮
        </div>
      </div>

      <button
        onClick={handleRestart}
        style={{
          marginTop: '15px',
          padding: '10px 20px',
          fontSize: '12px',
          fontFamily: "'Press Start 2P', cursive",
          background: '#ff6b6b',
          color: '#fff',
          border: '3px solid #fff',
          cursor: 'pointer',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🔄 RESTART
      </button>
    </div>
  );
};
