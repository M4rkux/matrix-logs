import { COL_GAP, DEBUG_SERVER_URL } from "./config";
import type { Drop } from "./config";
import { insertLog } from "./storage";

export let isPaused = false;
export let isRealTime = true;

export let WIDTH = process.stdout.columns || 80;
export let HEIGHT = process.stdout.rows || 24;

const COL_STRIDE = 1 + COL_GAP;
export let NUM_COLS = Math.floor(WIDTH / COL_STRIDE);

export const lineBuffer: string[] = [];

export async function log(body: string) {
  if (!process.env.DEBUG) return;
  try {
    await fetch(`${DEBUG_SERVER_URL}/log`, { method: "POST", body });
  } catch (e) {
    console.error("failed to log", e);
  }
}

export let colGrids: string[][] = Array.from({ length: NUM_COLS }, () =>
  Array<string>(HEIGHT).fill(" "),
);
export let drops: (Drop | null)[] = Array.from(
  { length: NUM_COLS },
  () => null,
);

function mkDrop(line: string, timerOffset = 0): Drop {
  return {
    head: 0,
    len: 5 + ((Math.random() * 15) | 0),
    speed: 1,
    timer: 1 + timerOffset,
    cursor: 0,
    phase: "drop",
    scrollTicksLeft: 0,
    contentBottom: 0,
    line,
  };
}

export function resize() {
  WIDTH = process.stdout.columns || 80;
  HEIGHT = process.stdout.rows || 24;
  NUM_COLS = Math.floor(WIDTH / COL_STRIDE);
  colGrids = Array.from({ length: NUM_COLS }, () =>
    Array<string>(HEIGHT).fill(" "),
  );
  drops = Array.from({ length: NUM_COLS }, (_, lc) => {
    const line = lineBuffer[NUM_COLS - 1 - lc];
    return line !== undefined ? mkDrop(line) : null;
  });
}

function addLineToDisplay(line: string) {
  lineBuffer.unshift(line);
  if (lineBuffer.length > NUM_COLS) lineBuffer.pop();

  if (drops[NUM_COLS - 1] === null) {
    drops[NUM_COLS - 1] = mkDrop(line);
    log(JSON.stringify(drops[NUM_COLS - 1]));
  }

  for (let lc = 0; lc < NUM_COLS - 1; lc++) {
    const assigned = lineBuffer[NUM_COLS - 1 - lc];
    if (assigned !== undefined && (drops[lc] ?? null) === null) {
      drops[lc] = mkDrop(assigned, (Math.random() * 6) | 0);
    }
  }
}

export function addLine(line: string) {
  insertLog(line);
  if (isPaused) return;
  addLineToDisplay(line);
}

export function pause() {
  isPaused = true;
}

export function resume(missedLines: string[]) {
  isRealTime = false;
  isPaused = false;
  for (const line of missedLines) addLineToDisplay(line);
  isRealTime = true;
}

function consumeChar(d: Drop): string {
  if (d.line.length === 0) return " ";
  if (d.cursor >= d.line.length) return " ";
  const pos = d.cursor++;
  return pos < d.line.length ? (d.line[d.line.length - 1 - pos] ?? " ") : " ";
}

export function tick() {
  for (let lc = 0; lc < NUM_COLS; lc++) {
    const d = drops[lc] ?? null;
    if (d === null) continue;

    if (--d.timer <= 0) {
      d.timer = d.speed;

      if (d.phase === "drop") {
        d.head++;

        if (d.head >= 1 && d.head <= HEIGHT) {
          const grid = colGrids[lc];
          if (grid) grid[d.head - 1] = consumeChar(d);
        }

        if (d.head - d.len > HEIGHT || d.head > d.cursor) {
          const remaining = Math.max(0, d.line.length - d.cursor);
          d.phase = "scroll";
          d.scrollTicksLeft = remaining + HEIGHT;
          d.contentBottom = Math.min(d.line.length - 1, HEIGHT - 1);
        }
      } else {
        const grid = colGrids[lc];
        if (grid) {
          for (let r = HEIGHT - 1; r > 0; r--) grid[r] = grid[r - 1] ?? " ";
          grid[0] = consumeChar(d);
        }

        d.contentBottom++;

        if (--d.scrollTicksLeft <= 0) {
          colGrids[lc]?.fill(" ");
          const nextLine = lineBuffer[NUM_COLS - 1 - lc];
          drops[lc] = nextLine !== undefined ? mkDrop(nextLine) : null;
        }
      }
    }
  }
}
