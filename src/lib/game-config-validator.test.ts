import { describe, expect, test } from "bun:test";
import { parseGameConfig } from "./game-config-validator";

const baseTheme = {
  primary: "#6366f1",
  secondary: "#818cf8",
  background: "#0f0f23",
  accent: "#f472b6",
};

describe("parseGameConfig — timepass game types", () => {
  test("accepts minesweeper config", () => {
    const config = parseGameConfig({
      type: "minesweeper",
      mode: "solo",
      title: "Mine Hunter",
      description: "Reveal safe tiles.",
      theme: baseTheme,
      settings: { gridSize: 9, mines: 10 },
    });
    expect(config?.type).toBe("minesweeper");
    expect(config?.settings.gridSize).toBe(9);
    expect(config?.settings.mines).toBe(10);
  });

  test("accepts target config", () => {
    const config = parseGameConfig({
      type: "target",
      mode: "solo",
      title: "Target Blitz",
      description: "Tap moving targets.",
      theme: baseTheme,
      settings: { duration: 30, targetSpeed: 2, maxMisses: 5 },
    });
    expect(config?.type).toBe("target");
    expect(config?.settings.duration).toBe(30);
  });

  test("accepts bubble config", () => {
    const config = parseGameConfig({
      type: "bubble",
      mode: "solo",
      title: "Bubble Burst",
      description: "Pop matching bubbles.",
      theme: baseTheme,
      settings: { cols: 8, rows: 10, colors: 5, pops: 25 },
    });
    expect(config?.type).toBe("bubble");
    expect(config?.settings.cols).toBe(8);
  });

  test("accepts pinball config", () => {
    const config = parseGameConfig({
      type: "pinball",
      mode: "solo",
      title: "Neon Pinball",
      description: "Flip and score.",
      theme: baseTheme,
      settings: { bumpers: 5, lives: 3, ballSpeed: 1 },
    });
    expect(config?.type).toBe("pinball");
    expect(config?.settings.bumpers).toBe(5);
  });

  test("rejects unknown game type", () => {
    const config = parseGameConfig({
      type: "chess",
      mode: "solo",
      title: "Chess",
      description: "Not supported.",
      theme: baseTheme,
      settings: {},
    });
    expect(config).toBeNull();
  });

  test("clamps minesweeper grid size", () => {
    const config = parseGameConfig({
      type: "minesweeper",
      mode: "solo",
      title: "Tiny",
      description: "Small grid.",
      theme: baseTheme,
      settings: { gridSize: 3, mines: 99 },
    });
    expect(config?.settings.gridSize).toBe(7);
    expect(config?.settings.mines).toBe(30);
  });
});
