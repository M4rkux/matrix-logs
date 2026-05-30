const CSI = "\x1b[";

// ─── Configurable ────────────────────────────────────────────
const COL_GAP = 2; // terminal columns of blank space between logical columns
const REPEAT_GAP = 3; // blank rows between repetitions of the same line in a column
// ─────────────────────────────────────────────────────────────

const clr = {
  brightWhite: CSI + "1;97m",
  brightGreen: CSI + "1;32m",
  green: CSI + "0;32m",
  dimGreen: CSI + "2;32m",
  reset: CSI + "0m",
};

interface Drop {
  head: number; // current head row (1-indexed), moves downward each advance
  len: number; // trail length in rows
  speed: number; // ticks between advances
  timer: number;
  cursor: number; // how many chars consumed from the line so far
  phase: "drop" | "scroll";
  scrollTicksLeft: number; // ticks remaining in scroll phase before restart
  contentBottom: number; // 0-indexed row of the content's bottom edge (scroll phase)
  line: string; // snapshot of the line at drop creation — decoupled from lineBuffer shifts
}

let TERM_W = process.stdout.columns || 80;
let H = process.stdout.rows || 24;

const COL_STRIDE = 1 + COL_GAP;
let NUM_COLS = Math.floor(TERM_W / COL_STRIDE);

// lineBuffer[0] = newest, lineBuffer[NUM_COLS-1] = oldest shown
// logical column lc  →  lineBuffer[NUM_COLS - 1 - lc]
//   lc = NUM_COLS-1 (rightmost) → lineBuffer[0] (newest)
const lineBuffer: string[] = [];

// Per-column character grids: chars written by the drop as it passes through
let colGrids: string[][] = Array.from({ length: NUM_COLS }, () =>
  Array<string>(H).fill(" "),
);
let drops: (Drop | null)[] = Array.from({ length: NUM_COLS }, () => null);

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

function resize() {
  TERM_W = process.stdout.columns || 80;
  H = process.stdout.rows || 24;
  NUM_COLS = Math.floor(TERM_W / COL_STRIDE);
  colGrids = Array.from({ length: NUM_COLS }, () => Array<string>(H).fill(" "));
  drops = Array.from({ length: NUM_COLS }, (_, lc) => {
    const line = lineBuffer[NUM_COLS - 1 - lc];
    return line !== undefined ? mkDrop(line) : null;
  });
}

function addLine(line: string) {
  lineBuffer.unshift(line);
  if (lineBuffer.length > NUM_COLS) lineBuffer.pop();

  // Rightmost column always gets a fresh drop for the incoming line
  drops[NUM_COLS - 1] = mkDrop(line);

  // Start drops for columns that just received content for the first time
  for (let lc = 0; lc < NUM_COLS - 1; lc++) {
    const assigned = lineBuffer[NUM_COLS - 1 - lc];
    if (assigned !== undefined && (drops[lc] ?? null) === null) {
      drops[lc] = mkDrop(assigned, (Math.random() * 6) | 0);
    }
  }
}

// Consumes the next char from d.line, advancing d.cursor.
// Line is traversed reversed (last char first), followed by REPEAT_GAP spaces.
// Returns " " once fully consumed (no cycling — one pass per drop+scroll cycle).
function consumeChar(d: Drop): string {
  if (d.line.length === 0) return " ";
  const totalLength = d.line.length + REPEAT_GAP;
  if (d.cursor >= totalLength) return " ";
  const pos = d.cursor++;
  return pos < d.line.length ? (d.line[d.line.length - 1 - pos] ?? " ") : " ";
}

