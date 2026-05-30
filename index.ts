import {
  CSI,
  colors,
  INITIAL_FPS,
  MIN_FPS,
  MAX_FPS,
  FPS_STEP,
} from "./src/config";
import {
  addLine,
  isPaused,
  navigateLeft,
  navigateRight,
  pause,
  resume,
  resize,
  tick,
} from "./src/simulation";
import { render } from "./src/render";
import { excuses, prefixes } from "./src/excuses";
import { clearSession, getLastLogId, getLogsSince } from "./src/storage";
import { ReadStream } from "node:tty";
import { openSync } from "node:fs";
import { basename } from "node:path";

const argv0 = basename(process.argv[0]!);
const cmd = process.env.npm_lifecycle_event
  ? `bun ${process.env.npm_lifecycle_event}`
  : argv0 === "bun"
    ? basename(process.argv[1]!)
    : argv0;

let excuse = excuses[(Math.random() * excuses.length) | 0];
let prefix = prefixes[(Math.random() * prefixes.length) | 0];
const _error = console.error;
let oldArgs: string | null = null;
console.error = (...args: unknown[]) => {
  if (oldArgs !== JSON.stringify(args)) {
    excuse = excuses[(Math.random() * excuses.length) | 0];
    prefix = prefixes[(Math.random() * prefixes.length) | 0];
    oldArgs = JSON.stringify(args);
  }
  _error(...args, `\n— ${prefix}${excuse}`);
};

if (!process.stdout.isTTY) {
  console.error("stdout must be a TTY — pipe input, not output");
  process.exit(1);
}

process.stdout.write(colors.reset + CSI + "?25l" + CSI + "2J" + CSI + "H");
process.on("SIGWINCH", resize);

let pauseStartId = 0;

function togglePause() {
  if (!isPaused) {
    pauseStartId = getLastLogId();
    pause();
  } else {
    resume(getLogsSince(pauseStartId));
  }
}

const ttyFd = openSync("/dev/tty", "r+");
const keyboard = new ReadStream(ttyFd);
keyboard.setRawMode(true);
keyboard.resume();
keyboard.on("data", (chunk: Buffer) => {
  const key = chunk.toString();
  switch (key) {
    case "p":
    case "P":
      togglePause();
      break;
    case "+":
      setFps(Math.min(MAX_FPS, fps + FPS_STEP));
      break;
    case "-":
      setFps(Math.max(MIN_FPS, fps - FPS_STEP));
      break;
    case "0":
      setFps(INITIAL_FPS);
      break;
    case "h":
    case "H":
    case "\x1b[D": // left arrow
      navigateLeft();
      break;
    case "l":
    case "L":
    case "\x1b[C": // right arrow
      navigateRight();
      break;
    case "\x03":
      process.emit("SIGINT", "SIGINT");
      break;
  }
});

function cleanup() {
  clearSession();
  process.stdout.write(colors.reset + CSI + "?25h" + CSI + "2J" + CSI + "H");
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

if (!process.stdin.isTTY) {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", addLine);
} else {
  process.stdout.write(colors.reset + CSI + "?25h" + CSI + "2J" + CSI + "H");

  console.log("Modo de usar:\n");
  console.log(`  ping codecon.dev | ${cmd}`);
  console.log(`  cat arquivo.log | ${cmd}`);
  console.log(`  journalctl -f | ${cmd}`);
  process.exit(0);
}

let fps = INITIAL_FPS;
let intervalId: ReturnType<typeof setInterval>;

function setFps(value: number) {
  fps = value;
  clearInterval(intervalId);
  intervalId = setInterval(loop, (1000 / fps) | 0);
}

function loop() {
  if (isPaused) return;
  tick();
  render();
}

intervalId = setInterval(loop, (1000 / fps) | 0);
