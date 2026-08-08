import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = fs.readFileSync(path.join(root, "src/components/GameCanvas.tsx"), "utf8");

const games = [
  { name: "pong", start: "// ─── PONG ───", extras: ["resetBall"] },
  { name: "snake", start: "// ─── SNAKE ───" },
  { name: "breakout", start: "// ─── BREAKOUT ───" },
  { name: "runner", start: "// ─── RUNNER ───" },
  { name: "clicker", start: "// ─── CLICKER ───", extras: ["handleClickerKeys"] },
  { name: "flappy", start: "// ─── FLAPPY ───" },
  { name: "shooter", start: "// ─── SHOOTER ───" },
  { name: "tetris", start: "// ─── TETRIS ───" },
  { name: "memory", start: "// ─── MEMORY ───", extras: ["handleMemoryTap"] },
  { name: "whack", start: "// ─── WHACK ───", extras: ["handleWhackTap"] },
  { name: "dodge", start: "// ─── DODGE ───" },
  { name: "slide", start: "// ─── SLIDE (2048) ───" },
  { name: "catch", start: "// ─── CATCH ───" },
  { name: "cross", start: "// ─── CROSS (Frogger) ───" },
  { name: "stack", start: "// ─── STACK ───" },
  { name: "simon", start: "// ─── SIMON ───", extras: ["handleSimonTap"] },
  { name: "reaction", start: "// ─── REACTION ───", extras: ["startReactionWait", "handleReactionTap"] },
];

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing marker: ${startMarker}`);
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
  if (end === -1) throw new Error(`Missing end marker after: ${startMarker}`);
  return text.slice(start, end).trimEnd();
}

function transformBody(body) {
  return body
    .replace(/\bstateRef\.current\b/g, "deps.state")
    .replace(/\bkeysRef\.current\b/g, "deps.keys")
    .replace(/\btouchRef\.current\b/g, "deps.touch")
    .replace(/\bonScoreChange\b/g, "deps.onScoreChange")
    .replace(/\bonGameOver\b/g, "deps.onGameOver")
    .replace(/\bdrawPlayerEmoji\b/g, "deps.drawPlayerEmoji")
    .replace(/\bonlineSessionRef\b/g, "deps.onlineSessionRef")
    .replace(/\bisOnline\b/g, "deps.isOnline")
    .replace(/\bisMulti\b/g, "deps.isMulti")
    .replace(/\bendGame\(/g, "deps.endGame(")
    .replace(/(?<![.\w])score(?![:.\w])/g, "deps.scoreRef.current")
    .replace(/\bconfig\./g, "deps.config.")
    .replace(/\bsettings\./g, "deps.settings.")
    .replace(/\btheme\./g, "deps.theme.")
    .replace(/\bcanvas\./g, "deps.canvas.")
    .replace(/\bctx\./g, "deps.ctx.")
    .replace(/\bcanvas,/g, "deps.canvas,")
    .replace(/\bctx,/g, "deps.ctx,")
    .replace(/\bcanvas\)/g, "deps.canvas)")
    .replace(/\bctx\)/g, "deps.ctx)")
    .replace(/\bcanvas;/g, "deps.canvas;")
    .replace(/\bctx;/g, "deps.ctx;")
    .replace(/\(canvas /g, "(deps.canvas ")
    .replace(/\(canvas\)/g, "(deps.canvas)")
    .replace(/, canvas\./g, ", deps.canvas.")
    .replace(/, ctx\./g, ", deps.ctx.")
    .replace(/\bsyncFrame\b/g, "deps.syncFrame")
    .replace(/\blastGuestPaddleSent\b/g, "deps.lastGuestPaddleSent")
    .replace(/deps\.deps\./g, "deps.");
}

const outDir = path.join(root, "src/components/game-canvas/games");
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < games.length; i++) {
  const game = games[i];
  const endMarker = i < games.length - 1 ? games[i + 1].start : "    function handleMemoryTap";
  let chunk = extractBetween(src, game.start, endMarker);

  for (const extra of game.extras ?? []) {
    if (chunk.includes(`function ${extra}(`)) continue;
    const extraRe = new RegExp(`\\n    function ${extra}\\([\\s\\S]*?\\n    \\}`, "m");
    const match = src.match(extraRe);
    if (match) chunk += "\n\n" + match[0].trim();
  }

  chunk = transformBody(chunk);

  const cap = game.name.charAt(0).toUpperCase() + game.name.slice(1);
  const exports = ["init", "update", "draw"];
  if (game.extras?.includes("handleClickerKeys")) exports.push("handleClickerKeys");
  if (game.extras?.includes("handleMemoryTap")) exports.push("handleMemoryTap");
  if (game.extras?.includes("handleWhackTap")) exports.push("handleWhackTap");
  if (game.extras?.includes("handleSimonTap")) exports.push("handleSimonTap");
  if (game.extras?.includes("handleReactionTap")) exports.push("handleReactionTap");

  const fnMap = {
    init: `init${cap}`,
    update: `update${cap}`,
    draw: `draw${cap}`,
    handleClickerKeys: "handleClickerKeys",
    handleMemoryTap: "handleMemoryTap",
    handleWhackTap: "handleWhackTap",
    handleSimonTap: "handleSimonTap",
    handleReactionTap: "handleReactionTap",
  };

  const body = chunk
    .replace(/^    /gm, "")
    .replace(/^function /gm, "function ");

  const returnObj = exports
    .map((key) => `    ${key}: ${fnMap[key] ?? key},`)
    .join("\n");

  const file = `import type { GameDeps } from "@/components/game-canvas/types";

export function create${cap}Game(deps: GameDeps) {
${body
  .split("\n")
  .map((line) => (line ? `  ${line}` : ""))
  .join("\n")}

  return {
${returnObj}
  };
}
`;

  fs.writeFileSync(path.join(outDir, `${game.name}.ts`), file);
  console.log(`Wrote ${game.name}.ts`);
}
