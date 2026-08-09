import type { GameType } from "@/types/game";
import type { GameDeps, GameModule } from "@/components/game-canvas/types";
import { createPongGame } from "@/components/game-canvas/games/pong";
import { createSnakeGame } from "@/components/game-canvas/games/snake";
import { createBreakoutGame } from "@/components/game-canvas/games/breakout";
import { createRunnerGame } from "@/components/game-canvas/games/runner";
import { createClickerGame } from "@/components/game-canvas/games/clicker";
import { createFlappyGame } from "@/components/game-canvas/games/flappy";
import { createShooterGame } from "@/components/game-canvas/games/shooter";
import { createTetrisGame } from "@/components/game-canvas/games/tetris";
import { createMemoryGame } from "@/components/game-canvas/games/memory";
import { createWhackGame } from "@/components/game-canvas/games/whack";
import { createDodgeGame } from "@/components/game-canvas/games/dodge";
import { createSlideGame } from "@/components/game-canvas/games/slide";
import { createCatchGame } from "@/components/game-canvas/games/catch";
import { createCrossGame } from "@/components/game-canvas/games/cross";
import { createStackGame } from "@/components/game-canvas/games/stack";
import { createSimonGame } from "@/components/game-canvas/games/simon";
import { createReactionGame } from "@/components/game-canvas/games/reaction";
import { createMinesweeperGame } from "@/components/game-canvas/games/minesweeper";
import { createTargetGame } from "@/components/game-canvas/games/target";
import { createBubbleGame } from "@/components/game-canvas/games/bubble";
import { createPinballGame } from "@/components/game-canvas/games/pinball";

const factories: Record<GameType, (deps: GameDeps) => GameModule> = {
  pong: createPongGame,
  snake: createSnakeGame,
  breakout: createBreakoutGame,
  runner: createRunnerGame,
  clicker: createClickerGame,
  flappy: createFlappyGame,
  shooter: createShooterGame,
  tetris: createTetrisGame,
  memory: createMemoryGame,
  whack: createWhackGame,
  dodge: createDodgeGame,
  slide: createSlideGame,
  catch: createCatchGame,
  cross: createCrossGame,
  stack: createStackGame,
  simon: createSimonGame,
  reaction: createReactionGame,
  minesweeper: createMinesweeperGame,
  target: createTargetGame,
  bubble: createBubbleGame,
  pinball: createPinballGame,
};

export function createGameModule(type: GameType, deps: GameDeps): GameModule {
  return factories[type](deps);
}
