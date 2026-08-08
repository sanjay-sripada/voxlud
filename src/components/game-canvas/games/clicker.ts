import type { GameDeps } from "@/components/game-canvas/types";

export function createClickerGame(deps: GameDeps) {
  // ─── CLICKER ───
  function initClicker() {
    deps.state = {
      coins: 0,
      perClick: 1,
      perSecond: 0,
      upgrades: [
        { name: "Better Tap", cost: 10, level: 0, effect: "click" },
        { name: "Auto Worker", cost: 50, level: 0, effect: "auto" },
        { name: "Mega Boost", cost: 200, level: 0, effect: "click" },
      ],
      clickAnim: 0,
      theme: deps.settings.theme as string,
    };
  }

  function updateClicker() {
    const s = deps.state as {
      coins: number;
      perSecond: number;
      clickAnim: number;
    };
    s.coins += s.perSecond / 60;
    deps.scoreRef.current = Math.floor(s.coins);
    deps.onScoreChange?.(deps.scoreRef.current);
    if (s.clickAnim > 0) s.clickAnim -= 0.05;
  }

  function drawClicker() {
    const s = deps.state as {
      coins: number;
      perClick: number;
      perSecond: number;
      upgrades: { name: string; cost: number; level: number; effect: string }[];
      clickAnim: number;
      theme: string;
    };

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    const cx = deps.canvas.width / 2;
    const cy = deps.canvas.height / 2 - 40;
    const scale = 1 + s.clickAnim * 0.2;

    deps.ctx.save();
    deps.ctx.translate(cx, cy);
    deps.ctx.scale(scale, scale);
    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.beginPath();
    deps.ctx.arc(0, 0, 60, 0, Math.PI * 2);
    deps.ctx.fill();
    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "bold 24px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.textBaseline = "middle";
    deps.ctx.fillText(s.theme === "cafe" ? "☕" : "🪙", 0, 0);
    deps.ctx.restore();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "bold 28px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText(`${Math.floor(s.coins)} coins`, cx, cy + 100);
    deps.ctx.font = "14px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText(`+${s.perClick}/click  +${s.perSecond.toFixed(1)}/sec`, cx, cy + 130);

    s.upgrades.forEach((u, i) => {
      const y = deps.canvas.height - 120 + i * 36;
      const canBuy = s.coins >= u.cost;
      deps.ctx.fillStyle = canBuy ? deps.theme.secondary + "44" : "#ffffff11";
      deps.ctx.beginPath();
      deps.ctx.roundRect(20, y, deps.canvas.width - 40, 30, 6);
      deps.ctx.fill();
      deps.ctx.fillStyle = canBuy ? "#fff" : "#ffffff66";
      deps.ctx.font = "13px sans-serif";
      deps.ctx.textAlign = "left";
      deps.ctx.fillText(`${u.name} (Lv.${u.level}) — ${u.cost}`, 32, y + 20);
    });

    deps.ctx.fillStyle = "#ffffff66";
    deps.ctx.font = "12px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap circle & upgrades! Press 1/2/3 on desktop", cx, deps.canvas.height - 16);
  }

  function handleClickerKeys() {
    if (deps.config.type !== "clicker") return;
    const s = deps.state as {
      coins: number;
      perClick: number;
      perSecond: number;
      upgrades: { name: string; cost: number; level: number; effect: string }[];
    };
    const keys = deps.keys;
    ["1", "2", "3"].forEach((k, i) => {
      if (keys.has(k)) {
        const u = s.upgrades[i];
        if (u && s.coins >= u.cost) {
          s.coins -= u.cost;
          u.level++;
          u.cost = Math.floor(u.cost * 1.5);
          if (u.effect === "click") s.perClick += u.level;
          else s.perSecond += u.level * 0.5;
        }
        deps.keys.delete(k);
      }
    });
  }

  return {
    init: initClicker,
    update: updateClicker,
    draw: drawClicker,
    handleClickerKeys: handleClickerKeys,
  };
}