function tick() {
  for (let lc = 0; lc < NUM_COLS; lc++) {
    const d = drops[lc] ?? null;
    if (d === null) continue;

    if (--d.timer <= 0) {
      d.timer = d.speed;

      if (d.phase === "drop") {
        d.head++;

        if (d.head >= 1 && d.head <= H) {
          const grid = colGrids[lc];
          if (grid) grid[d.head - 1] = consumeChar(d);
        }

        // Trailing glow fully off-screen → switch to scroll phase
        if (d.head - d.len > H || d.cursor >= d.line.length) {
          const totalLength = d.line.length + REPEAT_GAP;
          const remaining = Math.max(0, totalLength - d.cursor);
          d.phase = "scroll";
          d.scrollTicksLeft = remaining + H;
          // bottom of char content: last char row, capped at screen bottom
          d.contentBottom = Math.min(d.line.length - 1, H - 1);
        }
      } else {
        // Scroll phase: shift entire grid down one row, new char enters at top
        const grid = colGrids[lc];
        if (grid) {
          for (let r = H - 1; r > 0; r--) grid[r] = grid[r - 1] ?? " ";
          grid[0] = consumeChar(d);
        }

        d.contentBottom++;

        if (--d.scrollTicksLeft <= 0) {
          // Clear grid and restart drop for next cycle
          colGrids[lc]?.fill(" ");
          const nextLine = lineBuffer[NUM_COLS - 1 - lc];
          drops[lc] = nextLine !== undefined ? mkDrop(nextLine) : null;
        }
      }
    }
  }
}

function render() {
  const out: string[] = [CSI + "H"];
  let cur = "";
  const setC = (c: string) => {
    if (c !== cur) {
      out.push(c);
      cur = c;
    }
  };

  for (let r = 0; r < H; r++) {
    const row1 = r + 1;

    for (let lc = 0; lc < NUM_COLS; lc++) {
      const ch = colGrids[lc]?.[r] ?? " ";
      const d = drops[lc] ?? null;
      let color = clr.dimGreen;

      if (d !== null && d.head >= 1) {
        if (d.phase === "drop") {
          const dist = d.head - row1; // 0 = head, 1..len = trail above head
          if (dist === 0) {
            color = clr.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? clr.brightGreen
                : ratio < 0.6
                  ? clr.green
                  : clr.dimGreen;
          }
        } else {
          // scroll phase: glow anchored at contentBottom (mirrors drop trail, upward)
          const dist = d.contentBottom - r; // 0 = bottom edge, positive = above it
          if (dist === 0 && d.contentBottom < H) {
            color = clr.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? clr.brightGreen
                : ratio < 0.6
                  ? clr.green
                  : clr.dimGreen;
          }
        }
      }

      if (ch === " " && color === clr.dimGreen) {
        setC(clr.reset);
      } else {
        setC(color);
      }
      out.push(ch);

      if (lc < NUM_COLS - 1) {
        setC(clr.reset);
        out.push(" ".repeat(COL_GAP));
      }
    }

    out.push(clr.reset + CSI + "K");
    cur = "";
    if (r < H - 1) out.push("\r\n");
  }

  process.stdout.write(out.join(""));
}

// ─── Setup ───────────────────────────────────────────────────
if (!process.stdout.isTTY) {
  console.error("stdout must be a TTY — pipe input, not output");
  process.exit(1);
}

process.stdout.write(clr.reset + CSI + "?25l" + CSI + "2J" + CSI + "H");
process.on("SIGWINCH", resize);

function cleanup() {
  process.stdout.write(clr.reset + CSI + "?25h" + CSI + "2J" + CSI + "H");
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

if (!process.stdin.isTTY) {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", addLine);
} else {
  const demo = [
    "matrix-logs: pipe any command here",
    "64 bytes from google.com: icmp_seq=1 ttl=116 time=11.2 ms",
    "64 bytes from google.com: icmp_seq=2 ttl=116 time=10.8 ms",
    "ping google.com | bun start",
    "journalctl -f | bun start",
  ];
  for (const line of demo) addLine(line);
}

const FPS = 20;
setInterval(
  () => {
    tick();
    render();
  },
  (1000 / FPS) | 0,
);
