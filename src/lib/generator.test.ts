import { describe, expect, test } from "bun:test";
import { generateGameFromPrompt } from "./generator";

describe("generateGameFromPrompt — timepass game types", () => {
  test("detects minesweeper from prompt", () => {
    const config = generateGameFromPrompt("A classic minesweeper puzzle with hidden mines");
    expect(config.type).toBe("minesweeper");
    expect(config.settings.gridSize).toBeDefined();
  });

  test("detects target from prompt", () => {
    const config = generateGameFromPrompt("A target shooting gallery with fast targets");
    expect(config.type).toBe("target");
    expect(config.settings.duration).toBeDefined();
  });

  test("detects bubble from prompt", () => {
    const config = generateGameFromPrompt("A bubble pop game with colored bubbles");
    expect(config.type).toBe("bubble");
    expect(config.settings.cols).toBeDefined();
  });

  test("detects pinball from prompt", () => {
    const config = generateGameFromPrompt("A pinball arcade game with flippers");
    expect(config.type).toBe("pinball");
    expect(config.settings.bumpers).toBeDefined();
  });
});
